import { BigNumber, Wallet, providers } from "ethers";

export type Args = {
  network: {
    contracts: {
      balanceSheet: string;
      hifiFlashSwap: string;
      htokens: string[];
      wbtcUsdcPair: string;
      wethUsdcPair: string;
    };
    uniswap: {
      factory: string;
      initCodeHash: string;
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

export type Provider = providers.BaseProvider;

export type Vault = {
  bonds: string[];
  collaterals: string[];
};

export type Vaults = {
  [account: string]: Vault;
};
