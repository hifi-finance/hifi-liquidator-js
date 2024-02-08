import {
  deployMockBalanceSheetContract,
  deployMockHTokenContract,
  deployMockErc20Contract,
  deployMockOracleContract,
} from "./mocks";
import { Signer } from "ethers";
import { MockContract } from "ethereum-waffle";
import {
  BalanceSheet,
  ChainlinkOperator,
  ChainlinkOperator__factory,
  Erc20,
  Erc20__factory,
  HToken__factory,
  HToken,
} from "./typechain";
import { ethers } from "hardhat";
import { BalanceSheetV2__factory } from "@hifi/protocol/dist/types/factories/contracts/core/balance-sheet/BalanceSheetV2__factory";

type IntegrationFixtureUniswapReturnType = {
  balanceSheet: BalanceSheet;
  bond: HToken;
  oracle: MockContract;
  usdc: Erc20;
  weth: Erc20;
};

export async function integrationFixtureUniswap(signers: Signer[]): Promise<IntegrationFixtureUniswapReturnType> {
  const balanceSheet = <BalanceSheet>await ethers.getContractAt(
    // @ts-ignore
    BalanceSheetV2__factory.abi,
    "0x452467A37f7A0c1EA8432A52b8bbe3Cc31E9513b",
  );
  const bond = <HToken>await ethers.getContractAt(
    // @ts-ignore
    HToken__factory.abi,
    "0x4EC7101B179c28e4332ED5B06174b38AeE18cf32",
  );
  const chainlinkOracle = <ChainlinkOperator>await ethers.getContractAt(
    // @ts-ignore
    ChainlinkOperator__factory.abi,
    await balanceSheet.oracle(),
  );

  const usdcAddress = (await chainlinkOracle.getFeed("USDC"))[0];
  const usdc = <Erc20>await ethers.getContractAt(
    // @ts-ignore
    Erc20__factory.abi,
    usdcAddress,
  );

  const runnerAddress = await signers[0].getAddress();

  // impersonate a usdc whale
  const usdcWhale = "0x28C6c06298d514Db089934071355E5743bf21d60";
  await ethers.provider.send("hardhat_impersonateAccount", [usdcWhale]);
  const usdcWhaleSigner = await ethers.provider.getSigner(usdcWhale);
  await usdc.connect(usdcWhaleSigner).transfer(runnerAddress, ethers.utils.parseUnits("1000000", 6));

  const wethAddress = (await chainlinkOracle.getFeed("WETH"))[0];
  const weth = <Erc20>await ethers.getContractAt(
    // @ts-ignore
    Erc20__factory.abi,
    wethAddress,
  );
  // impersonate a weth whale
  const wethWhale = "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806";
  await ethers.provider.send("hardhat_impersonateAccount", [wethWhale]);
  const wethWhaleSigner = await ethers.provider.getSigner(wethWhale);
  await weth.connect(wethWhaleSigner).transfer(runnerAddress, ethers.utils.parseUnits("10000", 18));

  // mock chainlink oracle owner and set feed
  const oracle = await deployMockOracleContract(signers[0]);
  const owner = await chainlinkOracle.owner();
  // send some ETH to the owner so they can pay for gas
  await ethers.provider.send("hardhat_setBalance", [owner, "0x1000000000000000000"]);
  await ethers.provider.send("hardhat_impersonateAccount", [owner]);
  const ownerSigner = await ethers.provider.getSigner(owner);
  await oracle.mock.decimals.returns(8);

  await chainlinkOracle.connect(ownerSigner).setFeed(wethAddress, oracle.address);

  return { balanceSheet, bond, oracle, usdc, weth };
}

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
