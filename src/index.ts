import express from "express";
import { limiter } from "./config/rateLimit";
import envVar from "./utils/envHelper";
import orderBookRouter from "./routers/orderBook";
import tradesRouter from "./routers/trades";
import indicatorsRouter from "./routers/indicators";
import authMiddleware from "./middleware/authMiddleware";

const app = express();
app.use(limiter);
app.use(authMiddleware);

app.use("/orderBook", orderBookRouter);
app.use("/trades", tradesRouter);
app.use("/indicators", indicatorsRouter);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "resource not found" });
});

const PORT = envVar("PORT");
app.listen(PORT, () => {
  console.log("Listening on port: " + PORT);
});
