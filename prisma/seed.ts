import prisma from '../src/utils/prisma.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database restoration...');

  // 1. Clear any remnants (just in case)
  // We already did a reset, but this is good practice
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proven.com' },
    update: {},
    create: {
      email: 'admin@proven.com',
      password: hashedPassword,
      username: 'admin_proven',
      role: Role.ADMIN,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Proven',
          lastName: 'Administrator',
          avatarUrl: 'https://ui-avatars.com/api/?name=Proven+Admin&background=0D1117&color=fff'
        }
      }
    }
  });
  console.log('✅ Admin created');

  // 3. Create Client
  const client = await prisma.user.upsert({
    where: { email: 'client@proven.com' },
    update: {},
    create: {
      email: 'client@proven.com',
      password: hashedPassword,
      username: 'luxury_client',
      role: Role.CLIENT,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Elite',
          lastName: 'Client',
          avatarUrl: 'https://ui-avatars.com/api/?name=Elite+Client&background=F97316&color=fff'
        }
      }
    }
  });
  console.log('✅ Client created');

  // 4. Create Professional
  const pro = await prisma.user.upsert({
    where: { email: 'pro@proven.com' },
    update: {},
    create: {
      email: 'pro@proven.com',
      password: hashedPassword,
      username: 'pro_expert',
      role: Role.PROFESSIONAL,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Expert',
          lastName: 'Partner',
          avatarUrl: 'https://ui-avatars.com/api/?name=Expert+Partner&background=1E293B&color=fff'
        }
      }
    }
  });
  console.log('✅ Professional created');

  // 5. Create a Project for the Client
  const project = await prisma.project.create({
    data: {
      title: 'Global Branding Campaign',
      description: 'A high-end visual identity and digital strategy for a new luxury real estate venture.',
      targetAudience: 'Ultra-high-net-worth individuals',
      industry: ['Real Estate', 'Luxury', 'Digital Strategy'],
      requirements: 'Complete visual identity, website, and social media launch.',
      category: 'Branding & Design',
      status: 'ACTIVE',
      budgetRange: 'FROM_25K_TO_50K',
      timeline: 'FROM_3_TO_6_MONTHS',
      totalBudget: 45000,
      clientId: client.id,
      projectManagerId: admin.id
    }
  });
  console.log('✅ Project created');

  // 6. Assign Professional to Project
  await prisma.projectAssignment.create({
    data: {
      projectId: project.id,
      userId: pro.id,
      role: 'Creative Director',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Professional assigned to project');

  // 7. Create a single Project-wide Conversation
  const projectConv = await prisma.conversation.create({
    data: {
      projectId: project.id,
      isGroup: true,
      name: `${project.title} - Main Channel`,
      participants: {
        create: [
          { userId: admin.id },
          { userId: client.id },
          { userId: pro.id }
        ]
      }
    }
  });
  console.log('✅ Unified Project Conversation initialized');

  const msg1 = await prisma.message.create({
    data: {
      conversationId: projectConv.id,
      senderId: admin.id,
      content: 'Welcome to the global branding workspace! Admin, Client, and Expert Partner are all present.',
    }
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: projectConv.id,
      senderId: client.id,
      content: 'Perfect. Looking forward to the collaboration.',
    }
  });

  // Test Reply!
  await prisma.message.create({
    data: {
      conversationId: projectConv.id,
      senderId: pro.id,
      replyToId: msg2.id,
      content: 'I have started reviewing the project requirements. I will share the first draft by tomorrow.',
    }
  });

  console.log('✨ Data restoration complete. The platform is ready for testing.');
}

main()
  .catch((e) => {
    console.error('❌ Restoration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
