import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('[⚠️ REDIS WARNING]: REDIS_URL is not set. Defaulting to localhost:6379.');
}

// Robust configuration for Cloud Redis (like Upstash)
const redis = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Keeps trying to connect instead of crashing
    connectTimeout: 10000,      // 10 seconds timeout
});

redis.on('connect', () => console.log('[⚡ REDIS]: Connected Successfully'));

redis.on('error', (err: Error) => {
    // We log the error but don't let it crash the app
    if (err.message.includes('MaxRetriesPerRequestError')) return;
    
    if (err.message.includes('ECONNREFUSED')) {
        console.error(`[🚨 REDIS CONNECTION REFUSED]: Could not connect to Redis at ${redisUrl || 'localhost:6379'}. Please ensure REDIS_URL is correctly set in your environment.`);
    } else {
        console.error('[🚨 REDIS ERROR]:', err);
    }
});

export default redis;