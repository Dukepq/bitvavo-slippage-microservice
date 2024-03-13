import { Market } from "../dataFetching/fetchBitvavoData";
import fs from "fs";
import path from "path";

function initStaticData() {
  const buffer: Buffer = fs.readFileSync(
    path.join(__dirname, "../../", "markets.json")
  );
  const markets: Market[] | undefined = JSON.parse(buffer.toString());

  if (!Array.isArray(markets)) throw new Error("could not load markets array");
  return markets;
}
const markets = initStaticData();

export default markets;
