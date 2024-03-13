import { Response, Request, NextFunction } from "express";
import envVar from "../utils/envHelper";
const apiKeys = envVar("API_KEYS");
const keys = apiKeys.split(",");

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authKey = req.headers.authorization;
  if (!authKey || !keys.includes(authKey)) {
    return res
      .status(401)
      .json({ success: false, message: "provide a correct API key" });
  }
  next();
}
