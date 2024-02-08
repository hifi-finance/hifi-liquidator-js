import { shouldBehaveLikeHTokens } from "./read/htokens";
import { shouldBehaveLikeIsUnderwater } from "./read/isUnderwater";
import { shouldBehaveLikeVaults } from "./read/vaults";
import { shouldBehaveLikeCacheHtoken } from "./write/cacheHtoken";
import { shouldBehaveLikeClearHtoken } from "./write/clearHtoken";

export function shouldBehaveLikeBase(): void {
  describe("Read Methods", function () {
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

  describe("Write Methods", function () {
    describe("cacheHtoken", function () {
      shouldBehaveLikeCacheHtoken();
    });

    describe("clearHtoken", function () {
      shouldBehaveLikeClearHtoken();
    });
  });
}
