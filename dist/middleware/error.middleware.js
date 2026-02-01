// 🏫 Professor's Tip: Never let your server crash on an error!
// A Centralized Error Handler catches everything and returns a clean JSON response.
export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
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
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
//# sourceMappingURL=error.middleware.js.map