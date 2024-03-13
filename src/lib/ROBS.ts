import { OrderBook } from "../dataFetching/fetchBitvavoData";

export function robs(cumulativeDepth: number, recentVolume: number): number {
  return cumulativeDepth / recentVolume;
}

export function orderBookBidBrackets(
  orderBook: OrderBook["bids"],
  brackets: number,
  bracketSize: number
): number[] {
  const amounts: number[] = [];
  let currentBracket = 0;
  const bracketRanges: [number, number][] = [];

  for (let i = 0; i < brackets; i++) {
    const start = Number(orderBook[0][0]) * (1 - i * bracketSize);
    const end = Number(orderBook[0][0]) * (1 - (i * bracketSize + bracketSize));
    bracketRanges[i] = [start, end];
    amounts[i] = 0;
  }
  for (const i in orderBook) {
    const index = Number(i);
    const price = Number(orderBook[index][0]);
    const amount = Number(orderBook[index][1]);
    const euroAmount = price * amount;

    while (!inRangeBids(price, bracketRanges[currentBracket])) {
      if (currentBracket + 1 >= brackets) return amounts;
      currentBracket += 1;
    }
    amounts[currentBracket] += euroAmount;
  }
  return amounts;
}

function inRangeBids(bid: number, range: [number, number]) {
  return bid <= range[0] && bid > range[1];
}

export function orderBookAskBrackets(
  orderBook: OrderBook["asks"],
  brackets: number,
  bracketSize: number
): number[] {
  const amounts: number[] = [];
  let currentBracket = 0;
  const bracketRanges: [number, number][] = [];

  for (let i = 0; i < brackets; i++) {
    const start = Number(orderBook[0][0]) * (1 + i * bracketSize);
    const end = Number(orderBook[0][0]) * (1 + (i * bracketSize + bracketSize));
    bracketRanges[i] = [start, end];
    amounts[i] = 0;
  }
  for (const i in orderBook) {
    const index = Number(i);
    const price = Number(orderBook[index][0]);
    const amount = Number(orderBook[index][1]);
    const euroAmount = price * amount;

    while (!inRangeAsks(price, bracketRanges[currentBracket])) {
      if (currentBracket + 1 >= brackets) return amounts;
      currentBracket += 1;
    }
    amounts[currentBracket] += euroAmount;
  }
  return amounts;
}

function inRangeAsks(bid: number, range: [number, number]) {
  return bid >= range[0] && bid < range[1];
}

export function simpleOrderBookBidDepth(
  orderBook: OrderBook["bids"],
  depth: number
): number {
  const relativeMaxDepth = Number(orderBook[0][0]) * (1 - depth);
  let liquidity = 0;
  for (const i in orderBook) {
    const index = Number(i);
    const price = Number(orderBook[index][0]);
    const amount = Number(orderBook[index][1]);
    if (price < relativeMaxDepth) break;
    liquidity += price * amount;
  }
  return liquidity;
}

export function simpleOrderBookAskDepth(
  orderBook: OrderBook["asks"],
  depth: number
): number {
  const relativeMaxDepth = Number(orderBook[0][0]) * (1 + depth);
  let cumulativeDepth = 0;
  for (const i in orderBook) {
    const index = Number(i);
    const price = Number(orderBook[index][0]);
    const amount = Number(orderBook[index][1]);
    if (price > relativeMaxDepth) break;
    cumulativeDepth += price * amount;
  }
  return cumulativeDepth;
}
