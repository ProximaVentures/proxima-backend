import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { AppError } from './error.middleware.js';

// 🏫 Professor's Tip: A generic validation middleware keeps your controllers clean.
// It stops "bad data" at the door before it even reaches your business logic.

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return next(new AppError(message, 400));
        }
        next(error);
    }
};
