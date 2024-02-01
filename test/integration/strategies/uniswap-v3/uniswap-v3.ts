// import { unitFixture } from "../../../shared/fixtures";
import { integrationFixtureUniswapV3 } from "../../../shared/fixtures";
import { shouldBehaveLikeUniswapV3Strategy } from "./uniswap-v3.behavior";

export function integrationTestUniswapV3(): void {
  describe("Uniswap V3 Strategy", function () {
    beforeEach(async function () {
      // const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(integrationFixtureUniswapV3);
      // this.contracts.balanceSheet = balanceSheet;
      // this.contracts.oracle = oracle;
      // this.contracts.usdc = usdc;
      // this.contracts.weth = weth;
    });

    shouldBehaveLikeUniswapV3Strategy();
  });
}
