import { expect } from "chai";
import { HTOKENS } from "../../../shared/constants";
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
      await (this.liquidator as any).cacheHtoken(HTOKENS[0]);
    });

    it("returns the cached hTokens", async function () {
      const hTokens = (this.liquidator as any).htokens();
      expect(hTokens).to.not.be.empty;
      expect(hTokens).to.have.keys(HTOKENS[0]);
      const actualHtoken = hTokens[HTOKENS[0]];
      const expectedHtokenContract = new Contract(HTOKENS[0], HToken__factory.abi, this.signers.admin.provider);
      expect(actualHtoken).to.have.keys("maturity", "underlying", "underlyingPrecisionScalar");
      expect(actualHtoken.maturity).to.be.eq(await expectedHtokenContract.maturity());
      expect(actualHtoken.underlying).to.be.eq(await expectedHtokenContract.underlying());
      expect(actualHtoken.underlyingPrecisionScalar).to.be.eq(await expectedHtokenContract.underlyingPrecisionScalar());
    });
  });
}
