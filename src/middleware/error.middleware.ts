import type { Request, Response, NextFunction } from 'express';

// Global exception handler to prevent process termination.

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // 🛡️ Security Hardening: Sanitize all 500+ errors for production
    if (process.env.NODE_ENV === 'production') {
        if ((err.code && err.code.startsWith('P')) || statusCode >= 500) {
            message = "We're perfecting your experience. Connection interrupted, please try again.";
            statusCode = 500;
        }
    }

    const errorId = Math.random().toString(36).substring(7).toUpperCase();

    console.error(`[🚨 ERROR ${errorId}]: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' && statusCode >= 500
            ? `${message} (Ref: ${errorId})`
            : message,
        // Only show stack in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        errorId: process.env.NODE_ENV === 'development' ? errorId : undefined,
    });
};

// 🌊 Async Handler: Replaces try/catch blocks in controllers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
