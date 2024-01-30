import { expect } from "chai";
import { Contract } from "ethers";
import { HToken__factory } from "@hifi/protocol/dist/types/factories/contracts/core/h-token/HToken__factory";

export function shouldBehaveLikeHTokens(): void {
  context("when no hTokens are cached", function () {
    it("returns an empty object", async function () {
      // TODO: find a better way to expose private methods
      const hTokens = (this.liquidator as any).htokens();
      expect(hTokens).to.be.empty;
    });
  });

  context("when hTokens are cached", function () {
    beforeEach(async function () {
      await (this.liquidator as any).cacheHtoken(this.mocks.bond.address);
    });

    it("returns the cached hTokens", async function () {
      const hTokens = (this.liquidator as any).htokens();
      expect(hTokens).to.not.be.empty;
      expect(hTokens).to.have.keys(this.mocks.bond.address);
      const hToken = hTokens[this.mocks.bond.address];
      expect(hToken).to.have.keys("maturity", "underlying", "underlyingPrecisionScalar");
      expect(hToken.maturity).to.be.eq(await this.mocks.bond.maturity());
      expect(hToken.underlying).to.be.eq(await this.mocks.bond.underlying());
      expect(hToken.underlyingPrecisionScalar).to.be.eq(await this.mocks.bond.underlyingPrecisionScalar());
    });
  });
}
