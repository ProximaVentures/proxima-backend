// Forced restart to pick up new Prisma Client with 'replyTo' field.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Utilize pooled database connections for optimal throughput.
const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 20000,
    ssl: {
        rejectUnauthorized: false // Necessary for some Neon environments/proxies
    }
});

// Proactively handle pool errors to prevent process crashes
pool.on('error', (err) => {
    console.error('[🚨 DB POOL ERROR]:', err.message);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export default prisma;
