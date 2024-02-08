import { shouldBehaveLikeLiquidate } from "./write/liquidate";

export function shouldBehaveLikeUniswapV2Strategy(): void {
  describe("Write Methods", function () {
    describe("liquidate", function () {
      shouldBehaveLikeLiquidate();
    });
  });
}
