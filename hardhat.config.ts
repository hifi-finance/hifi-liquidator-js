import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import type { HardhatUserConfig } from "hardhat/config";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { FORK_BLOCK } from "./test/shared/constants";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

const alchemyKey: string | undefined = process.env.ALCHEMY_KEY;
if (!alchemyKey) {
  throw new Error("Please set your ALCHEMY_KEY in a .env file");
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
      chainId: 1,
      blockGasLimit: 150_000_000,
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
        blockNumber: FORK_BLOCK,
      },
    },
  },
  paths: {
    tests: "./test",
  },
};

export default config;
