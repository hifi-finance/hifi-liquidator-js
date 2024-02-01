import { baseContext } from "../shared/contexts";
import { integrationTestUniswapV2 } from "../integration/strategies/uniswap-v2/uniswap-v2";
import { integrationTestUniswapV3 } from "../integration/strategies/uniswap-v3/uniswap-v3";

baseContext("Integration Tests", function () {
  integrationTestUniswapV2();
  integrationTestUniswapV3();
});
