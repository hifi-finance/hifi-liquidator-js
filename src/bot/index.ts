import { abi as UniswapV2PairAbi } from "@hifi/flash-swap/artifacts/IUniswapV2Pair.json";
import { IUniswapV2Pair as UniswapV2Pair } from "@hifi/flash-swap/typechain/IUniswapV2Pair";
import { abi as BalanceSheetAbi } from "@hifi/protocol/artifacts/BalanceSheetV1.json";
import { abi as HTokenAbi } from "@hifi/protocol/artifacts/HToken.json";
import { BalanceSheetV1 as BalanceSheet } from "@hifi/protocol/typechain/BalanceSheetV1";
import { HToken } from "@hifi/protocol/typechain/HToken";
import { BigNumber, BigNumberish, Contract, utils } from "ethers";

import { Logger, addressesAreEqual, batchQueryFilter, getUniswapV2PairInfo, initDb } from "../helpers";
import { DUST_EPSILON, HTOKENS, LAST_SYNCED_BLOCK, VAULTS } from "./constants";
import { Args, Db, Htokens, Vault, Vaults } from "./types";

export class Bot {
  private db: Db;
  private deployments: {
    balanceSheet: BalanceSheet;
  };
  private isBusy;
  private network;
  private persistence;
  private provider;
  private signer;
  private silentMode;

  constructor(args: Args) {
    this.db = initDb(args.persistence, args.provider.network.name);
    this.db.default({ htokens: {}, lastSyncedBlock: -1, vaults: {} });
    this.isBusy = false;
    this.network = args.network;
    this.persistence = args.persistence;
    this.provider = args.provider;
    this.signer = args.signer;
    this.silentMode = args.silentMode;

    this.deployments = {
      balanceSheet: new Contract(this.network.contracts.balanceSheet, BalanceSheetAbi, this.signer) as BalanceSheet,
    };
  }

  // getter methods
  private async isUnderwater(account: string): Promise<boolean> {
    const { shortfallLiquidity } = await this.deployments.balanceSheet.getCurrentAccountLiquidity(account);
    return shortfallLiquidity.gt(0);
  }

  private htokens(): Htokens {
    return this.db.get(HTOKENS).value();
  }

  private vaults(): Vaults {
    return this.db.get(VAULTS).value();
  }

  // effects
  private async cacheHtoken(htoken: string): Promise<void> {
    const htokens = this.htokens();
    if (htokens[htoken] === undefined) {
      const contract = new Contract(htoken, HTokenAbi, this.signer) as HToken;
      const maturity = (await contract.maturity()).toNumber();
      const underlying = await contract.underlying();
      const underlyingPrecisionScalar = (await contract.underlyingPrecisionScalar()).toNumber();
      htokens[htoken] = {
        maturity,
        underlying,
        underlyingPrecisionScalar,
      };
      this.db.set(HTOKENS, htokens);
      await this.db.save();
    }
  }

  private async clearHtoken(htoken: string): Promise<void> {
    const htokens = this.htokens();
    if (htokens[htoken] !== undefined) {
      delete htokens[htoken];
      this.db.set(HTOKENS, htokens);
      await this.db.save();
    }
  }

  private async liquidate(
    account: string,
    bond: string,
    collateral: string,
    swapAmount: BigNumber,
    underlying: string,
  ): Promise<void> {
    const { pair, token0, token1 } = addressesAreEqual(collateral, underlying)
      ? this.network.uniswap.underlyingPairs[underlying]
      : getUniswapV2PairInfo({
          factoryAddress: this.network.uniswap.factory,
          initCodeHash: this.network.uniswap.initCodeHash,
          tokenA: collateral,
          tokenB: underlying,
        });
    // TODO: split condition
    if ((await this.provider.getCode(pair)) !== "0x") {
      const contract = new Contract(pair, UniswapV2PairAbi, this.signer) as UniswapV2Pair;
      // TODO: profitibility calculation for liquidation
      // TODO: pop the collateral from persistence list after liquidation
      const swapArgs: [BigNumberish, BigNumberish, string, string] = [
        addressesAreEqual(token0, underlying) ? swapAmount : 0,
        addressesAreEqual(token1, underlying) ? swapAmount : 0,
        this.network.contracts.hifiFlashSwap,
        utils.defaultAbiCoder.encode(
          ["tuple(address borrower, address bond, uint8 repayType)"],
          [
            {
              borrower: account,
              bond: bond,
              repayType: addressesAreEqual(collateral, underlying) ? "0" : "1",
            },
          ],
        ),
      ];
      // TODO: profitibility calculation (including gas)
      // const g = await contract.estimateGas.swap(...swapArgs);
      const tx = await contract.swap(...swapArgs);
      const receipt = await tx.wait(1);
      Logger.notice("Submitted liquidation at hash: %s", receipt.transactionHash);
    }
  }

