import { Bot } from "./bot/index";
import { getFlashbotsURL, isTrueSet } from "./helpers";
import * as networkConfig from "./network-config.json";
import { NetworkName, Strategy } from "./types";
import { Wallet, providers, utils } from "ethers";

require("dotenv").config();

const { ALCHEMY_KEY, INFURA_KEY, PERSISTENCE_ENABLED, SELECTED_ACCOUNT, WALLET_SEED } = process.env as {
  [key: string]: string;
};

const { NETWORK_NAME, SELECTED_STRATEGY } = process.env as { NETWORK_NAME: NetworkName; SELECTED_STRATEGY: Strategy };

const account = utils.HDNode.fromMnemonic(WALLET_SEED as string).derivePath(`m/44'/60'/0'/0/${SELECTED_ACCOUNT}`);

const provider = networkConfig[NETWORK_NAME].flashbotsEnabled
  ? new providers.JsonRpcProvider(getFlashbotsURL(NETWORK_NAME), NETWORK_NAME)
  : new providers.FallbackProvider([
      new providers.AlchemyProvider(NETWORK_NAME, ALCHEMY_KEY),
      new providers.InfuraProvider(NETWORK_NAME, INFURA_KEY),
    ]);

const signer = new Wallet(account, provider);

new Bot({
  networkConfig: networkConfig[NETWORK_NAME],
  persistenceEnabled: isTrueSet(PERSISTENCE_ENABLED),
  provider,
  selectedStrategy: SELECTED_STRATEGY,
  signer,
}).run();
