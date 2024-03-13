import bitvavo from "../config/bitvavo";
import { Trade, TradeSubscriptionMessage } from "../types/bitvavoTypes";
import markets from "../loader/load";
import wait from "../utils/wait";

let trades: { [key: string]: Trade[] } = {};

const subscribeAll = async () => {
  let count = 0;
  for (const entry of markets) {
    if (count > 10) break;
    count++;
    const market = entry.market;
    console.log(market);
    await wait(600);
    bitvavo.websocket.subscriptionTrades(
      market,
      (res: TradeSubscriptionMessage) => {
        const { market } = res;
        if (!trades[market]) trades[market] = [];
        trades[market].push(res);
      }
    );
    const bitvavoWS = bitvavo.websocket.websocket;
    while (!bitvavoWS || bitvavoWS.readyState === 0) {
      console.log("waiting... " + bitvavoWS?.readyState);
      await wait(100);
    }
    // await wait(100);
  }
};
subscribeAll();

function pruneTrades(trades: Trade[], age: number) {
  const now = Date.now();
  return trades.filter((trade) => trade.timestamp >= now - age);
}

setInterval(async () => {
  for (const market in trades) {
    trades[market] = pruneTrades(trades[market], 1000 * 60 * 5);
  }
}, 10000);

export default trades;
