import wait from "../utils/wait";
import { OrderBook } from "./fetchBitvavoData";
import WebSocket from "ws";
import {
  Subscriptions,
  Trade,
  WebSocketMessageData,
} from "../types/bitvavoTypes";

class BitvavoWS {
  private BASE_URL = "wss://ws.bitvavo.com/v2/";
  public websocket: WebSocket | null = null;
  public localBook: { [key: string]: Omit<OrderBook, "market"> } = {};
  public localTrades: { [key: string]: Trade[] } = {};
  public subscriptions: Subscriptions = {
    book: [],
    trades: [],
    candle: [],
    ticker: [],
    ticker24h: [],
  };
  constructor() {
    this.connect();
    this.pruneTrades(1000 * 60 * 5, 1000 * 10);
  }

  private connect() {
    this.websocket = new WebSocket(this.BASE_URL);

    this.websocket.onopen = () => {
      console.log("socket opened!");
      this.resubscribe();
    };

    this.websocket.onclose = ({ code, reason }) => {
      console.log(`Socket closed ${code} - ${reason}`);
      this.connect();
    };

    this.websocket.onerror = () => {
      console.log("socket error!");
    };

    this.websocket.onmessage = this.handleOnMessage.bind(this);
  }

  private handleOnMessage(message: WebSocket.MessageEvent) {
    const data: WebSocketMessageData = JSON.parse(message.data.toString());
    if ("action" in data) {
      switch (data.action) {
        case "getBook": {
          const res = data.response;
          const { asks, bids, market, nonce } = res;
          if (typeof this.localBook[market] !== "undefined") {
            this.localBook[market].bids = bids;
            this.localBook[market].asks = asks;
            this.localBook[market].nonce = nonce;
          } else {
            this.localBook[market] = { bids, asks, nonce };
          }
        }
      }
    } else if ("event" in data) {
      switch (data.event) {
        case "subscribed": {
          const subscriptions = data.subscriptions;
          for (let key in subscriptions) {
            this.subscriptions[key as keyof typeof subscriptions] =
              subscriptions[key as keyof typeof subscriptions];
          }
          break;
        }
        case "book": {
          const { market, asks, bids, nonce } = data;

          if (typeof this.localBook[market] !== "undefined") {
            if (nonce !== this.localBook[market].nonce + 1) {
              this.subscribeBook(market);
              break;
            }
            this.localBook[market].asks = this.sortAndInsert(
              asks,
              this.localBook[market].asks,
              this.asksCompare
            );
            this.localBook[market].bids = this.sortAndInsert(
              bids,
              this.localBook[market].bids,
              this.bidsCompare
            );
            this.localBook[market].nonce = nonce;
          }
          break;
        }
        case "trade": {
          const market = data.market;
          if (typeof this.localTrades[market] === "undefined") {
            this.localTrades[market] = [];
          }
          this.localTrades[market].push(data);
        }
      }
    }
  }
  public async fetchRatelimit() {
    const res = await fetch("https://api.bitvavo.com/v2/time");
    const headers = res.headers;
    const ratelimit = headers.get("bitvavo-ratelimit-remaining");
    return isNaN(Number(ratelimit)) ? null : Number(ratelimit);
  }
  private async resubscribe() {
    const allSubscriptions: typeof this.subscriptions = JSON.parse(
      JSON.stringify(this.subscriptions)
    );
    const rl = await this.fetchRatelimit();
    if (rl === null || rl < 500) {
      await wait(1000 * 60);
    }
    for (const type in allSubscriptions) {
      switch (type as keyof typeof allSubscriptions) {
        case "book": {
          const markets =
            allSubscriptions[type as keyof typeof allSubscriptions];

          await this.subscribeBookMany(markets);
        }
        case "trades": {
          const markets = allSubscriptions.trades;
          await this.subscribeTrades(markets);
        }
        case "ticker": {
        }
        case "candle": {
        }
        case "ticker24h": {
        }
      }
    }
  }

  public async send(message: Object) {
    await this.checkSocket();
    this.websocket!.send(JSON.stringify(message));
  }

  private async checkSocket() {
    if (
      this.websocket?.readyState !== WebSocket.OPEN &&
      this.websocket?.readyState !== WebSocket.CONNECTING
    ) {
      while (this.websocket?.readyState === WebSocket.CLOSING) {
        await wait(200);
      }
      this.connect();
    }
    while (this.websocket?.readyState === WebSocket.CONNECTING) {
      console.log("connecting...");
      await wait(200);
    }
    if (!this.websocket) throw new Error("No websocket found!");
    return this.websocket;
  }

  private asksCompare(a: string, b: string) {
    return parseFloat(a) < parseFloat(b);
  }

  private bidsCompare(a: string, b: string) {
    return parseFloat(a) > parseFloat(b);
  }

  private sortAndInsert(
    update: [string, string][],
    book: [string, string][],
    compareFunc: (a: string, b: string) => boolean
  ) {
    for (const updateEntry of update) {
      let entrySet = false;
      for (const j in book) {
        const index = Number(j);
        const bookItem = book[index];
        if (compareFunc(updateEntry[0], bookItem[0])) {
          book.splice(index, 0, updateEntry);
          entrySet = true;
          break;
        }
        if (parseFloat(bookItem[0]) === parseFloat(updateEntry[0])) {
          if (parseFloat(updateEntry[1]) > 0) {
            book[index] = updateEntry;
            entrySet = true;
            break;
          } else {
            entrySet = true;
            book.splice(index, 1);
            break;
          }
        }
      }
      if (entrySet === false) book.push(updateEntry);
    }
    return book;
  }

  public async subscribeBook(market: string) {
    await this.checkSocket();
    this.send({
      action: "getBook",
      market: market,
    });
    this.send({
      action: "subscribe",
      channels: [{ name: "book", markets: [market] }],
    });
  }
  public async subscribeBookMany(markets: string[]) {
    for (const market of markets) {
      this.subscribeBook(market);
      await wait(200);
    }
  }

  public async subscribeTrades(markets: string[]) {
    await this.checkSocket();
    this.send({
      action: "subscribe",
      channels: [{ name: "trades", markets }],
    });
  }

  private async pruneTrades(age: number, interval: number) {
    const now = Date.now();
    for (const market in this.localTrades) {
      const trades = this.localTrades[market];
      const pruned = trades.filter((trade) => trade.timestamp >= now - age);
      this.localTrades[market] = pruned;
    }
    setTimeout(async () => {
      this.pruneTrades(age, interval);
    }, interval);
  }
}

export default BitvavoWS;
