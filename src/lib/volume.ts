import { Candle } from "../types/bitvavoTypes";

export function getVolume(candles: Candle[]) {
  let cumulativeVolume = 0;
  for (const candle of candles) {
    const volume = Number(candle[5]);
    cumulativeVolume += volume;
  }
  return cumulativeVolume / candles.length;
}
