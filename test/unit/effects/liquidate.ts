import { expect } from "chai";

export function shouldBehaveLikeLiquidate(): void {
  context("when using the Uniswap V3 strategy", function () {
    beforeEach(async function () {});

    it("liquidates the underwater vaults", async function () {});
  });

  context("when using the Uniswap V2 strategy", function () {
    context("when the Uniswap V2 pair does not exist", function () {
      beforeEach(async function () {});

      it("reverts", async function () {});
    });

    context("when the Uniswap V2 pair exists", function () {
      beforeEach(async function () {});

      it("liquidates the underwater vaults", async function () {});
    });
  });
}
