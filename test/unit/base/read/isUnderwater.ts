import { expect } from "chai";

export function shouldBehaveLikeIsUnderwater(): void {
  context("when the vault is not underwater", function () {
    it("returns false", async function () {
      const isUnderwater = await (this.liquidator as any).isUnderwater(this.signers.borrower.address);
      expect(isUnderwater).to.be.false;
    });
  });

  context("when the vault is underwater", function () {
    it("returns true", async function () {});
  });
}
