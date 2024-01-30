import { BaseStrategy } from "../../src/strategies/base";
import {
  MockStrategy,
  deployMockBalanceSheetContract,
  deployMockHTokenContract,
  deployMockErc20Contract,
} from "./mocks";
import { Provider } from "../../src/types";
import { Signer } from "ethers";
import { MockContract } from "ethereum-waffle";

type UnitFixtureBaseReturnType = {
  balanceSheet: MockContract;
  bond: MockContract;
  liquidator: BaseStrategy;
  usdc: MockContract;
  weth: MockContract;
};

export async function unitFixtureBase(signers: Signer[]): Promise<UnitFixtureBaseReturnType> {
  const deployer = signers[0];
  const balanceSheet = await deployMockBalanceSheetContract(deployer);
  const usdc = await deployMockErc20Contract(deployer, "USD Coin", "USDC", 6);
  const bond = await deployMockHTokenContract(deployer, usdc.address);
  const weth = await deployMockErc20Contract(deployer, "Wrapped Ether", "WETH", 18);
  const liquidator = new MockStrategy({
    networkConfig: {
      contracts: {
        balanceSheet: balanceSheet.address,
        strategies: {},
      },
      flashbotsEnabled: false,
      startBlock: 0,
    },
    persistenceEnabled: false,
    provider: signers[0].provider as Provider,
    signer: signers[0] as any,
  });

  return { balanceSheet, bond, liquidator, usdc, weth };
}
