import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../middleware/error.middleware.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID Token and returns the payload.
 * @param token The Google ID Token from the frontend.
 * @returns The user's Google profile information.
 */
export async function verifyGoogleToken(token: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw new AppError('Google Client ID is not configured on the server', 500);
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new AppError('Invalid Google token: No payload found', 400);
        }

        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub, // The Google user ID
        };
    } catch (error: any) {
        console.error('[🚨 GOOGLE AUTH ERROR]:', error.message);
        throw new AppError('Google authentication failed. Please try again.', 401);
    }
}
