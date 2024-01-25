import { shouldBehaveLikeHTokens } from "./getters/htokens";
import { shouldBehaveLikeIsUnderwater } from "./getters/isUnderwater";
import { shouldBehaveLikeVaults } from "./getters/vaults";
import { shouldBehaveLikeCacheHtoken } from "./effects/cacheHtoken";
import { shouldBehaveLikeClearHtoken } from "./effects/clearHtoken";
import { shouldBehaveLikeLiquidate } from "./effects/liquidate";

export function behavior(): void {
  describe("Getter Functions", function () {
    describe("htokens", function () {
      shouldBehaveLikeHTokens();
    });

    describe("isUnderwater", function () {
      shouldBehaveLikeIsUnderwater();
    });

    describe("vaults", function () {
      shouldBehaveLikeVaults();
    });
  });

  describe("Effects Functions", function () {
    describe("cacheHtoken", function () {
      shouldBehaveLikeCacheHtoken();
    });

    describe("clearHtoken", function () {
      shouldBehaveLikeClearHtoken();
    });

    describe("liquidate", function () {
      shouldBehaveLikeLiquidate();
    });
  });
}
