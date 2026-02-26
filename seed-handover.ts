import prisma from './src/utils/prisma';

async function main() {
    console.log('🚀 Starting intensive project workspace seeding...');

    // Diagnostic check
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully.');
    } catch (e) {
        console.error('❌ Database connection failed:', e);
        process.exit(1);
    }

    // 1. Get an active project or any project as fallback
    let project = await prisma.project.findFirst({
        where: { status: 'ACTIVE' },
        include: { assignments: true }
    });

    if (!project) {
        console.log('⚠️ No active project found, falling back to most recent project...');
        project = await prisma.project.findFirst({
            include: { assignments: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    if (!project) {
        console.error('❌ No projects found in the database. Please create a project first.');
        return;
    }

    console.log(`📂 Seeding premium workspace data for project: ${project.title} (${project.id})`);

    // 2. Fetch professional to assign
    const professional = await prisma.user.findFirst({
        where: { role: 'PROFESSIONAL' }
    });

    if (!professional) {
        console.error('❌ No professional found to targeted seeding.');
        return;
    }

    // Ensure they are assigned
    const assignment = await prisma.projectAssignment.upsert({
        where: {
            projectId_userId: {
                projectId: project.id,
                userId: professional.id
            }
        },
        update: { status: 'ACTIVE' },
        create: {
            projectId: project.id,
            userId: professional.id,
            role: 'Lead Fullstack Developer',
            status: 'ACTIVE'
        }
    });

    // 3. Add Project Info
    await prisma.projectInfo.create({
        data: {
            projectId: project.id,
            title: 'Mission Statement',
            content: 'Our core objective is to build a decentralized workspace that prioritizes privacy, speed, and beautiful design. Every component we ship must feel premium and instantaneous.',
            professionalIds: [professional.id]
        }
    });

    // 4. Add Meetings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    afterTomorrow.setHours(14, 0, 0, 0);

    await prisma.projectMeeting.createMany({
        data: [
            {
                projectId: project.id,
                title: 'Sprint Planning: Workspace V1',
                description: 'Reviewing the initial high-fidelity mockups and setting the technical roadmap for the upcoming sprint.',
                meetingLink: 'https://meet.google.com/abc-defg-hij',
                startTime: tomorrow,
                duration: '45 mins',
                attendeeIds: [professional.id]
            },
            {
                projectId: project.id,
                title: 'Infrastructure Sync',
                description: 'Discussion on the transition to Neon DB and Prisma ORM optimization strategies.',
                meetingLink: 'https://zoom.us/j/123456789',
                startTime: afterTomorrow,
                duration: '30 mins',
                attendeeIds: [professional.id]
            }
        ]
    });

    // 5. Add Documents
    await prisma.projectDocument.createMany({
        data: [
            {
                projectId: project.id,
                title: 'Software Requirements Specification (SRS)',
                url: 'https://docs.proven.com/srs-v1.2.pdf',
                type: 'SRS',
                description: 'Comprehensive functional and non-functional requirements for the platform.',
                professionalIds: [professional.id]
            },
            {
                projectId: project.id,
                title: 'Sprint 2 Roadmap',
                url: 'https://docs.proven.com/sprint-2-plan.docx',
                type: 'SPRINT',
                description: 'Detailed breakdown of tasks and deliverables for the next 14 days.',
                professionalIds: [professional.id]
            }
        ]
    });

    // 6. Add Tasks
    await prisma.projectTask.createMany({
        data: [
            {
                projectId: project.id,
                title: 'Implement Dark Mode Architecture',
                description: 'Refactor index.css to use HSL variables and ensure smooth transitions between themes.',
                status: 'IN_PROGRESS',
                priority: 'URGENT',
                dueDate: tomorrow,
                professionalIds: [professional.id]
            },
            {
                projectId: project.id,
                title: 'Optimize API Response Time',
                description: 'Profile the project details endpoint and add caching layer where necessary.',
                status: 'TODO',
                priority: 'HIGH',
                professionalIds: [professional.id]
            }
        ]
    });

    console.log('✅ Premium workspace seeding complete! Your "Mission Control" is now live with real data.');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
