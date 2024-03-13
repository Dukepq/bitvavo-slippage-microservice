import bitvavoWS from "./bitvavoInstance";
import markets from "../loader/load";
import { Trade } from "../types/bitvavoTypes";

bitvavoWS.subscribeTrades(markets.map((value) => value.market));

const trades: { [key: string]: Trade[] } = bitvavoWS.localTrades;

export default trades;
