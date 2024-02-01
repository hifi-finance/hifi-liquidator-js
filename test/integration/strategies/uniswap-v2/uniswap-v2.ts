// import { unitFixture } from "../../../shared/fixtures";
import { integrationFixtureUniswapV2 } from "../../../shared/fixtures";
import { shouldBehaveLikeUniswapV2Strategy } from "./uniswap-v2.behavior";

export function integrationTestUniswapV2(): void {
  describe("Uniswap V2 Strategy", function () {
    beforeEach(async function () {
      // const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(integrationFixtureUniswapV2);
      // this.contracts.balanceSheet = balanceSheet;
      // this.contracts.oracle = oracle;
      // this.contracts.usdc = usdc;
      // this.contracts.weth = weth;
    });

    shouldBehaveLikeUniswapV2Strategy();
  });
}
