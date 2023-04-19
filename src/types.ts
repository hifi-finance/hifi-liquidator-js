import { UNISWAP_V2 } from "./constants";
import { Wallet, providers } from "ethers";

export type BotArgs = {
  networkConfig: NetworkConfig;
  persistenceEnabled: boolean;
  provider: Provider;
  selectedStrategy: Strategy;
  signer: Wallet;
};

export type UniswapV2StrategyConfig = {
  factory: string;
  flashSwap: string;
};

export type NetworkName = "homestead" | "matic";

export type Strategy = typeof UNISWAP_V2;

export type StrategyConfig = UniswapV2StrategyConfig;

export type Contracts = {
  balanceSheet: string;
  strategies: {
    [K in Strategy]?: StrategyConfig;
  };
};

export type NetworkConfig = {
  contracts: Contracts;
  flashbotsEnabled: boolean;
  startBlock: number;
};

export type Db = {
  default: (value: any) => void;
  get: (key: string) => {
    push: (value: any) => void;
    value: () => any;
  };
  save: () => Promise<void> | null;
  set: (key: string, value: any) => void;
};

export type Htokens = {
  [htoken: string]: {
    maturity: number;
    underlying: string;
    underlyingPrecisionScalar: number;
  };
};

export type Provider = providers.BaseProvider;

export type Vault = {
  bonds: string[];
  collaterals: string[];
};

export type Vaults = {
  [account: string]: Vault;
};
