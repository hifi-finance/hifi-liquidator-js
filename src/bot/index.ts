import {
  DUST_EPSILON,
  HTOKENS,
  LAST_SYNCED_BLOCK,
  UNISWAP_V2,
  UNISWAP_V2_INIT_CODE_HASH,
  UNISWAP_V3,
  VAULTS,
} from "../constants";
import { Logger, addressesAreEqual, batchQueryFilter, getUniswapV2PairInfo, initCache } from "../helpers";
import { BotArgs, Cache, Htokens, NetworkConfig, Vault, Vaults } from "../types";
import { MinInt256 } from "@ethersproject/constants";
import { IUniswapV2Pair } from "@hifi/flash-swap/dist/types/contracts/uniswap-v2/IUniswapV2Pair";
import { IFlashUniswapV3 } from "@hifi/flash-swap/dist/types/contracts/uniswap-v3/IFlashUniswapV3";
import { IUniswapV2Pair__factory } from "@hifi/flash-swap/dist/types/factories/contracts/uniswap-v2/IUniswapV2Pair__factory";
import { FlashUniswapV3__factory } from "@hifi/flash-swap/dist/types/factories/contracts/uniswap-v3/FlashUniswapV3__factory";
import { BalanceSheetV2 } from "@hifi/protocol/dist/types/contracts/core/balance-sheet/BalanceSheetV2";
import { HToken } from "@hifi/protocol/dist/types/contracts/core/h-token/HToken";
import { BalanceSheetV2__factory } from "@hifi/protocol/dist/types/factories/contracts/core/balance-sheet/BalanceSheetV2__factory";
import { HToken__factory } from "@hifi/protocol/dist/types/factories/contracts/core/h-token/HToken__factory";
import { BigNumber, BigNumberish, Contract, utils } from "ethers";

export class Bot {
  private cache: Cache;
  private deployments: {
    balanceSheet: BalanceSheetV2;
    flashUniswapV3?: IFlashUniswapV3;
  };
  private isBusy;
  private networkConfig: NetworkConfig;
  private persistenceEnabled;
  private provider;
  private selectedStrategy;
  private signer;

  constructor(args: BotArgs) {
    this.cache = initCache(args.persistenceEnabled, args.provider.network.name);
    this.cache.default({ htokens: {}, lastSyncedBlock: -1, vaults: {} });
    this.isBusy = false;
    this.networkConfig = args.networkConfig;
    this.persistenceEnabled = args.persistenceEnabled;
    this.provider = args.provider;
    this.selectedStrategy = args.selectedStrategy;
    this.signer = args.signer;

    this.deployments = {
      balanceSheet: new Contract(
        this.networkConfig.contracts.balanceSheet,
        BalanceSheetV2__factory.abi,
        this.signer,
      ) as BalanceSheetV2,
    };
    if (this.selectedStrategy === UNISWAP_V3) {
      if (!this.networkConfig.contracts.strategies[UNISWAP_V3]) {
        throw new Error("Uniswap V3 strategy is not supported on " + this.provider.network.name);
      }
      this.deployments.flashUniswapV3 = new Contract(
        this.networkConfig.contracts.strategies[UNISWAP_V3].flashSwap,
        FlashUniswapV3__factory.abi,
        this.signer,
      ) as IFlashUniswapV3;
    }
  }

  // getter methods
  private async isUnderwater(account: string): Promise<boolean> {
    const { shortfallLiquidity } = await this.deployments.balanceSheet.getCurrentAccountLiquidity(account);
    return shortfallLiquidity.gt(0);
  }

  private htokens(): Htokens {
    return this.cache.get(HTOKENS).value();
  }

  private vaults(): Vaults {
    return this.cache.get(VAULTS).value();
  }

  // effects
  private async cacheHtoken(htoken: string): Promise<void> {
    const htokens = this.htokens();
    if (htokens[htoken] === undefined) {
      const contract = new Contract(htoken, HToken__factory.abi, this.signer) as HToken;
      const maturity = (await contract.maturity()).toNumber();
      const underlying = await contract.underlying();
      const underlyingPrecisionScalar = (await contract.underlyingPrecisionScalar()).toNumber();
      htokens[htoken] = {
        maturity,
        underlying,
        underlyingPrecisionScalar,
      };
      this.cache.set(HTOKENS, htokens);
      await this.cache.save();
    }
  }

  private async clearHtoken(htoken: string): Promise<void> {
    const htokens = this.htokens();
    if (htokens[htoken] !== undefined) {
      delete htokens[htoken];
      this.cache.set(HTOKENS, htokens);
      await this.cache.save();
    }
  }

