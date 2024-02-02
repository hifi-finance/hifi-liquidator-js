// eslint-disable @typescript-eslint/no-explicit-any
import type { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from "@ethersproject/wallet";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contracts, Mocks, Signers } from "./types";

const { createFixtureLoader } = waffle;
chai.use(chaiAsPromised);

export function baseContext(description: string, hooks: () => void): void {
  describe(description, function () {
    before(async function () {
      this.contracts = {} as Contracts;
      this.mocks = {} as Mocks;
      this.signers = {} as Signers;

      const signers: SignerWithAddress[] = await ethers.getSigners();
      this.signers.admin = signers[0];
      this.signers.borrower = signers[1];

      this.loadFixture = createFixtureLoader(signers as Signer[] as Wallet[]);
    });

    hooks();
  });
}
