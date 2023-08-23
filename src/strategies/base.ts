import { DUST_EPSILON, HTOKENS, LAST_SYNCED_BLOCK, VAULTS } from "../constants";
import { StrategyArgs, Cache, Htokens, NetworkConfig, Vault, Vaults, StrategyName } from "../types";
import { Logger, batchQueryFilter, initCache } from "../utils";
import { IBalanceSheetV2 } from "@hifi/protocol/dist/types/contracts/core/balance-sheet/IBalanceSheetV2";
import { IHToken } from "@hifi/protocol/dist/types/contracts/core/h-token/IHToken";
import { BalanceSheetV2__factory } from "@hifi/protocol/dist/types/factories/contracts/core/balance-sheet/BalanceSheetV2__factory";
import { HToken__factory } from "@hifi/protocol/dist/types/factories/contracts/core/h-token/HToken__factory";
import { BigNumber, Contract, ContractReceipt } from "ethers";

export abstract class BaseStrategy {
  protected cache: Cache;
  protected balanceSheet: IBalanceSheetV2;
  protected isBusy;
  protected networkConfig: NetworkConfig;
  protected persistenceEnabled;
  protected provider;
  protected strategyName: StrategyName;
  protected signer;

  constructor(args: StrategyArgs & { strategyName: StrategyName }) {
    this.cache = initCache(args.persistenceEnabled, args.provider.network.name);
    this.cache.default({ htokens: {}, lastSyncedBlock: -1, vaults: {} });
    this.isBusy = false;
    this.networkConfig = args.networkConfig;
    this.persistenceEnabled = args.persistenceEnabled;
    this.provider = args.provider;
    this.signer = args.signer;
    this.strategyName = args.strategyName;

    this.balanceSheet = new Contract(
      this.networkConfig.contracts.balanceSheet,
      BalanceSheetV2__factory.abi,
      this.provider,
    ) as IBalanceSheetV2;
  }

  // getter methods
  private async isUnderwater(account: string): Promise<boolean> {
    const { shortfallLiquidity } = await this.balanceSheet.getCurrentAccountLiquidity(account);
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
      const contract = new Contract(htoken, HToken__factory.abi, this.provider) as IHToken;
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

  protected abstract liquidate(
    _account: string,
    _bond: string,
    _collateral: string,
    _underlyingAmount: BigNumber,
    _underlying: string,
  ): Promise<ContractReceipt>;

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
            const debtAmount = await this.balanceSheet.getDebtAmount(account, htoken);
            if (debtAmount.gt(0)) {
              const { underlying, underlyingPrecisionScalar } = htokens[htoken];
              for (const collateral of collaterals) {
                const collateralAmount = await this.balanceSheet.getCollateralAmount(account, collateral);
                const debtAmount = await this.balanceSheet.getDebtAmount(account, htoken);
                const hypotheticalRepayAmount = await this.balanceSheet.getRepayAmount(
                  collateral,
                  collateralAmount,
                  htoken,
                );
                const repayAmount = hypotheticalRepayAmount.gt(debtAmount) ? debtAmount : hypotheticalRepayAmount;
                const underlyingAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
                if (repayAmount.gt(0)) {
                  Logger.notice("Attempting to liquidate mature vault %s...", account);
                  const receipt = await this.liquidate(account, htoken, collateral, underlyingAmount, underlying);
                  Logger.notice("Submitted liquidation at hash: %s", receipt.transactionHash);
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
              const collateralAmount = await this.balanceSheet.getCollateralAmount(account, collateral);
              const debtAmount = await this.balanceSheet.getDebtAmount(account, bond);
              const hypotheticalRepayAmount = await this.balanceSheet.getRepayAmount(
                collateral,
                collateralAmount,
                bond,
              );
              const repayAmount = hypotheticalRepayAmount.gt(debtAmount) ? debtAmount : hypotheticalRepayAmount;
              const underlyingAmount = repayAmount.div(underlyingPrecisionScalar).add(DUST_EPSILON);
              if (repayAmount.gt(0)) {
                Logger.notice("Attempting to liquidate underwater vault %s...", account);
                const receipt = await this.liquidate(account, bond, collateral, underlyingAmount, underlying);
                Logger.notice("Submitted liquidation at hash: %s", receipt.transactionHash);
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
    Logger.notice("Selected strategy: %s", this.strategyName);
    Logger.notice("Profits will be sent to: %s", await this.signer.getAddress());
    Logger.notice("Data persistence is enabled: %s", this.persistenceEnabled);
    Logger.notice("BalanceSheet: %s", this.networkConfig.contracts.balanceSheet);
    Logger.notice("FlashSwap: %s", this.networkConfig.contracts.strategies[this.strategyName]?.flashSwap);
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
      this.balanceSheet,
      this.balanceSheet.filters.Borrow(null, null, null),
      startBlock,
      latestBlock,
    );
    const depositEvents = await batchQueryFilter(
      this.balanceSheet,
      this.balanceSheet.filters.DepositCollateral(null, null, null),
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
