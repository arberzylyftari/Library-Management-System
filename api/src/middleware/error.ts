import type { NextFunction, Request, Response } from "express";

// Central error handler. Express 5 forwards rejected promises from async
// handlers here, so controllers don't need their own try/catch for unexpected errors.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
