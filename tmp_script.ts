import prisma from './src/utils/prisma.js';

async function run() {
    const profiles = await prisma.profile.findMany({ include: { user: true } });
    console.log(profiles.map(p => ({
        email: p.user.email,
        role: p.user.role,
        roles: p.user.roles,
        cat: p.category,
        firstName: p.firstName
    })));
    await prisma.$disconnect();
}
run();
