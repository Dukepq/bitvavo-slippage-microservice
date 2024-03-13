import { Router } from "express";
const router = Router();

import { getTrades } from "../controllers/tradesController";

router.get("/:market", getTrades);

export default router;
