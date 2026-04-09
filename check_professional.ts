import prisma from './src/utils/prisma.ts';
import { Role } from '@prisma/client';

async function check() {
    console.log('--- DIAGNOSTIC START ---');
    const email = 'fonyuyjudegita@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user) {
        console.log(`User ${email} NOT FOUND in database!`);
        return;
    }

    console.log('User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Primary Role (user.role):', user.role);
    console.log('Roles Array (user.roles):', JSON.stringify(user.roles));
    console.log('Profile Exists:', !!user.profile);
    if (user.profile) {
        console.log('Profile Onboarding Complete:', user.profile.onboardingComplete);
        console.log('Vetting Status:', user.profile.vettingStatus);
    }

    // Role enum check
    console.log('Role Enum PROFESSIONAL:', Role.PROFESSIONAL);
    console.log('Role Enum CLIENT:', Role.CLIENT);

    // Test the filter logic
    const isProfessional = 
        user.role === Role.PROFESSIONAL || 
        (user.roles && user.roles.includes(Role.PROFESSIONAL)) || 
        user.profile?.onboardingComplete === true;
    
    console.log('Calculated as Professional:', isProfessional);

    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
