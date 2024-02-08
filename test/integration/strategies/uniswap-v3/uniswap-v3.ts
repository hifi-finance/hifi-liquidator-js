import { Strategy as UniswapV3Strategy } from "../../../../src/strategies/uniswap-v3";
import { shouldBehaveLikeUniswapV3Strategy } from "./uniswap-v3.behavior";
import networkConfig from "../../../../src/network-config.json";
import type { Provider } from "../../../../src/types";
import { StrategyTester } from "../../../shared/utils";

export function integrationTestUniswapV3(): void {
  describe("Uniswap V3 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new StrategyTester(UniswapV3Strategy, {
        networkConfig: networkConfig["homestead"],
        persistenceEnabled: false,
        provider: this.signers.runner.provider as Provider,
        signer: this.signers.runner,
      });
    });

    shouldBehaveLikeUniswapV3Strategy();
  });
}
