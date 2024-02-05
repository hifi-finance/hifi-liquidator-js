// import { unitFixture } from "../../../shared/fixtures";
import { Strategy as UniswapV2Strategy } from "../../../../src/strategies/uniswap-v2";
import { shouldBehaveLikeUniswapV2Strategy } from "./uniswap-v2.behavior";

export function integrationTestUniswapV2(): void {
  describe("Uniswap V2 Strategy", function () {
    beforeEach(async function () {
      this.liquidator = new UniswapV2Strategy({
        networkConfig: {
          contracts: {
            balanceSheet: "0x452467A37f7A0c1EA8432A52b8bbe3Cc31E9513b",
            strategies: {
              "uniswap-v2": {
                factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
                flashSwap: "0x529D440aCa6D7Ad6c8Fe2423d78DB7Ef95460435",
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

    shouldBehaveLikeUniswapV2Strategy();
  });
}
