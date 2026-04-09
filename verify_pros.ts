import prisma from './src/utils/prisma.ts';

async function verifyAllByRole() {
    console.log('--- FETCHING ALL USERS FROM DB ---');
    const allUsers = await prisma.user.findMany({
        include: { profile: true }
    });

    console.log(`Total users in DB: ${allUsers.length}`);

    console.log('\n--- DETAILED DATA FOR PROFESSIONALS (INCLUDING DUAL ROLE) ---');
    
    const professionalsList = allUsers.filter(u => {
        const roleStr = String(u.role || '').toUpperCase();
        const rolesArr = (u.roles || []).map(r => String(r).toUpperCase());
        const hasPro = roleStr === 'PROFESSIONAL' || rolesArr.includes('PROFESSIONAL');
        const isOnboarded = u.profile?.onboardingComplete === true;
        return hasPro || isOnboarded;
    });

    console.log(`Potential Professionals Found: ${professionalsList.length}`);
    
    professionalsList.forEach(u => {
        console.log(`- ${u.email}`);
        console.log(`  > Role: ${u.role}`);
        console.log(`  > Roles Array: ${JSON.stringify(u.roles)}`);
        console.log(`  > Onboarding: ${u.profile?.onboardingComplete}`);
        console.log(`  > Vetting: ${u.profile?.vettingStatus}`);
    });

    console.log('\n--- TARGET SEARCH: fonyuyjudegita@gmail.com ---');
    const target = allUsers.find(u => u.email === 'fonyuyjudegita@gmail.com');
    if (target) {
        console.log('Found target user in allUsers list.');
        const isProfessional = professionalsList.some(p => p.id === target.id);
        console.log(`Is in professional list? ${isProfessional}`);
    } else {
        console.log('Target user NOT FOUND in allUsers list!');
    }

    process.exit(0);
}

verifyAllByRole().catch(e => {
    console.error(e);
    process.exit(1);
});
