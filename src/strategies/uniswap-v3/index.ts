import { StrategyArgs } from "../../types";
import { getOptimalUniswapV3Path } from "../../utils";
import { BaseStrategy } from "../base";
import { MinInt256 } from "@ethersproject/constants";
import { IFlashUniswapV3 } from "@hifi/flash-swap/dist/types/contracts/uniswap-v3/IFlashUniswapV3";
import { FlashUniswapV3__factory } from "@hifi/flash-swap/dist/types/factories/contracts/uniswap-v3/FlashUniswapV3__factory";

import { BigNumber, BigNumberish, Contract, ContractReceipt } from "ethers";

export class Strategy extends BaseStrategy {
  private flashUniswapV3: IFlashUniswapV3;

  constructor(args: StrategyArgs) {
    super({ ...args, strategyName: "uniswap-v3" });

    if (!this.networkConfig.contracts.strategies["uniswap-v3"]) {
      throw new Error("Uniswap V3 Strategy: Not supported on " + this.provider.network.name);
    }
    this.flashUniswapV3 = new Contract(
      this.networkConfig.contracts.strategies["uniswap-v3"].flashSwap,
      FlashUniswapV3__factory.abi,
      this.signer,
    ) as IFlashUniswapV3;
  }

  protected async liquidate(
    account: string,
    bond: string,
    collateral: string,
    underlyingAmount: BigNumber,
    underlying: string,
  ): Promise<ContractReceipt> {
    // TODO: profitibility calculation for liquidation
    // TODO: pop the collateral from persistence list after liquidation
    const flashLiquidateArgs: {
      borrower: string;
      bond: string;
      collateral: string;
      path: string;
      turnout: BigNumberish;
      underlyingAmount: BigNumberish;
    } = {
      borrower: account,
      bond,
      collateral,
      path: await getOptimalUniswapV3Path({
        collateral,
        underlying,
        underlyingAmount,
        signer: this.signer,
      }),
      turnout: MinInt256,
      underlyingAmount,
    };
    // TODO: profitibility calculation (including gas)
    const gasLimit = await this.flashUniswapV3.estimateGas.flashLiquidate(flashLiquidateArgs);
    const gasPrice = await this.flashUniswapV3.provider.getGasPrice();
    const tx = await this.flashUniswapV3.flashLiquidate(flashLiquidateArgs, { gasLimit, gasPrice });
    const receipt = await this.provider.waitForTransaction(tx.hash, 1, 600_000);
    return receipt;
  }
}
