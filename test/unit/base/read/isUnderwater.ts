import { expect } from "chai";

export function shouldBehaveLikeIsUnderwater(): void {
  context("when the vault is not underwater", function () {
    beforeEach(async function () {
      await this.mocks.balanceSheet.mock.getCurrentAccountLiquidity
        .withArgs(this.signers.borrower.address)
        .returns(0, 0);
    });

    it("returns false", async function () {
      const isUnderwater = await (this.liquidator as any).isUnderwater(this.signers.borrower.address);
      expect(isUnderwater).to.be.false;
    });
  });

  context("when the vault is underwater", function () {
    beforeEach(async function () {
      await this.mocks.balanceSheet.mock.getCurrentAccountLiquidity
        .withArgs(this.signers.borrower.address)
        .returns(0, 1);
    });

    it("returns true", async function () {
      const isUnderwater = await (this.liquidator as any).isUnderwater(this.signers.borrower.address);
      expect(isUnderwater).to.be.true;
    });
  });
}
