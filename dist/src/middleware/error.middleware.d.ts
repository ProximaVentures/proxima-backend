import type { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map