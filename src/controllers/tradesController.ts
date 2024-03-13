import { Request, Response } from "express";
import { z } from "zod";
import trades from "../dataProcessing/trades";

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
