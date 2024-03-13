import { Candle } from "types/bitvavoTypes";

type RateLimit = {
  remaining: number;
  limit: number;
  reset: number;
};

export const rateLimitInfo: RateLimit = {
  remaining: 1000,
  limit: 1000,
  reset: Date.now(),
};

export type Market = {
  market: string;
  status: "trading" | "halted" | "auction";
  base: string;
  quote: string;
  pricePrecision: string;
  minOrderInQuoteAsset: string;
  minOrderInBaseAsset: string;
  maxOrderInQuoteAsset: string;
  maxOrderInBaseAsset: string;
  orderTypes: string[];
};

export async function fetchMarkets(): Promise<
  [Market[], null] | [null, Error]
> {
  const res = await fetch("https://api.bitvavo.com/v2/markets");

  extractAndApplyLimit(res.headers, rateLimitInfo);

  if (!res.ok) {
    const error = new Error(
      `${res.status}: ${res.statusText}. While attempting to fetch the markets.`
    );
    return [null, error];
  }
  const data: Market[] = await res.json();
  return [data, null];
}

export type OrderBook = {
  market: string;
  nonce: number;
  bids: [string, string][];
  asks: [string, string][];
};

export async function fetchOrderBook(
  market: string
): Promise<[OrderBook, null] | [null, Error]> {
  const res = await fetch("https://api.bitvavo.com/v2/markets");

  extractAndApplyLimit(res.headers, rateLimitInfo);

  if (!res.ok) {
    const error = new Error(
      `${res.status}: ${res.statusText}. While attempting to fetch ${market} order book.`
    );
    return [null, error];
  }
  const data: OrderBook = await res.json();
  return [data, null];
}

type Interval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d";

export async function fetchCandles(
  market: string,
  interval: Interval = "1m"
): Promise<[Candle[], null] | [null, Error]> {
  const minute = 1000 * 60;
  const now = Date.now();
  const fetchFrom = now - 6 * minute;

  const res = await fetch(
    `https://api.bitvavo.com/v2/ADA-EUR/candles?interval=${interval}&start=${fetchFrom}`
  ); //TOHLCV
  extractAndApplyLimit(res.headers, rateLimitInfo);

  if (!res.ok) {
    const err = new Error(
      `${res.status}: ${res.statusText}. While attempting to fetch ${market} candles.`
    );
    return [null, err];
  }
  const data: Candle[] = await res.json();
  return [data, null];
}

function extractAndApplyLimit(headers: Headers, rateLimitInfo: RateLimit) {
  const remaining = Number(headers.get("bitvavo-ratelimit-remaining"));
  const limit = Number(headers.get("bitvavo-ratelimit-limit"));
  const reset = Number(headers.get("bitvavo-ratelimit-resetat"));

  if (!isNaN(remaining)) rateLimitInfo.remaining = remaining;
  if (!isNaN(limit)) rateLimitInfo.limit = limit;
  if (!isNaN(reset)) rateLimitInfo.reset = reset;

  return { remaining, limit, reset };
}
