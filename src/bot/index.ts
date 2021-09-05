import { Args, Db, Vaults } from "./types";
// TODO: remove unused dependencies
import { BigNumber, Contract, Event, EventFilter, Wallet, providers, utils } from "ethers";
import { LAST_SYNCED_BLOCK, VAULTS } from "./constants";
import { addressesAreEqual, batchQueryFilter, getUniswapV2PairInfo, initDb } from "../helpers";

import { BalanceSheetV1 as BalanceSheet } from "@hifi/protocol/typechain/BalanceSheetV1";
import { abi as BalanceSheetAbi } from "@hifi/protocol/artifacts/BalanceSheetV1.json";
import { HToken } from "@hifi/protocol/typechain/HToken";
import { abi as HTokenAbi } from "@hifi/protocol/artifacts/HToken.json";
import { HifiFlashUniswapV2 as HifiFlashSwap } from "@hifi/flash-swap/typechain/HifiFlashUniswapV2";
import { abi as HifiFlashUniswapAbi } from "@hifi/flash-swap/artifacts/HifiFlashUniswapV2.json";
import { IUniswapV2Pair as UniswapV2Pair } from "@hifi/flash-swap/typechain/IUniswapV2Pair";
import { abi as UniswapV2PairAbi } from "@hifi/flash-swap/artifacts/IUniswapV2Pair.json";

// TODO: replace with improved logging/cloud logging
const log = console.log;

export class Bot {
  private db: Db;
  private deployments: {
    balanceSheet: BalanceSheet;
    hifiFlashSwap: HifiFlashSwap;
  };
  private network;
  private persistence;
  private provider;
  private signer;
  private silentMode;

  constructor(args: Args) {
    this.db = initDb(args.persistence);
    this.db.default({ lastSyncedBlock: -1, vaults: {} });
    this.network = args.network;
    this.persistence = args.persistence;
    this.provider = args.provider;
    this.signer = args.signer;
    this.silentMode = args.silentMode;

    this.deployments = {
      balanceSheet: new Contract(this.network.contracts.balanceSheet, BalanceSheetAbi, this.signer) as BalanceSheet,
      hifiFlashSwap: new Contract(
        this.network.contracts.hifiFlashSwap,
        HifiFlashUniswapAbi,
        this.signer,
      ) as HifiFlashSwap,
    };
  }

  // getter methods
  public vaults(): Vaults {
    return this.db.get(VAULTS).value();
  }

  // effects
  public async liquidateAllUnderwater(): Promise<void> {
    const vaults = this.db.get(VAULTS).value() as Vaults;
    const accounts = Object.keys(vaults);
    for (const account of accounts) {
      const { bonds, collaterals } = vaults[account];
      const { shortfallLiquidity } = await this.deployments.balanceSheet.getCurrentAccountLiquidity(account);
      const isUnderwater = shortfallLiquidity.gt(0);
      if (isUnderwater) {
        for (const bond of bonds) {
          const debtAmount = await this.deployments.balanceSheet.getDebtAmount(account, bond);
          if (debtAmount.gt(0)) {
            const hToken = new Contract(bond, HTokenAbi, this.signer) as HToken;
            // TODO: cache the underlying address
            const underlying = await hToken.underlying();
            const underlyingPrecisionScalar = await hToken.underlyingPrecisionScalar();
            for (const collateral of collaterals) {
              // TODO: check rest of collateral is still claimable after a partial liquidation
              const {
                pair: pairAddress,
                token0,
                token1,
              } = getUniswapV2PairInfo({
                factoryAddress: this.network.uniswap.factory,
                initCodeHash: this.network.uniswap.initCodeHash,
                tokenA: collateral,
                tokenB: underlying,
              });
              const pair = new Contract(pairAddress, UniswapV2PairAbi, this.signer) as UniswapV2Pair;
              // TODO: liquidate collateral(s) of underwater borrow position
              // TODO: decide on liquidation strategy (one collateral part or whole vault liquidation)
              // TODO: profitibility calculation for liquidation
              await pair.swap(
                addressesAreEqual(token0, underlying) ? debtAmount.div(underlyingPrecisionScalar) : 0,
                addressesAreEqual(token1, underlying) ? debtAmount.div(underlyingPrecisionScalar) : 0,
                this.network.contracts.hifiFlashSwap,
                utils.defaultAbiCoder.encode(
                  ["tuple(address borrower, address bond, uint256 minProfit)"],
                  [
                    {
                      borrower: account,
                      bond: bond,
                      minProfit: "0",
                    },
                  ],
                ),
              );
            }
          }
        }
      }
    }
  }

  public async run(): Promise<void> {
    if (!this.silentMode) {
      log("Starting Hifi liquidator");
      log("Profits will be sent to %s", await this.signer.getAddress());
      log("Data persistence is enabled: %s", this.persistence);
      log("BalanceSheet: %s", this.network.contracts.balanceSheet);
      log("HTokens: %s", this.network.contracts.htokens);
      log("HifiFlashSwap: %s", this.network.contracts.hifiFlashSwap);
    }

    await this.syncAll();

    this.provider.on("block", async blockNumber => {
      if (!this.silentMode) {
        log("Block #%s", blockNumber);
      }
      await this.syncAll(blockNumber);
      await this.liquidateAllUnderwater();
    });
  }

  public stop(): void {
    log("Stopping Hifi liquidator");
    this.provider.removeAllListeners();
  }

  public async syncAll(_latestBlock?: number): Promise<void> {
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
        log("Captured %s borrow event(s)", borrowEvents.length);
      }
      if (depositEvents.length > 0) {
        log("Captured %s deposit event(s)", depositEvents.length);
      }
    }

    // event decoding/processing
    for (let i = 0; i < borrowEvents.length; i++) {
      const event = borrowEvents[i];
      if (event.decode === undefined) throw Error("Event is not decodable");
      const { account, bond }: { account: string; bond: string } = event.decode(event.data, event.topics);
      const vaults = this.db.get(VAULTS).value() as Vaults;
      if (vaults[account] === undefined) {
        vaults[account] = {
          bonds: [],
          collaterals: [],
        };
      }
      if (!vaults[account].bonds.includes(bond)) {
        vaults[account].bonds = [...vaults[account].bonds, bond];
      }
      this.db.set(VAULTS, vaults);
      await this.db.save();
    }
    for (let i = 0; i < depositEvents.length; i++) {
      const event = depositEvents[i];
      if (event.decode === undefined) throw Error("Event is not decodable");
      const { account, collateral }: { account: string; collateral: string } = event.decode(event.data, event.topics);
      const vaults = this.db.get(VAULTS).value() as Vaults;
      if (vaults[account] === undefined) {
        vaults[account] = {
          bonds: [],
          collaterals: [],
        };
      }
      if (!vaults[account].collaterals.includes(collateral)) {
        vaults[account].collaterals = [...vaults[account].collaterals, collateral];
      }
      this.db.set(VAULTS, vaults);
      await this.db.save();
    }

    this.db.set(LAST_SYNCED_BLOCK, latestBlock);
    await this.db.save();
  }
}
