type BitvavoEvent = "book" | "ticker" | "candle" | "ticker24h" | "trades";

export type Subscriptions = Record<BitvavoEvent, string[]>;

export type OrderBookEvent = {
  event: "book";
  market: string;
  nonce: number;
  bids: [string, string][];
  asks: [string, string][];
};

export type GetBookMessage = {
  action: "getBook";
  response: {
    market: string;
    nonce: number;
    bids: [string, string][];
    asks: [string, string][];
  };
};

export type BookSubscriptionMessage =
  | {
      event: "subscribed";
      subscriptions: Subscriptions;
    }
  | OrderBookEvent;

export type Trade = {
  id: string;
  amount: string;
  price: string;
  timestamp: number;
  market: string;
  side: "buy" | "sell";
};

export type TradeSubscriptionMessage = Trade & { event: "trade" };

export type Candle = [number, string, string, string, string, string];

export type WebSocketMessageData =
  | BookSubscriptionMessage
  | GetBookMessage
  | TradeSubscriptionMessage;
