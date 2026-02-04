import { Redis } from 'ioredis';
// Robust configuration for Cloud Redis (like Upstash)
const redis = new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: null, // Keeps trying to connect instead of crashing
    connectTimeout: 10000,      // 10 seconds timeout
});
redis.on('connect', () => console.log('[⚡ REDIS]: Connected'));
redis.on('error', (err: Error) => {
    // We log the error but don't let it crash the app
    if (err.message.includes('MaxRetriesPerRequestError')) return;
    console.error('[🚨 REDIS ERROR]:', err);
});
export default redis;