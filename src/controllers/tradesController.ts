import { Request, Response } from "express";
import { z } from "zod";
import trades from "../dataProcessing/trades";
import { getTradesVolume } from "../lib/trades";

const tradesSchema = z.object({
  params: z.object({
    market: z.string(),
  }),
  query: z
    .object({
      maxAge: z.coerce.number(),
    })
    .optional(),
});

export function getTrades(req: Request, res: Response) {
  const result = tradesSchema.safeParse(req);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "provide correct params, format: XXX-YYY",
    });
  }
  try {
    const market = result.data.params.market;
    const maxAge = result.data.query?.maxAge;
    const now = Date.now();
    let marketTrades = trades[market];

    if (!marketTrades) {
      return res
        .status(404)
        .json({ success: false, message: "resource not found" });
    }

    if (typeof maxAge === "number") {
      marketTrades = marketTrades.filter(
        (trade) => trade.timestamp > now - maxAge
      );
    }

    return res.status(200).json({ marketTrades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
}

const volumeSchema = z.object({
  query: z.object({
    maxAge: z.coerce.number().lte(300000),
  }),
});

export function getTradedVolume(req: Request, res: Response) {
  const result = volumeSchema.safeParse(req);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "provide correct params",
    });
  }
  try {
    const maxAge = result.data.query.maxAge;

    const tradedVolumes: {
      market: string;
      buyVolume: number;
      sellVolume: number;
    }[] = [];

    for (const market in trades) {
      const marketTrades = trades[market];
      if (!marketTrades) continue;
      const volumes = getTradesVolume(marketTrades, maxAge);
      tradedVolumes.push({ ...volumes, market });
    }
    return res.status(200).json(tradedVolumes);
  } catch (err) {
    return res.status(500).json({ success: false });
  }
}

const specificVolumeSchema = z.object({
  params: z.object({
    market: z.string().regex(/[A-Z]-[A-Z]/),
  }),
  query: z.object({
    maxAge: z.coerce.number().lte(300000),
  }),
});

export function getSpecificTradedVolume(req: Request, res: Response) {
  const result = specificVolumeSchema.safeParse(req);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "provide correct params",
    });
  }
  try {
    const market = result.data.params.market;
    const maxAge = result.data.query.maxAge;

    const marketTrades = trades[market];
    const { buyVolume, sellVolume } = getTradesVolume(marketTrades, maxAge);

    return res.status(200).json({ market, buyVolume, sellVolume });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
}
