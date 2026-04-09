import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    console.log('--- Checking User: fonyuyjudegita@gmail.com ---');
    const user = await prisma.user.findUnique({
        where: { email: 'fonyuyjudegita@gmail.com' },
        include: { profile: true }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User ID:', user.id);
    console.log('Primary Role:', user.role);
    console.log('Roles Array:', user.roles);
    console.log('Onboarding Complete:', user.profile?.onboardingComplete);
    console.log('Vetting Status:', user.profile?.vettingStatus);

    console.log('--- Testing Query Logic ---');
    const matchesProfessional = await prisma.user.findMany({
        where: {
            OR: [
                { role: Role.PROFESSIONAL },
                { roles: { has: Role.PROFESSIONAL } },
                { profile: { onboardingComplete: true } }
            ],
            email: 'fonyuyjudegita@gmail.com'
        }
    });

    console.log('Matches Professional Query:', matchesProfessional.length > 0 ? 'YES' : 'NO');
    
    if (matchesProfessional.length === 0) {
        console.log('Why did it fail? testing individual conditions:');
        const cond1 = await prisma.user.count({ where: { role: Role.PROFESSIONAL, email: 'fonyuyjudegita@gmail.com' } });
        const cond2 = await prisma.user.count({ where: { roles: { has: Role.PROFESSIONAL }, email: 'fonyuyjudegita@gmail.com' } });
        const cond3 = await prisma.user.count({ where: { profile: { onboardingComplete: true }, email: 'fonyuyjudegita@gmail.com' } });
        console.log('- Role is PROFESSIONAL:', cond1 > 0);
        console.log('- Roles HAS PROFESSIONAL:', cond2 > 0);
        console.log('- Profile Onboarding Complete:', cond3 > 0);
    }

    await prisma.$disconnect();
}

checkUser().catch(console.error);
