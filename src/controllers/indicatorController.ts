import { Request, Response } from "express";
import { z } from "zod";
import trades from "../dataProcessing/trades";
import orderBooks from "../dataProcessing/orderBook";
import markets from "../loader/load";
import {
  orderBookAskBrackets,
  orderBookBidBrackets,
  robs,
  simpleOrderBookAskDepth,
  simpleOrderBookBidDepth,
} from "../lib/ROBS";

import { spread } from "../lib/spread";
import { getTradesVolume } from "../lib/trades";

const SimpleRobsSchema = z.object({
  query: z.object({
    depth: z.coerce.number(),
    maxAge: z.optional(
      z.coerce
        .number()
        .lte(1000 * 60 * 5)
        .nonnegative()
    ),
    maxRobsB: z.optional(z.coerce.number().nonnegative()),
    maxRobsA: z.optional(z.coerce.number().nonnegative()),
  }),
});

export function getSimpleRobs(req: Request, res: Response) {
  const result = SimpleRobsSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ success: false, message: "provide correct query params" });
  }
  const depth = result.data.query.depth;
  const maxAge = result.data.query.maxAge;
  const maxRobsA = result.data.query.maxRobsA;
  const maxRobsB = result.data.query.maxRobsB;

  try {
    const allRobs: {
      [key: string]: {
        robsB: number | null;
        robsA: number | null;
        buyVolume: number;
        sellVolume: number;
        spread: number;
      };
    } = {};

    for (const { market } of markets) {
      const marketTrades = trades[market];
      const marketBook = orderBooks[market];

      if (!marketTrades || !marketBook) continue;

      const bids = marketBook.bids;
      const asks = marketBook.asks;

      const bestBid = Number(bids[0][0]);
      const bestAsk = Number(asks[0][0]);
      const bidAskSpread = spread(bestBid, bestAsk);

      const bidDepth = simpleOrderBookBidDepth(bids, depth);
      const askDepth = simpleOrderBookAskDepth(asks, depth);

      const { sellVolume, buyVolume } = getTradesVolume(
        marketTrades,
        maxAge || 1000 * 60
      );

      const robsA = buyVolume && askDepth ? robs(askDepth, buyVolume) : null;
      const robsB = sellVolume && bidDepth ? robs(bidDepth, sellVolume) : null;

      if (!robsA && !robsB) continue;
      if (maxRobsA) {
        if (!robsA || robsA > maxRobsA) continue;
      }
      if (maxRobsB) {
        if (!robsB || robsB > maxRobsB) continue;
      }

      allRobs[market] = {
        robsA,
        robsB,
        spread: bidAskSpread,
        buyVolume,
        sellVolume,
      };
    }
    return res.status(200).json(allRobs);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
}

const complexRobsSchema = z.object({
  query: z.object({
    brackets: z.coerce.number(),
    bracketSize: z.coerce.number(),
    maxAge: z.optional(
      z.coerce
        .number()
        .lte(1000 * 60 * 5)
        .nonnegative()
    ),
  }),
});

export function getComplexRobs(req: Request, res: Response) {
  const result = complexRobsSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ success: false, message: "provide correct query params" });
  }
  const { brackets, bracketSize, maxAge } = result.data.query;

  try {
    const allRobs: {
      [key: string]: {
        robsB: (number | null)[] | null;
        robsA: (number | null)[] | null;
        spread: number;
      };
    } = {};

    for (const { market } of markets) {
      const marketTrades = trades[market];
      const marketBook = orderBooks[market];

      if (!marketTrades || !marketBook) continue;

      const bids = marketBook.bids;
      const asks = marketBook.asks;

      const bestBid = Number(bids[0][0]);
      const bestAsk = Number(asks[0][0]);
      const bidAskSpread = spread(bestBid, bestAsk);

      const bidDepthArray = orderBookBidBrackets(bids, brackets, bracketSize);
      const askDepthArray = orderBookAskBrackets(asks, brackets, bracketSize);

      const { sellVolume, buyVolume } = getTradesVolume(
        marketTrades,
        maxAge || 1000 * 60
      );

      let robsBArray: (number | null)[] | null = [];
      for (const bidBracket of bidDepthArray) {
        if (sellVolume === 0) {
          robsBArray = null;
          break;
        } else robsBArray.push(bidBracket / sellVolume);
      }
      let robsAArray: (number | null)[] | null = [];
      for (const askBracket of askDepthArray) {
        if (buyVolume === 0) {
          robsAArray = null;
          break;
        } else robsAArray.push(askBracket / buyVolume);
      }

      allRobs[market] = {
        robsA: robsAArray,
        robsB: robsBArray,
        spread: bidAskSpread,
      };
    }
    return res.status(200).json(allRobs);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
}
