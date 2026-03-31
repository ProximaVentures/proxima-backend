import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { Role } from '@prisma/client';

interface JwtPayload {
    userId: string;
    role: Role;
    iat: number;
    exp: number;
}

export interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        role: Role;
        email: string;
    }
}

/**
 * Socket.io Middleware to authenticate connection attempt.
 * Decodes the JWT from the handshake auth or headers and fetches the user.
 */
export const authenticateSocket = () => {
    return async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
        try {
            // 1. Get token from handshake auth or headers
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                console.error('[🚨 SOCKET AUTH]: No token provided in handshake.');
                return next(new Error('Authentication failed: Missing token'));
            }

            const secret = process.env.JWT_SECRET || 'secret';

            // 2. Clear previous data to prevent leaks (standard practice in long-lived connections)
            socket.data.user = null;

            // 3. Verify JWT
            const decoded = jwt.verify(token, secret) as JwtPayload;

            // 4. Validate user existence and status
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, isVerified: true }
            });

            if (!user) {
                console.error(`[🚨 SOCKET AUTH]: User ${decoded.userId} not found.`);
                return next(new Error('Authentication failed: User not found'));
            }

            // 5. Attach user details to socket object for easy access in handlers
            socket.user = {
                id: user.id,
                role: user.role,
                email: user.email
            };

            // Use socket.data as the canonical place for custom data
            socket.data.userId = user.id;

            console.log(`[⚡ SOCKET AUTH]: User ${user.id} (${user.role}) authenticated successfully.`);
            next();
        } catch (error: any) {
            console.error('[🚨 SOCKET AUTH ERROR]:', error.message);
            return next(new Error('Authentication failed: Invalid or expired token'));
        }
    };
};
