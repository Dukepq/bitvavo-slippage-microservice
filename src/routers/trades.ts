import { Router } from "express";
const router = Router();

import {
  getTrades,
  getTradedVolume,
  getSpecificTradedVolume,
} from "../controllers/tradesController";

router.get("/market/:market", getTrades);
router.get("/volume", getTradedVolume);
router.get("/volume/:market", getSpecificTradedVolume);

export default router;
