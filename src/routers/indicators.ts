import express from "express";
const router = express.Router();
import { getRobs } from "../controllers/indicatorController";

router.get("/robs", getRobs);

export default router;
