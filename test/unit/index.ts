import { baseContext } from "../shared/contexts";
import { unitFixture } from "../shared/fixtures";
import { behavior } from "./behavior";

baseContext("Unit Tests", function () {
  beforeEach(async function () {
    const { balanceSheet, oracle, usdc, weth } = await this.loadFixture(unitFixture);
    this.contracts.balanceSheet = balanceSheet;
    this.contracts.oracle = oracle;
    this.contracts.usdc = usdc;
    this.contracts.weth = weth;
  });

  behavior();
});
