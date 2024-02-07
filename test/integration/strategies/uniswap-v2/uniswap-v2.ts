// import { unitFixture } from "../../../shared/fixtures";
import { Strategy as UniswapV2Strategy } from "../../../../src/strategies/uniswap-v2";
import { shouldBehaveLikeUniswapV2Strategy } from "./uniswap-v2.behavior";
import networkConfig from "../../../../src/network-config.json";

export function integrationTestUniswapV2(): void {
  describe("Uniswap V2 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new UniswapV2Strategy({
        networkConfig: networkConfig["homestead"],
        persistenceEnabled: false,
        provider: this.signers.admin.provider as any,
        signer: this.signers.admin as any,
      });
    });

    shouldBehaveLikeUniswapV2Strategy();
  });
}
