import { OrderBook } from "dataFetching/fetchBitvavoData";
import bitvavoWS from "./bitvavoInstance";
import markets from "../loader/load";

bitvavoWS.subscribeBookMany(markets.map((value) => value.market)); // .slice(0, Math.floor(markets.length / 3)

const orderBooks: { [key: string]: Omit<OrderBook, "market"> } =
  bitvavoWS.localBook;

export default orderBooks;
