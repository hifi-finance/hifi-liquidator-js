import { UNISWAP_V3_FEE_TIERS, UNISWAP_V3_QUOTER } from "./constants";
import { NetworkName, Provider } from "./types";
import { MaxUint256 } from "@ethersproject/constants";
import IQuoterV2 from "@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json";
import { BigNumber, BigNumberish, Contract, Event, EventFilter, utils } from "ethers";
import { getCreate2Address, solidityKeccak256, solidityPack } from "ethers/lib/utils";
import * as fs from "fs";
import StormDB from "stormdb";
import { format } from "util";
import * as winston from "winston";

export function addressesAreEqual(address0: string, address1: string) {
  return utils.getAddress(address0) === utils.getAddress(address1);
}

export async function batchQueryFilter(
  contract: Contract,
  eventFilter: EventFilter,
  fromBlock: number = 0,
  toBlock: number,
  span: number = 3500,
) {
  let events: Event[] = [];
  for (let currBlock = fromBlock; currBlock < toBlock + 1; currBlock += span) {
    const currEvent = await contract.queryFilter(
      eventFilter,
      currBlock,
      toBlock - currBlock > span ? currBlock + span - 1 : toBlock,
    );
    events = [...events, ...currEvent];
  }
  return events;
}

export function getFlashbotsURL(chainName: NetworkName) {
  switch (chainName) {
    case "homestead":
      return "https://rpc.flashbots.net";
    default:
      return "https://rpc.flashbots.net";
  }
}

export async function getOptimalUniswapV3Fee({
  collateral,
  underlying,
  underlyingAmount,
  provider,
}: {
  collateral: string;
  underlying: string;
  underlyingAmount: BigNumberish;
  provider: Provider;
}) {
  const contract = new Contract(UNISWAP_V3_QUOTER, IQuoterV2.abi, provider);
  const { fee } = (
    await Promise.all(
      UNISWAP_V3_FEE_TIERS.map(async fee => {
        try {
          const { amountIn }: { amountIn: BigNumber } = await contract.callStatic.quoteExactOutputSingle({
            tokenIn: collateral,
            tokenOut: underlying,
            amount: underlyingAmount,
            fee: fee,
            sqrtPriceLimitX96: 0,
          });
          return { fee, amountIn };
        } catch {
          return { fee, amountIn: MaxUint256 };
        }
      }),
    )
  ).reduce((prev, current) => (current.amountIn.lt(prev.amountIn) ? current : prev));
  return fee;
}

export function getUniswapV2PairInfo({
  factoryAddress,
  initCodeHash,
  tokenA,
  tokenB,
}: {
  factoryAddress: string;
  initCodeHash: string;
  tokenA: string;
  tokenB: string;
}) {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  const pair = getCreate2Address(
    factoryAddress,
    solidityKeccak256(["bytes"], [solidityPack(["address", "address"], [token0, token1])]),
    initCodeHash,
  );
  return { token0, token1, pair };
}

export function initCache(persistent: boolean, name: string) {
  if (persistent) {
    if (!fs.existsSync("cache")) {
      fs.mkdirSync("cache");
    }
    return new StormDB(new StormDB.localFileEngine("cache/" + name + ".json"));
  } else {
    const mem: { data: any } = { data: [] };
    return {
      default: (value: any) => (mem.data = value),
      get: (key: string) => ({
        push: (value: any) => (mem.data[key] = [...mem.data[key], value]),
        value: () => mem.data[key],
      }),
      save: () => null,
      set: (key: string, value: any) => (mem.data[key] = value),
    };
  }
}

export function isTrueString(val: any) {
  return val?.toLowerCase() === "true";
}

export class Logger {
  private static instance: winston.Logger | null = null;

  // private methods
  private static init() {
    Logger.instance = winston.createLogger({
      levels: winston.config.syslog.levels,
      transports: [new winston.transports.Console()],
    });
  }

  private static async log(level: string, message: any[]) {
    while (Logger.instance === null) {
      Logger.init();
    }
    Logger.instance.log(level, format(...message));
  }

  // public methods
  public static async info(...message: any[]) {
    await Logger.log("info", message);
  }

  public static async notice(...message: any[]) {
    await Logger.log("notice", message);
  }

  public static async warning(...message: any[]) {
    await Logger.log("warning", message);
  }
}
