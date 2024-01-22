import { NetworkName, Provider } from "./types";
import { BigNumberish, Contract, Event, EventFilter, Signer, utils } from "ethers";
import { getCreate2Address, solidityKeccak256, solidityPack } from "ethers/lib/utils";
import * as fs from "fs";
import StormDB from "stormdb";
import { format } from "util";
import * as winston from "winston";
import { AlphaRouter, CurrencyAmount } from "@uniswap/smart-order-router";
import { IERC20Metadata__factory } from "@uniswap/smart-order-router/build/main/types/v3/factories/IERC20Metadata__factory";
import { Token, TradeType } from "@uniswap/sdk-core";
import { Protocol } from "@uniswap/router-sdk";
import { Pool } from "@uniswap/v3-sdk";

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

export async function getOptimalUniswapV3Path({
  collateral,
  underlying,
  underlyingAmount,
  signer,
}: {
  collateral: string;
  underlying: string;
  underlyingAmount: BigNumberish;
  signer: Signer;
}) {
  const provider = signer.provider! as Provider;
  const chainId = provider.network.chainId;
  const router = new AlphaRouter({ chainId, provider });

  const collateralContract = new Contract(collateral, IERC20Metadata__factory.abi, provider);
  const underlyingContract = new Contract(underlying, IERC20Metadata__factory.abi, provider);

  const tokenIn = new Token(
    chainId,
    collateralContract.address,
    await collateralContract.decimals(),
    await collateralContract.symbol(),
    await collateralContract.name(),
  );
  const tokenOut = new Token(
    chainId,
    underlyingContract.address,
    await underlyingContract.decimals(),
    await underlyingContract.symbol(),
    await underlyingContract.name(),
  );

  const route = (await router.route(
    CurrencyAmount.fromRawAmount(tokenOut, underlyingAmount.toString()),
    tokenIn,
    TradeType.EXACT_OUTPUT,
    undefined,
    {
      protocols: [Protocol.V3],
    },
  ))!;

  if (!route) {
    throw new Error("Uniswap V3 Strategy: No swap path found");
  }

  const { pools, path: tokens } = route.trade.routes[0] as { pools: Pool[]; path: Token[] };

  const routePoolFees = pools.map(({ fee }) => fee.toString()).reverse();
  const routeTokens = tokens.map(({ address }) => address).reverse();

  if (routePoolFees.length !== routeTokens.length - 1) {
    throw new Error("Uniswap V3 Strategy: Route pool fees and token length mismatch");
  }

  // Compute the route values.
  const values: string[] = [routeTokens[0]];
  for (let i = 0; i < routePoolFees.length; i++) {
    values.push(routePoolFees[i]);
    values.push(routeTokens[i + 1]);
  }

  // Compute the route types.
  const types: ("address" | "uint24")[] = values.map(value => (utils.isAddress(value) ? "address" : "uint24"));

  return utils.solidityPack(types, values);
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
