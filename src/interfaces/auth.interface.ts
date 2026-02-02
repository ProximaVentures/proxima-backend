import type { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
    id: string;
    role: Role;
    email: string;
    onboardingComplete: boolean;
    vettingStatus?: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}
