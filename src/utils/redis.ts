import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('[⚠️ REDIS WARNING]: REDIS_URL is not set. Defaulting to localhost:6379.');
}

// Robust configuration for Cloud Redis (like Upstash)
const redis = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    connectTimeout: 20000, // 20 seconds timeout
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.warn(`[⚠️ REDIS RETRY]: Default connection attempt ${times}. Retrying in ${delay}ms...`);
        return delay;
    },
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