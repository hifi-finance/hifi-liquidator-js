import { unitFixtureBase } from "../../shared/fixtures";
import { shouldBehaveLikeBase } from "./base.behavior";

export function unitTestBase(): void {
  describe("Base", function () {
    beforeEach(async function () {
      const { balanceSheet, liquidator, oracle, usdc, weth } = await this.loadFixture(unitFixtureBase);
      this.contracts.balanceSheet = balanceSheet;
      this.liquidator = liquidator;
      this.contracts.oracle = oracle;
      this.contracts.usdc = usdc;
      this.contracts.weth = weth;
    });

    shouldBehaveLikeBase();
  });
}
