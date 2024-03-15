import express from "express";
const router = express.Router();
import {
  getSimpleRobs,
  getComplexRobs,
  getSpecificComplexRobs,
} from "../controllers/indicatorController";

router.get("/robs", getSimpleRobs);
router.get("/robs/complex", getComplexRobs);
router.get("/robs/complex/:market", getSpecificComplexRobs);

export default router;