  private async liquidateAllMature(_latestBlock: number): Promise<void> {
    const vaults = this.vaults();
    const accounts = Object.keys(vaults);
    const htokens = this.htokens();
    const { timestamp } = await this.provider.getBlock(_latestBlock);
    for (const htoken in htokens) {
      if (timestamp >= htokens[htoken].maturity) {
        for (const account of accounts) {
          const { bonds, collaterals } = vaults[account];
          if (bonds.includes(htoken)) {
            const debtAmount = await this.deployments.balanceSheet.getDebtAmount(account, htoken);
            if (debtAmount.gt(0)) {
              const { underlying, underlyingPrecisionScalar } = htokens[htoken];
              for (const collateral of collaterals) {
                const collateralAmount = await this.deployments.balanceSheet.getCollateralAmount(account, collateral);
                const debtAmount = await this.deployments.balanceSheet.getDebtAmount(account, htoken);
                const hypotheticalRepayAmount = await this.deployments.balanceSheet.getRepayAmount(
                  collateral,
                  collateralAmount,
                  htoken,
                );
                const repayAmount = hypotheticalRepayAmount.gt(debtAmount) ? debtAmount : hypotheticalRepayAmount;
                const swapAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
                if (repayAmount.gt(0)) {
                  await this.liquidate(account, htoken, collateral, swapAmount, underlying);
                }
              }
            }
            await this.updateVaults(account, "pop", { bonds: htoken });
          }
        }
        await this.clearHtoken(htoken);
      }
    }
  }

  private async liquidateAllUnderwater(): Promise<void> {
    const vaults = this.vaults();
    const accounts = Object.keys(vaults);
    for (const account of accounts) {
      const { bonds, collaterals } = vaults[account];
      if (await this.isUnderwater(account)) {
        liquidateAccount: for (const bond of bonds) {
          const { underlying, underlyingPrecisionScalar } = this.htokens()[bond];
          for (const collateral of collaterals) {
            const collateralAmount = await this.deployments.balanceSheet.getCollateralAmount(account, collateral);
            const repayAmount = await this.deployments.balanceSheet.getRepayAmount(collateral, collateralAmount, bond);
            const swapAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
            if ((await this.isUnderwater(account)) && repayAmount.gt(0)) {
              await this.liquidate(account, bond, collateral, swapAmount, underlying);
            } else {
              break liquidateAccount;
            }
          }
        }
      }
    }
  }

  public async run(): Promise<void> {
    if (!this.silentMode) {
      Logger.info("Starting Hifi liquidator");
      Logger.info("Network: %s", this.provider.network.name);
      Logger.info("Profits will be sent to %s", await this.signer.getAddress());
      Logger.info("Data persistence is enabled: %s", this.persistence);
      Logger.info("BalanceSheet: %s", this.network.contracts.balanceSheet);
      Logger.info("HifiFlashSwap: %s", this.network.contracts.hifiFlashSwap);
    }

    await this.syncAll();
    this.provider.on("block", async blockNumber => {
      if (!this.isBusy) {
        this.isBusy = true;
        if (!this.silentMode) {
          Logger.info("Block #%s", blockNumber);
        }
        await this.syncAll(blockNumber);
        await this.liquidateAllUnderwater();
        await this.liquidateAllMature(blockNumber);
        this.isBusy = false;
      }
    });
  }

  public stop(): void {
    Logger.info("Stopping Hifi liquidator");
    this.provider.removeAllListeners();
  }

  private async syncAll(_latestBlock?: number): Promise<void> {
    const latestBlock = _latestBlock !== undefined ? _latestBlock : await this.provider.getBlockNumber();
    const startBlock = this.db.get(LAST_SYNCED_BLOCK).value() + 1 || this.network.startBlock;
    // TODO: cross-check debt amounts with RepayBorrow event to ignore 0 debt bonds
    const borrowEvents = await batchQueryFilter(
      this.deployments.balanceSheet,
      this.deployments.balanceSheet.filters.Borrow(null, null, null),
      startBlock,
      latestBlock,
    );
    const depositEvents = await batchQueryFilter(
      this.deployments.balanceSheet,
      this.deployments.balanceSheet.filters.DepositCollateral(null, null, null),
      startBlock,
      latestBlock,
    );
    if (!this.silentMode) {
      if (borrowEvents.length > 0) {
        Logger.info("Captured %s borrow event(s)", borrowEvents.length);
      }
      if (depositEvents.length > 0) {
        Logger.info("Captured %s deposit event(s)", depositEvents.length);
      }
    }
    // event decoding/processing
    for (let i = 0; i < borrowEvents.length; i++) {
      const event = borrowEvents[i];
      if (event.decode === undefined) throw Error("Event is not decodable");
      const { account, bond }: { account: string; bond: string } = event.decode(event.data, event.topics);
      await this.cacheHtoken(bond);
      await this.updateVaults(account, "push", { bonds: bond });
    }
    for (let i = 0; i < depositEvents.length; i++) {
      const event = depositEvents[i];
      if (event.decode === undefined) throw Error("Event is not decodable");
      const { account, collateral }: { account: string; collateral: string } = event.decode(event.data, event.topics);
      await this.updateVaults(account, "push", { collaterals: collateral });
    }
    this.db.set(LAST_SYNCED_BLOCK, latestBlock);
    await this.db.save();
  }

  private async updateVaults(
    account: string,
    type: "pop" | "push",
    fragment: { [key: string]: string },
  ): Promise<void> {
    const vaults = this.vaults();
    if (vaults[account] === undefined) {
      vaults[account] = {
        bonds: [],
        collaterals: [],
      };
    }
    const key = Object.keys(fragment)[0] as keyof Vault;
    if (type === "pop") {
      if (vaults[account][key].includes(fragment[key])) {
        vaults[account][key] = vaults[account][key].filter(i => i !== fragment[key]);
      }
    } else if (type === "push") {
      if (!vaults[account][key].includes(fragment[key])) {
        vaults[account][key] = [...vaults[account][key], fragment[key]];
      }
    }
    this.db.set(VAULTS, vaults);
    await this.db.save();
  }
}
