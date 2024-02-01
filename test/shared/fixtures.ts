import { deployMockBalanceSheetContract, deployMockHTokenContract, deployMockErc20Contract } from "./mocks";
import { Signer } from "ethers";
import { MockContract } from "ethereum-waffle";

export async function integrationFixtureUniswapV2(signers: Signer[]): Promise<void> {}

export async function integrationFixtureUniswapV3(signers: Signer[]): Promise<void> {}

type UnitFixtureBaseReturnType = {
  balanceSheet: MockContract;
  bond: MockContract;
  usdc: MockContract;
  weth: MockContract;
};

export async function unitFixtureBase(signers: Signer[]): Promise<UnitFixtureBaseReturnType> {
  const deployer = signers[0];
  const balanceSheet = await deployMockBalanceSheetContract(deployer);
  const usdc = await deployMockErc20Contract(deployer, "USD Coin", "USDC", 6);
  const bond = await deployMockHTokenContract(deployer, usdc.address);
  const weth = await deployMockErc20Contract(deployer, "Wrapped Ether", "WETH", 18);

  return { balanceSheet, bond, usdc, weth };
}
