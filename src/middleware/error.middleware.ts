import type { Request, Response, NextFunction } from 'express';

// 🏫 Professor's Tip: Never let your server crash on an error!
// A Centralized Error Handler catches everything and returns a clean JSON response.

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[🚨 ERROR]: ${message}`);

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

// 🌊 Async Handler: Replaces try/catch blocks in controllers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
