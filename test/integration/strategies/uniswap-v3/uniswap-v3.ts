// import { unitFixture } from "../../../shared/fixtures";
import { Strategy } from "../../../../src/strategies/uniswap-v3";
import { shouldBehaveLikeUniswapV3Strategy } from "./uniswap-v3.behavior";
import networkConfig from "../../../../src/network-config.json";

export function integrationTestUniswapV3(): void {
  describe("Uniswap V3 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new Strategy({
        networkConfig: networkConfig["homestead"],
        persistenceEnabled: false,
        provider: this.signers.admin.provider as any,
        signer: this.signers.admin as any,
      });
    });

    shouldBehaveLikeUniswapV3Strategy();
  });
}
