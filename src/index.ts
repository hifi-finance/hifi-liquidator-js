import { getFlashbotsURL, isTrueString } from "./helpers";
import * as networkConfig from "./network-config.json";
import { Strategy as UniswapV2Strategy } from "./strategies/uniswap-v2";
import { Strategy as UniswapV3Strategy } from "./strategies/uniswap-v3";
import { NetworkName, StrategyName } from "./types";
import { Wallet, providers, utils } from "ethers";

require("dotenv").config();

const { ALCHEMY_KEY, INFURA_KEY, PERSISTENCE_ENABLED, SELECTED_ACCOUNT, WALLET_SEED } = process.env as {
  [key: string]: string;
};

const { NETWORK_NAME, SELECTED_STRATEGY } = process.env as {
  NETWORK_NAME: NetworkName;
  SELECTED_STRATEGY: StrategyName;
};

function main() {
  const account = utils.HDNode.fromMnemonic(WALLET_SEED).derivePath(`m/44'/60'/0'/0/${SELECTED_ACCOUNT}`);
  const defaultProvider = new providers.FallbackProvider([
    new providers.AlchemyProvider(NETWORK_NAME, ALCHEMY_KEY),
    new providers.InfuraProvider(NETWORK_NAME, INFURA_KEY),
  ]);
  const flashbotsProvider = new providers.JsonRpcProvider(getFlashbotsURL(NETWORK_NAME), NETWORK_NAME);
  const signer = new Wallet(
    account,
    networkConfig[NETWORK_NAME].flashbotsEnabled ? flashbotsProvider : defaultProvider,
  );

  const args = {
    networkConfig: networkConfig[NETWORK_NAME],
    persistenceEnabled: isTrueString(PERSISTENCE_ENABLED),
    provider: defaultProvider,
    signer: signer,
  };

  switch (SELECTED_STRATEGY) {
    case "uniswap-v3":
      new UniswapV3Strategy(args).run();
      break;
    default:
    case "uniswap-v2":
      new UniswapV2Strategy(args).run();
      break;
  }
}

main();
