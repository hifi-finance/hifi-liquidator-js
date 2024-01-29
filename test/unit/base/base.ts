import { unitFixture } from "../../shared/fixtures";
import { shouldBehaveLikeBase } from "./base.behavior";

export function unitTestBase(): void {
  describe("Base", function () {
    beforeEach(async function () {
      const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(unitFixture);
      this.contracts.balanceSheet = balanceSheet;
      this.contracts.oracle = oracle;
      this.contracts.usdc = usdc;
      this.contracts.weth = weth;
    });

    shouldBehaveLikeBase();
  });
}
