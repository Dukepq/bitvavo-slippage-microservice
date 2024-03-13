import express from "express";
const router = express.Router();
import {
  getSimpleRobs,
  getComplexRobs,
} from "../controllers/indicatorController";

router.get("/robs", getSimpleRobs);
router.get("/robs-complex", getComplexRobs);

export default router;
