import { fetchMarkets } from "../dataFetching/fetchBitvavoData";
import fs from "fs";
import path = require("path");

async function generateMarketDataFile() {
  const [data, err] = await fetchMarkets();
  if (err) {
    console.error("could not generate markets - " + err.message);
  }
  if (!data) {
    console.error("Could not write file, data was null.");
    return;
  }
  const filteredData = data.filter((market) => market.status === "trading");
  fs.writeFileSync(
    path.join(__dirname, "../../", "markets.json"),
    JSON.stringify(filteredData)
  );
}

generateMarketDataFile();
