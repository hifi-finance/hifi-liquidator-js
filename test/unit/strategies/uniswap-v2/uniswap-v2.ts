// import { unitFixture } from "../../../shared/fixtures";
import { shouldBehaveLikeUniswapV2Strategy } from "./uniswap-v2.behavior";

export function unitTestUniswapV2(): void {
  describe("Uniswap V2 Strategy", function () {
    beforeEach(async function () {
      // const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(unitFixture);
      // this.contracts.balanceSheet = balanceSheet;
      // this.contracts.oracle = oracle;
      // this.contracts.usdc = usdc;
      // this.contracts.weth = weth;
    });

    shouldBehaveLikeUniswapV2Strategy();
  });
}
