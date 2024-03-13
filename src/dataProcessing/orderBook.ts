import wait from "../utils/wait";
import { OrderBook } from "../dataFetching/fetchBitvavoData";
import markets from "../loader/load";
import envVar from "../utils/envHelper";
import bitvavo from "../config/bitvavo";

const orderBooks: { [key: string]: Omit<OrderBook, "market"> } = {};

const subscribeAll = async () => {
  let count = 0;
  for (const entry of markets) {
    if (count > 80) break;
    count++;
    const market = entry.market;
    bitvavo.websocket.subscriptionBook(
      market,
      (res: Omit<OrderBook, "market">) => {
        orderBooks[market] = res;
      }
    );
    const bitvavoWS = bitvavo.websocket.websocket;
    while (!bitvavoWS || bitvavoWS.readyState === 0) {
      console.log("waiting... " + bitvavoWS?.readyState);
      await wait(100);
    }
    console.log(market);
    await wait(Number(envVar("SUBSCRIPTION_INTERVAL")));
  }
};
// subscribeAll();

export default orderBooks;
