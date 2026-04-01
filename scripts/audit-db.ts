import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.user.count({ where: { role: 'CLIENT' } });
    const professionals = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    console.log('--- DB Audit ---');
    console.log('Clients:', clients);
    console.log('Professionals:', professionals);
    console.log('Admins:', admins);
    
    const allPros = await prisma.user.findMany({
        where: { role: 'PROFESSIONAL' },
        include: { profile: true }
    });
    console.log('Professional Details:', JSON.stringify(allPros, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
