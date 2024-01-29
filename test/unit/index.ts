import { baseContext } from "../shared/contexts";
import { unitTestBase } from "./base/base";
import { unitTestUniswapV2 } from "./strategies/uniswap-v2/uniswap-v2";
import { unitTestUniswapV3 } from "./strategies/uniswap-v3/uniswap-v3";

baseContext("Unit Tests", function () {
  unitTestBase();
  unitTestUniswapV2();
  unitTestUniswapV3();
});
