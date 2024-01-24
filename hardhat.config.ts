import "@nomiclabs/hardhat-ethers";
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
      chainId: 31337,
    },
  },
  paths: {
    tests: "./test",
  },
};

export default config;
