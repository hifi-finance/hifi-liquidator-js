import * as fs from "fs";
import { format } from "util";

import { LoggingWinston } from "@google-cloud/logging-winston";
import { Contract, Event, EventFilter, utils } from "ethers";
import { getCreate2Address, solidityKeccak256, solidityPack } from "ethers/lib/utils";
import * as gcpMetadata from "gcp-metadata";
import StormDB from "stormdb";
import * as winston from "winston";

export function addressesAreEqual(address0: string, address1: string) {
  return utils.getAddress(address0) === utils.getAddress(address1);
}

export async function batchQueryFilter(
  contract: Contract,
  eventFilter: EventFilter,
  fromBlock: number = 0,
  toBlock: number,
  span: number = 10000,
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

export function initDb(persistent: boolean, name: string) {
  if (persistent) {
    if (!fs.existsSync("db")) {
      fs.mkdirSync("db");
    }
    return new StormDB(new StormDB.localFileEngine("db/" + name + ".json"));
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

export function isTrueSet(val: any) {
  return val?.toLowerCase() === "true";
}

export class Logger {
  private static instance: winston.Logger | null = null;

  // private methods
  private static async init() {
    const transports: winston.transport[] = [new winston.transports.Console()];
    if (await gcpMetadata.isAvailable()) {
      transports.push(new LoggingWinston());
    }
    Logger.instance = winston.createLogger({
      level: "info",
      transports,
    });
  }

  private static async log(level: string, message: any[]) {
    while (Logger.instance === null) {
      await Logger.init();
    }
    Logger.instance.log(level, format(...message));
  }

  // public methods
  public static async error(...message: any[]) {
    await Logger.log("error", message);
  }

  public static async info(...message: any[]) {
    await Logger.log("info", message);
  }

  public static async notice(...message: any[]) {
    await Logger.log("notice", message);
  }
}
