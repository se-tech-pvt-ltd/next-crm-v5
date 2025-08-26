import { z } from "zod";

export function validateId(id: string): number {
  const parsed = parseInt(id);
  if (isNaN(parsed)) {
    throw new Error("Invalid ID format");
  }
  return parsed;
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  };
}
