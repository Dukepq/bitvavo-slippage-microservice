import { Trade } from "../types/bitvavoTypes";

export function getTradesVolume(trades: Trade[], maxAge: number = 1000 * 60) {
  let cumulatedSellVolume = 0;
  let cumulatedBuyVolume = 0;
  const now = Date.now();
  for (let i = trades.length - 1; i >= 0; i--) {
    const trade = trades[i];
    if (trade.timestamp < now - maxAge) break;
    const numAmount = Number(trade.amount);
    const numPrice = Number(trade.price);
    if (isNaN(numAmount) || isNaN(numPrice)) continue;
    if (trade.side === "sell") {
      cumulatedSellVolume += numAmount * numPrice;
    } else if (trade.side === "buy") {
      cumulatedBuyVolume += numAmount * numPrice;
    }
  }
  return { buyVolume: cumulatedBuyVolume, sellVolume: cumulatedSellVolume };
}
