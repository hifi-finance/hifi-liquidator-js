import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import type { BalanceSheet, ChainlinkOperator, Erc20 } from "./typechain";
import type { BaseStrategy } from "../../src/strategies/base";

declare module "mocha" {
  interface Context {
    contracts: Contracts;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    liquidator: BaseStrategy;
    signers: Signers;
  }
}

export interface Contracts {
  balanceSheet: BalanceSheet;
  oracle: ChainlinkOperator;
  usdc: Erc20;
  weth: Erc20;
}

export interface Signers {
  admin: SignerWithAddress;
  borrower: SignerWithAddress;
  liquidator: SignerWithAddress;
}
