import { Htokens, StrategyArgs, Vaults } from "../../src/types";

import type { BigNumber, ContractReceipt } from "ethers";
import { BaseStrategy } from "../../src/strategies/base";

export class StrategyTester<S extends BaseStrategy> {
  private readonly strategy: S;

  constructor(c: new (args: StrategyArgs) => S, args: StrategyArgs) {
    this.strategy = new c(args);
  }

  // Read Methods
  public async isUnderwater(account: string): Promise<boolean> {
    // @ts-ignore
    return this.strategy.isUnderwater(account);
  }

  public htokens(): Htokens {
    // @ts-ignore
    return this.strategy.htokens();
  }

  public vaults(): Vaults {
    // @ts-ignore
    return this.strategy.vaults();
  }

  // Write Methods
  public async cacheHtoken(htoken: string): Promise<void> {
    // @ts-ignore
    return this.strategy.cacheHtoken(htoken);
  }

  public async clearHtoken(htoken: string): Promise<void> {
    // @ts-ignore
    return this.strategy.clearHtoken(htoken);
  }

  public liquidate(
    _account: string,
    _bond: string,
    _collateral: string,
    _underlyingAmount: BigNumber,
    _underlying: string,
  ): Promise<ContractReceipt> {
    // @ts-ignore
    return this.strategy.liquidate(_account, _bond, _collateral, _underlyingAmount, _underlying);
  }

  public async liquidateAllMature(_latestBlock: number): Promise<void> {
    // @ts-ignore
    return this.strategy.liquidateAllMature(_latestBlock);
  }

  public async liquidateAllUnderwater(): Promise<void> {
    // @ts-ignore
    return this.strategy.liquidateAllUnderwater();
  }

  public async syncAll(_latestBlock?: number): Promise<void> {
    // @ts-ignore
    return this.strategy.syncAll(_latestBlock);
  }

  public async updateVaults(account: string, type: "pop" | "push", fragment: { [key: string]: string }): Promise<void> {
    // @ts-ignore
    return this.strategy.updateVaults(account, type, fragment);
  }
}
