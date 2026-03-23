import type { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
    id: string;
    role: Role;
    roles: Role[];
    email: string;
    onboardingComplete: boolean;
    vettingStatus?: string | null | undefined;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

// clear