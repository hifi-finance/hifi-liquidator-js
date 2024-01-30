import { expect } from "chai";

export function shouldBehaveLikeVaults(): void {
  context("when no vaults are cached", function () {
    it("returns an empty object", async function () {
      const vaults = (this.liquidator as any).vaults();
      expect(vaults).to.be.empty;
    });
  });

  context("when vaults are cached", function () {
    beforeEach(async function () {
      await (this.liquidator as any).updateVaults(this.signers.borrower.address, "push", {
        bonds: this.mocks.bond.address,
      });
      await (this.liquidator as any).updateVaults(this.signers.borrower.address, "push", {
        collaterals: this.mocks.weth.address,
      });
    });

    it("returns the cached vaults", async function () {
      const vaults = (this.liquidator as any).vaults();
      expect(vaults).to.not.be.empty;
      expect(vaults).to.have.keys(this.signers.borrower.address);
      const actualVault = vaults[this.signers.borrower.address];
      expect(actualVault).to.have.keys("bonds", "collaterals");
      expect(actualVault.bonds).to.be.deep.eq([this.mocks.bond.address]);
      expect(actualVault.collaterals).to.be.deep.eq([this.mocks.weth.address]);
    });
  });
}
