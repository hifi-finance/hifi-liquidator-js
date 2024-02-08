import { expect } from "chai";

export function shouldBehaveLikeCacheHtoken(): void {
  context("when the hToken is already cached", function () {
    beforeEach(async function () {
      await this.liquidator.cacheHtoken(this.mocks.bond.address);
    });

    it("does nothing", async function () {
      const htokensBefore = await this.liquidator.htokens();
      expect(htokensBefore).to.not.be.empty;
      const htoken = htokensBefore[this.mocks.bond.address];
      expect(htoken).to.have.keys("maturity", "underlying", "underlyingPrecisionScalar");
      expect(htoken.maturity).to.be.eq(await this.mocks.bond.maturity());
      expect(htoken.underlying).to.be.eq(await this.mocks.bond.underlying());
      expect(htoken.underlyingPrecisionScalar).to.be.eq(await this.mocks.bond.underlyingPrecisionScalar());
      await this.liquidator.cacheHtoken(this.mocks.bond.address);
      const htokensAfter = await this.liquidator.htokens();
      expect(htokensBefore).to.deep.equal(htokensAfter);
    });
  });

  context("when the hToken is not cached", function () {
    it("caches the hToken", async function () {
      const htokensBefore = await this.liquidator.htokens();
      expect(htokensBefore).to.be.empty;
      await this.liquidator.cacheHtoken(this.mocks.bond.address);
      const htokensAfter = await this.liquidator.htokens();
      expect(htokensAfter).to.not.be.empty;
      expect(htokensAfter).to.have.keys(this.mocks.bond.address);
      const htoken = htokensAfter[this.mocks.bond.address];
      expect(htoken).to.have.keys("maturity", "underlying", "underlyingPrecisionScalar");
      expect(htoken.maturity).to.be.eq(await this.mocks.bond.maturity());
      expect(htoken.underlying).to.be.eq(await this.mocks.bond.underlying());
      expect(htoken.underlyingPrecisionScalar).to.be.eq(await this.mocks.bond.underlyingPrecisionScalar());
    });
  });
}
