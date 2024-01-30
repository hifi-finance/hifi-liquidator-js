import { unitFixtureBase } from "../../shared/fixtures";
import { shouldBehaveLikeBase } from "./base.behavior";

export function unitTestBase(): void {
  describe("Base", function () {
    beforeEach(async function () {
      const { balanceSheet, bond, liquidator, usdc, weth } = await this.loadFixture(unitFixtureBase);
      this.mocks.balanceSheet = balanceSheet;
      this.mocks.bond = bond;
      this.mocks.usdc = usdc;
      this.mocks.weth = weth;
      this.liquidator = liquidator;
    });

    shouldBehaveLikeBase();
  });
}
