import { expect } from "chai";

export function shouldBehaveLikeClearHtoken(): void {
  context("when the hToken is not cached", function () {
    it("does nothing", async function () {
      const htokensBefore = await (this.liquidator as any).htokens();
      expect(htokensBefore).to.be.empty;
      await (this.liquidator as any).clearHtoken(this.mocks.bond.address);
      const htokensAfter = await (this.liquidator as any).htokens();
      expect(htokensAfter).to.be.empty;
    });
  });

  context("when the hToken is cached", function () {
    beforeEach(async function () {
      await (this.liquidator as any).cacheHtoken(this.mocks.bond.address);
    });

    it("clears the hToken", async function () {
      const htokensBefore = await (this.liquidator as any).htokens();
      expect(htokensBefore).to.not.be.empty;
      const htoken = htokensBefore[this.mocks.bond.address];
      expect(htoken).to.have.keys("maturity", "underlying", "underlyingPrecisionScalar");
      expect(htoken.maturity).to.be.eq(await this.mocks.bond.maturity());
      expect(htoken.underlying).to.be.eq(await this.mocks.bond.underlying());
      expect(htoken.underlyingPrecisionScalar).to.be.eq(await this.mocks.bond.underlyingPrecisionScalar());
      await (this.liquidator as any).clearHtoken(this.mocks.bond.address);
      const htokensAfter = await (this.liquidator as any).htokens();
      expect(htokensAfter).to.be.empty;
    });
  });
}
