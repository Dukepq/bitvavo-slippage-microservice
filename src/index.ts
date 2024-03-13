import express from "express";
import { limiter } from "./config/rateLimit";
import envVar from "./utils/envHelper";
import orderBookRouter from "./routers/orderBook";
import trades from "./dataProcessing/trades";

setInterval(() => console.log(trades), 1000);

const app = express();
app.use(limiter);

app.use("/orderBook", orderBookRouter);

const PORT = envVar("PORT");
app.listen(PORT, () => {
  console.log("Listening on port: " + PORT);
});
