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

  try {
    const allRobs: {
      [key: string]: {
        robsB: number | null;
        robsA: number | null;
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
        1000 * 60
      );

      const robsA = sellVolume && askDepth ? robs(askDepth, sellVolume) : null;
      const robsB = buyVolume && bidDepth ? robs(bidDepth, buyVolume) : null;

      allRobs[market] = { robsA, robsB, spread: bidAskSpread };
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
    maxAge: z.coerce.number(),
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
        robsB: (number | null)[];
        robsA: (number | null)[];
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
        1000 * 60
      );

      const robsBArray: (number | null)[] = [];
      for (const bidBracket of bidDepthArray) {
        if (buyVolume === 0) robsBArray.push(null);
        else robsBArray.push(bidBracket / buyVolume);
      }
      const robsAArray: (number | null)[] = [];
      for (const askBracket of askDepthArray) {
        if (sellVolume === 0) robsAArray.push(null);
        else robsBArray.push(askBracket / sellVolume);
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
