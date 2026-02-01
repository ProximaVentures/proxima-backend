import { PrismaClient } from '@prisma/client';

// 🏫 Professor's Tip: Use a Singleton pattern for the DB client.
// This prevents creating too many connections to the database,
// especially in serverless environments like Neon/Vercel.

const prisma = new PrismaClient();

export default prisma;
