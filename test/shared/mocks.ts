import { StrategyArgs } from "../../src/types";
import { BaseStrategy } from "../../src//strategies/base";

import type { BigNumber, ContractReceipt, Signer } from "ethers";
import { MockContract } from "ethereum-waffle";
import hre from "hardhat";

import { BalanceSheet__factory, Erc20__factory, HToken__factory, IAggregatorV3__factory } from "./typechain";

const { deployMockContract } = hre.waffle;

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

export async function deployMockBalanceSheetContract(deployer: Signer): Promise<MockContract> {
  const balanceSheet: MockContract = await deployMockContract(deployer, BalanceSheet__factory.abi);
  return balanceSheet;
}

export async function deployMockErc20Contract(
  deployer: Signer,
  name: string,
  symbol: string,
  decimals: number,
): Promise<MockContract> {
  const erc20: MockContract = await deployMockContract(deployer, Erc20__factory.abi);
  await erc20.mock.name.returns(name);
  await erc20.mock.symbol.returns(symbol);
  await erc20.mock.decimals.returns(decimals);
  return erc20;
}

export async function deployMockHTokenContract(deployer: Signer, underlying: string): Promise<MockContract> {
  const hToken: MockContract = await deployMockContract(deployer, HToken__factory.abi);
  await hToken.mock.name.returns("Hifi USDC (2025-3-28)");
  await hToken.mock.symbol.returns("hUSC25Mar28");
  await hToken.mock.maturity.returns(1743181200);
  await hToken.mock.underlying.returns(underlying);
  await hToken.mock.underlyingPrecisionScalar.returns(1000000000000);
  await hToken.mock.decimals.returns(18);
  await hToken.mock.totalSupply.returns(0);
  return hToken;
}

export async function deployMockOracleContract(deployer: Signer): Promise<MockContract> {
  const oracle: MockContract = await deployMockContract(deployer, IAggregatorV3__factory.abi);
  return oracle;
}
