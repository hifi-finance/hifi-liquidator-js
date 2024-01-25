import { ethers } from "hardhat";

import {
  type BalanceSheet,
  type ChainlinkOperator,
  type Erc20,
  ChainlinkOperator__factory,
  Erc20__factory,
} from "./typechain";
import { BalanceSheetV2__factory } from "@hifi/protocol/dist/types/factories/contracts/core/balance-sheet/BalanceSheetV2__factory";
import { BALANCESHEET_ADDRESS } from "./constants";

type UnitFixtureReturnType = {
  balanceSheet: BalanceSheet;
  oracle: ChainlinkOperator;
  usdc: Erc20;
  weth: Erc20;
};

export async function unitFixture(): Promise<UnitFixtureReturnType> {
  const balanceSheet = <BalanceSheet>await ethers.getContractAt(BalanceSheetV2__factory.abi, BALANCESHEET_ADDRESS);
  const oracle = <ChainlinkOperator>(
    await ethers.getContractAt(ChainlinkOperator__factory.abi, await balanceSheet.oracle())
  );
  const usdcAddress = (await oracle.getFeed("USDC"))[0];
  const usdc = <Erc20>await ethers.getContractAt(Erc20__factory.abi, usdcAddress);
  const wethAddress = (await oracle.getFeed("WETH"))[0];
  const weth = <Erc20>await ethers.getContractAt(Erc20__factory.abi, wethAddress);

  return { balanceSheet, oracle, usdc, weth };
}
