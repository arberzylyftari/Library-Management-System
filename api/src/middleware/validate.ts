import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

// Validates req.body against a Zod schema, replacing it with the parsed
// (and normalized) result. Responds 400 with field errors on failure.
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
