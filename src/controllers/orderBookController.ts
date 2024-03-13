import { Request, Response } from "express";
import { z } from "zod";
import orderBooks from "../dataProcessing/orderBook";
import { orderBookAskBrackets, orderBookBidBrackets } from "../lib/ROBS";
import { spread } from "../lib/spread";

const getOrderBookSchema = z.object({
  params: z.object({
    market: z.string(),
  }),
  query: z.object({
    brackets: z.coerce.number(),
    size: z.coerce.number(),
  }),
});

export function getOrderBook(req: Request, res: Response) {
  const result = getOrderBookSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ success: false, message: "provide correct params" });
  }
  const { brackets, size } = result.data.query;
  const market = result.data.params.market;
  try {
    const book = orderBooks[market];
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "resource not found" });
    }

    const formattedBookBids = orderBookBidBrackets(book.bids, brackets, size);
    const formattedBookAsks = orderBookAskBrackets(book.asks, brackets, size);

    const bestBid = Number(book.bids[0][0]);
    const bestAsk = Number(book.asks[0][0]);
    const bidAskSpread = spread(bestBid, bestAsk);

    return res.status(200).json({
      market,
      size,
      bestBid,
      bestAsk,
      spread: bidAskSpread,
      bids: formattedBookBids,
      asks: formattedBookAsks,
    });
  } catch (err) {
    console.error(err);
  }
}
