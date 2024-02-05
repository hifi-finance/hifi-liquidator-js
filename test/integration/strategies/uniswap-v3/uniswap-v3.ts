// import { unitFixture } from "../../../shared/fixtures";
import { Strategy } from "../../../../src/strategies/uniswap-v3";
import { shouldBehaveLikeUniswapV3Strategy } from "./uniswap-v3.behavior";

export function integrationTestUniswapV3(): void {
  describe("Uniswap V3 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new Strategy({
        networkConfig: {
          contracts: {
            balanceSheet: "0x452467A37f7A0c1EA8432A52b8bbe3Cc31E9513b",
            strategies: {
              "uniswap-v3": {
                flashSwap: "0x86432aA958e34b9A90C349F46C3162c98D0ea5c4",
              },
            },
          },
          flashbotsEnabled: false,
          startBlock: 16228745,
        },
        persistenceEnabled: false,
        provider: this.signers.admin.provider as any,
        signer: this.signers.admin as any,
      });
    });

    shouldBehaveLikeUniswapV3Strategy();
  });
}
