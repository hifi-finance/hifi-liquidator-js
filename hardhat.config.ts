import "@nomiclabs/hardhat-ethers";
import type { HardhatUserConfig } from "hardhat/config";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import networkConfig from "./src/network-config.json";

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
      chainId: 31337,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`,
        blockNumber: networkConfig.homestead.startBlock,
      },
    },
  },
  paths: {
    tests: "./test",
  },
};

export default config;
