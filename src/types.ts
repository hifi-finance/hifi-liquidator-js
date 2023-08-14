import { UNISWAP_V2, UNISWAP_V3 } from "./constants";
import { Wallet, providers } from "ethers";

export type StrategyArgs = {
  networkConfig: NetworkConfig;
  persistenceEnabled: boolean;
  provider: Provider;
  signer: Wallet;
};

export type NetworkName = "homestead" | "matic";

export type StrategyName = typeof UNISWAP_V2 | typeof UNISWAP_V3;

export type StrategyConfig = {
  [UNISWAP_V2]: { factory: string; flashSwap: string };
  [UNISWAP_V3]: { flashSwap: string };
};

export type Contracts = {
  balanceSheet: string;
  strategies: {
    [K in StrategyName]?: StrategyConfig[K];
  };
};

export type NetworkConfig = {
  contracts: Contracts;
  flashbotsEnabled: boolean;
  startBlock: number;
};

export type Cache = {
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
