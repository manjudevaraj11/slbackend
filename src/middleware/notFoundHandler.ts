import { Request, Response, NextFunction } from "express";

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const error = Object.assign(
    new Error(`Route not found: ${req.originalUrl}`),
    { status: 404 },
  );

  next(error);
}
