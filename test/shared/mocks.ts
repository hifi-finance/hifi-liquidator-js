import { StrategyArgs } from "../../src/types";
import { BaseStrategy } from "../../src//strategies/base";

import type { BigNumber, ContractReceipt } from "ethers";

export class MockStrategy extends BaseStrategy {
  constructor(args: StrategyArgs) {
    super({ ...args, strategyName: "uniswap-v3" });
  }

  protected async liquidate(
    _account: string,
    _bond: string,
    _collateral: string,
    _underlyingAmount: BigNumber,
    _underlying: string,
  ): Promise<ContractReceipt> {
    return null as unknown as ContractReceipt;
  }
}
