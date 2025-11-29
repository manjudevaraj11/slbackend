import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.log("err.message: ", err.message);
  logger.error({
    requestId: req.requestId,
    body: req.body,
    message: err.message,
    stack: err.stack,
    method: req.method,
    query: req.query,
    url: req.originalUrl,
  });

  return res.status(500).json({
    message: "Internal server error",
  });
}
