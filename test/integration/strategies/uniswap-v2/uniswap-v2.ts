import { Strategy as UniswapV2Strategy } from "../../../../src/strategies/uniswap-v2";
import { shouldBehaveLikeUniswapV2Strategy } from "./uniswap-v2.behavior";
import networkConfig from "../../../../src/network-config.json";
import type { Provider } from "../../../../src/types";
import { StrategyTester } from "../../../shared/utils";

export function integrationTestUniswapV2(): void {
  describe("Uniswap V2 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new StrategyTester(UniswapV2Strategy, {
        networkConfig: networkConfig["homestead"],
        persistenceEnabled: false,
        provider: this.signers.runner.provider as Provider,
        signer: this.signers.runner,
      });
    });

    shouldBehaveLikeUniswapV2Strategy();
  });
}
