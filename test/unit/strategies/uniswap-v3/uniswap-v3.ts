// import { unitFixture } from "../../../shared/fixtures";
import { shouldBehaveLikeUniswapV3Strategy } from "./uniswap-v3.behavior";

export function unitTestUniswapV3(): void {
  describe("Uniswap V3 Strategy", function () {
    beforeEach(async function () {
      // const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(unitFixture);
      // this.contracts.balanceSheet = balanceSheet;
      // this.contracts.oracle = oracle;
      // this.contracts.usdc = usdc;
      // this.contracts.weth = weth;
    });

    shouldBehaveLikeUniswapV3Strategy();
  });
}
