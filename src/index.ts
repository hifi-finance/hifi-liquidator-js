import { Wallet, providers, utils } from "ethers";

import { Bot } from "./bot/index";
import { isTrueSet } from "./helpers";
import * as networks from "./networks.json";
import { NetworkName } from "./types";

require("dotenv").config();

const { ALCHEMY_KEY, PERSISTENCE, SELECTED_ACCOUNT, SILENT_MODE, WALLET_SEED } = process.env as {
  [key: string]: string;
};

const { NETWORK_NAME } = process.env as { NETWORK_NAME: NetworkName };

const account = utils.HDNode.fromMnemonic(WALLET_SEED as string).derivePath(`m/44'/60'/0'/0/${SELECTED_ACCOUNT}`);

const provider = new providers.AlchemyProvider(NETWORK_NAME, ALCHEMY_KEY);

const signer = new Wallet(account, provider);

new Bot({
  network: networks[NETWORK_NAME],
  persistence: isTrueSet(PERSISTENCE),
  provider,
  signer,
  silentMode: isTrueSet(SILENT_MODE),
}).run();
