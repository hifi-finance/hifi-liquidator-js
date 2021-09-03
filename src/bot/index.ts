import { Args, Db, Vaults } from "./types";
import { BigNumber, Contract, Event, EventFilter, Wallet, providers } from "ethers";

import { BalanceSheetV1 as BalanceSheet } from "@hifi/protocol/typechain/BalanceSheetV1";
import { abi as BalanceSheetAbi } from "@hifi/protocol/artifacts/BalanceSheetV1.json";
import { HifiFlashUniswapV2 as HifiFlashUniswap } from "@hifi/flash-swap/typechain/HifiFlashUniswapV2";
import { abi as HifiFlashUniswapAbi } from "@hifi/flash-swap/artifacts/HifiFlashUniswapV2.json";
import StormDB from "stormdb";
import { IUniswapV2Pair as UniswapV2Pair } from "@hifi/flash-swap/typechain/IUniswapV2Pair";
import { abi as UniswapV2PairAbi } from "@hifi/flash-swap/artifacts/IUniswapV2Pair.json";
import fs from "fs";

// TODO: replace with improved logging/cloud logging
const log = console.log;

export class Bot {
  private contracts;
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
  public vaults(): any {}

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

  public stop(): void {}

  public async syncAll(_latestBlock?: number): Promise<void> {}
}
