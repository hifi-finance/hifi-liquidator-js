import { shouldBehaveLikeLiquidate } from "./write/liquidate";

export function shouldBehaveLikeUniswapV3Strategy(): void {
  describe("Write Methods", function () {
    describe("liquidate", function () {
      shouldBehaveLikeLiquidate();
    });
  });
}
