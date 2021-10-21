import { BigNumber, Wallet, providers } from "ethers";

export type Args = {
  network: {
    contracts: {
      balanceSheet: string;
      hifiFlashSwap: string;
    };
    uniswap: {
      factory: string;
      initCodeHash: string;
      underlyingPairs: { [underlying: string]: { pair: string; token0: string; token1: string } };
    };
    startBlock: number;
  };
  persistence: boolean;
  provider: Provider;
  signer: Wallet;
  silentMode: boolean;
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
