import { Contract, Event, EventFilter } from "ethers";

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

export function isTrueSet(val: any) {
  return val?.toLowerCase() === "true";
}
