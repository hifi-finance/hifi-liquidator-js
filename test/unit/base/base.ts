import { Provider } from "../../../src/types";
import { unitFixtureBase } from "../../shared/fixtures";
import { MockStrategy } from "../../shared/mocks";
import { StrategyTester } from "../../shared/utils";
import { shouldBehaveLikeBase } from "./base.behavior";

export function unitTestBase(): void {
  describe("Base", function () {
    beforeEach(async function () {
      const { balanceSheet, bond, usdc, weth } = await this.loadFixture(unitFixtureBase);
      this.mocks.balanceSheet = balanceSheet;
      this.mocks.bond = bond;
      this.mocks.usdc = usdc;
      this.mocks.weth = weth;
      this.liquidator = new StrategyTester(MockStrategy, {
        networkConfig: {
          contracts: {
            balanceSheet: balanceSheet.address,
            strategies: {},
          },
          flashbotsEnabled: false,
          startBlock: 0,
        },
        persistenceEnabled: false,
        provider: this.signers.admin.provider as Provider,
        signer: this.signers.admin,
      });
    });

    shouldBehaveLikeBase();
  });
}
