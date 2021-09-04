import { Args, Db, Vaults } from "./types";
import { BigNumber, Contract, Event, EventFilter, Wallet, providers } from "ethers";
import { LAST_SYNCED_BLOCK, VAULTS } from "./constants";
import { batchQueryFilter, initDb } from "../helpers";

import { BalanceSheetV1 as BalanceSheet } from "@hifi/protocol/typechain/BalanceSheetV1";
import { abi as BalanceSheetAbi } from "@hifi/protocol/artifacts/BalanceSheetV1.json";
import { HifiFlashUniswapV2 as HifiFlashUniswap } from "@hifi/flash-swap/typechain/HifiFlashUniswapV2";
import { abi as HifiFlashUniswapAbi } from "@hifi/flash-swap/artifacts/HifiFlashUniswapV2.json";
import { IUniswapV2Pair as UniswapV2Pair } from "@hifi/flash-swap/typechain/IUniswapV2Pair";
import { abi as UniswapV2PairAbi } from "@hifi/flash-swap/artifacts/IUniswapV2Pair.json";

// TODO: replace with improved logging/cloud logging
const log = console.log;

export class Bot {
  private contracts;
  private db: Db;
  private deployments: {
    balanceSheet: BalanceSheet;
    hifiFlashSwap: HifiFlashUniswap;
    wbtcUsdcPair: UniswapV2Pair;
    wethUsdcPair: UniswapV2Pair;
  };
  private persistence;
  private provider;
  private signer;
  private silentMode;
  private startBlock;

  constructor(args: Args) {
    this.contracts = args.network.contracts;
    this.db = initDb(args.persistence);
    this.db.default({ lastSyncedBlock: -1, vaults: {} });
    this.persistence = args.persistence;
    this.provider = args.provider;
    this.signer = args.signer;
    this.silentMode = args.silentMode;
    this.startBlock = args.network.startBlock;

    this.deployments = {
      balanceSheet: new Contract(this.contracts.balanceSheet, BalanceSheetAbi, this.signer) as BalanceSheet,
      hifiFlashSwap: new Contract(this.contracts.hifiFlashSwap, HifiFlashUniswapAbi, this.signer) as HifiFlashUniswap,
      wbtcUsdcPair: new Contract(this.contracts.wbtcUsdcPair, UniswapV2PairAbi, this.signer) as UniswapV2Pair,
      wethUsdcPair: new Contract(this.contracts.wethUsdcPair, UniswapV2PairAbi, this.signer) as UniswapV2Pair,
    };
  }

  // getter methods
  public vaults(): Vaults {
    return this.db.get(VAULTS).value();
  }

  // effects
  public async liquidateAllUnderwater(): Promise<void> {}

  public async run(): Promise<void> {
    if (!this.silentMode) {
      log("Starting Hifi liquidator");
      log("Profits will be sent to %s", await this.signer.getAddress());
      log("Data persistence is enabled: %s", this.persistence);
      log("BalanceSheet: %s", this.contracts.balanceSheet);
      log("HTokens: %s", this.contracts.htokens);
      log("HifiFlashSwap: %s", this.contracts.hifiFlashSwap);
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
    const startBlock = this.db.get(LAST_SYNCED_BLOCK).value() + 1 || this.startBlock;

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
