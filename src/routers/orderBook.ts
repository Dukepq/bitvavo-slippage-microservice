import { Router } from "express";
const router = Router();

import { getOrderBook } from "../controllers/orderBookController";

router.get("/:market", getOrderBook);

export default router;
