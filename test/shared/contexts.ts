// eslint-disable @typescript-eslint/no-explicit-any
import type { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from "@ethersproject/wallet";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";

import { Contracts, Signers } from "./types";

const { createFixtureLoader } = waffle;

export function baseContext(description: string, hooks: () => void): void {
  describe(description, function () {
    before(async function () {
      this.contracts = {} as Contracts;
      this.signers = {} as Signers;

      const signers: SignerWithAddress[] = await ethers.getSigners();
      this.signers.admin = signers[0];
      this.signers.borrower = signers[1];
      this.signers.liquidator = signers[2];

      this.loadFixture = createFixtureLoader(signers as Signer[] as Wallet[]);
    });

    hooks();
  });
}
