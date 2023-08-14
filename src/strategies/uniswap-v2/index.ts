import { UNISWAP_V2_INIT_CODE_HASH } from "../../constants";
import { Logger, addressesAreEqual, getUniswapV2PairInfo } from "../../helpers";
import { StrategyArgs } from "../../types";
import { BaseStrategy } from "../base";
import { MinInt256 } from "@ethersproject/constants";
import { IUniswapV2Pair } from "@hifi/flash-swap/dist/types/contracts/uniswap-v2/IUniswapV2Pair";
import { IUniswapV2Pair__factory } from "@hifi/flash-swap/dist/types/factories/contracts/uniswap-v2/IUniswapV2Pair__factory";
import { BigNumber, BigNumberish, Contract, utils } from "ethers";

export class Strategy extends BaseStrategy {
  constructor(args: StrategyArgs) {
    super({ ...args, strategyName: "uniswap-v2" });
  }

  protected async liquidate(
    account: string,
    bond: string,
    collateral: string,
    underlyingAmount: BigNumber,
    underlying: string,
  ): Promise<void> {
    if (!this.networkConfig.contracts.strategies["uniswap-v2"]) {
      throw new Error("Uniswap V2 strategy is not supported on " + this.provider.network.name);
    }
    const { pair, token0, token1 } = getUniswapV2PairInfo({
      factoryAddress: this.networkConfig.contracts.strategies["uniswap-v2"].factory,
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
      this.networkConfig.contracts.strategies["uniswap-v2"].flashSwap,
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
}
