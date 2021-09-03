import { Contract, Event, EventFilter } from "ethers";

import StormDB from "stormdb";

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

export function initDb(persistent: boolean) {
  if (persistent) {
    return new StormDB(new StormDB.localFileEngine("db.json"));
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
