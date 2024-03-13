import { Candle } from "types/bitvavoTypes";
import { fetchCandles } from "../dataFetching/fetchBitvavoData";
import markets from "../loader/load";
import envVar from "../utils/envHelper";

const interval = Number(envVar("CANDLES_FETCH_INTERVAL"));

const candles: { [key: string]: Candle[] | null } = {};

(async function updateMarkets() {
  for (const { market } of markets) {
    updateMarket(market);
  }
  setTimeout(updateMarkets, interval);
})();

async function updateMarket(market: string) {
  try {
    const [data, err] = await fetchCandles(market);
    candles[market] = data;
  } catch (err) {
    console.error(err);
  }
}

export default candles;
