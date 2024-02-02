import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture, MockContract } from "ethereum-waffle";

import type { BalanceSheet, Erc20 } from "./typechain";
import type { BaseStrategy } from "../../src/strategies/base";

declare module "mocha" {
  interface Context {
    contracts: Contracts;
    liquidator: BaseStrategy;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    mocks: Mocks;
    signers: Signers;
  }
}

export interface Contracts {
  balanceSheet: BalanceSheet;
  bond: Erc20;
  usdc: Erc20;
  weth: Erc20;
}

export interface Mocks {
  balanceSheet: MockContract;
  bond: MockContract;
  oracle: MockContract;
  usdc: MockContract;
  weth: MockContract;
}

export interface Signers {
  admin: SignerWithAddress;
  borrower: SignerWithAddress;
}
