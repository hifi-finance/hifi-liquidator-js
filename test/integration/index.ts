import { baseContext } from "../shared/contexts";
import { integrationTestUniswapV2 } from "../integration/strategies/uniswap-v2/uniswap-v2";
import { integrationTestUniswapV3 } from "../integration/strategies/uniswap-v3/uniswap-v3";
import { integrationFixtureUniswap } from "../shared/fixtures";

baseContext("Integration Tests", function () {
  beforeEach(async function () {
    const { balanceSheet, bond, oracle, usdc, weth } = await this.loadFixture(integrationFixtureUniswap);
    this.contracts.balanceSheet = balanceSheet;
    this.contracts.bond = bond;
    this.mocks.oracle = oracle;
    this.contracts.usdc = usdc;
    this.contracts.weth = weth;
  });

  integrationTestUniswapV2();
  integrationTestUniswapV3();
});