  private async liquidate(
    account: string,
    bond: string,
    collateral: string,
    underlyingAmount: BigNumber,
    underlying: string,
  ): Promise<void> {
    switch (this.selectedStrategy) {
      case UNISWAP_V2:
      default:
        {
          if (!this.networkConfig.contracts.strategies[UNISWAP_V2]) {
            throw new Error("Uniswap V2 strategy is not supported on " + this.provider.network.name);
          }
          const { pair, token0, token1 } = getUniswapV2PairInfo({
            factoryAddress: this.networkConfig.contracts.strategies[UNISWAP_V2].factory,
            initCodeHash: UNISWAP_V2_INIT_CODE_HASH,
            tokenA: collateral,
            tokenB: underlying,
          });
          const contract = new Contract(pair, IUniswapV2Pair__factory.abi, this.signer) as IUniswapV2Pair;
          // TODO: profitibility calculation for liquidation
          // TODO: pop the collateral from persistence list after liquidation
          const swapArgs: [BigNumberish, BigNumberish, string, string] = [
            addressesAreEqual(token0, underlying) ? underlyingAmount : 0,
            addressesAreEqual(token1, underlying) ? underlyingAmount : 0,
            this.networkConfig.contracts.strategies[UNISWAP_V2].flashSwap,
            utils.defaultAbiCoder.encode(
              ["tuple(address borrower, address bond, address collateral, int256 turnout)"],
              [
                {
                  borrower: account,
                  bond: bond,
                  collateral: collateral,
                  turnout: MinInt256,
                },
              ],
            ),
          ];
          // TODO: profitibility calculation (including gas)
          const gasLimit = await contract.estimateGas.swap(...swapArgs);
          const gasPrice = await this.provider.getGasPrice();
          const tx = await contract.swap(...swapArgs, { gasLimit, gasPrice });
          const receipt = await tx.wait(1);
          Logger.notice("Submitted liquidation at hash: %s", receipt.transactionHash);
        }
        break;
      case UNISWAP_V3:
        {
          if (!this.deployments.flashUniswapV3) {
            throw new Error("FlashUniswapV3 contract not initialized");
          }
          const tx = await this.deployments.flashUniswapV3.flashLiquidate({
            borrower: account,
            bond: bond,
            collateral: collateral,
            poolFee: 500,
            turnout: MinInt256,
            underlyingAmount: underlyingAmount,
          });
          const receipt = await tx.wait(1);
          Logger.notice("Submitted liquidation at hash: %s", receipt.transactionHash);
        }
        break;
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
                const underlyingAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
                if (repayAmount.gt(0)) {
                  await this.liquidate(account, htoken, collateral, underlyingAmount, underlying);
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
            if (await this.isUnderwater(account)) {
              const collateralAmount = await this.deployments.balanceSheet.getCollateralAmount(account, collateral);
              const debtAmount = await this.deployments.balanceSheet.getDebtAmount(account, bond);
              const hypotheticalRepayAmount = await this.deployments.balanceSheet.getRepayAmount(
                collateral,
                collateralAmount,
                bond,
              );
              const repayAmount = hypotheticalRepayAmount.gt(debtAmount) ? debtAmount : hypotheticalRepayAmount;
              const underlyingAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
              if (repayAmount.gt(0)) {
                await this.liquidate(account, bond, collateral, underlyingAmount, underlying);
              }
            } else {
              break liquidateAccount;
            }
          }
        }
      }
    }
  }

  public async run(): Promise<void> {
    Logger.notice("Starting Hifi liquidator");
    Logger.notice("Network: %s", this.provider.network.name);
    Logger.notice("Profits will be sent to: %s", await this.signer.getAddress());
    Logger.notice("Data persistence is enabled: %s", this.persistenceEnabled);
    Logger.notice("BalanceSheet: %s", this.networkConfig.contracts.balanceSheet);
    Logger.notice("FlashSwap: %s", this.networkConfig.contracts.strategies[this.selectedStrategy]?.flashSwap);
    Logger.notice("Last synced block: %s", Math.max(this.cache.get(LAST_SYNCED_BLOCK).value(), 0));

    await this.syncAll();
    // TODO: respond to Chainlink price update instead of new block
    // TODO: add cooldown time
    this.provider.on("block", async blockNumber => {
      if (!this.isBusy) {
        this.isBusy = true;
        Logger.info("Block #%s", blockNumber);
        await this.syncAll(blockNumber);
        await this.liquidateAllUnderwater();
        await this.liquidateAllMature(blockNumber);
        this.isBusy = false;
      }
    });
  }

  public stop(): void {
    Logger.notice("Stopping Hifi liquidator");
    this.provider.removeAllListeners();
  }

  private async syncAll(_latestBlock?: number): Promise<void> {
    const latestBlock = _latestBlock !== undefined ? _latestBlock : await this.provider.getBlockNumber();
    const startBlock = this.cache.get(LAST_SYNCED_BLOCK).value() + 1 || this.networkConfig.startBlock;
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
    if (borrowEvents.length > 0) {
      Logger.notice("Captured %s borrow event(s)", borrowEvents.length);
    }
    if (depositEvents.length > 0) {
      Logger.notice("Captured %s deposit event(s)", depositEvents.length);
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
    this.cache.set(LAST_SYNCED_BLOCK, latestBlock);
    await this.cache.save();
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
    this.cache.set(VAULTS, vaults);
    await this.cache.save();
  }
}
