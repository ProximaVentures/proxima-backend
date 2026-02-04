import 'dotenv/config';
import redis from './src/utils/redis.ts';
async function test() {
    console.log('Testing Redis...');
    try {
        await redis.set('test-key', 'Hello ProProven!');
        const value = await redis.get('test-key');
        console.log('Redis says:', value);
    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        process.exit(0);
    }
}
test();