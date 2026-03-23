import prisma from '../utils/prisma.js';
import 'dotenv/config';

async function main() {
  console.log("🚀 Seeding rich test data for Client Dashboard...");

  // 1. Find or create a Test Client
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      username: 'TestClient',
      role: 'CLIENT',
      isVerified: true,
      profile: { create: { firstName: 'Test', lastName: 'Client' } }
    }
  });

  // 2. Find or create a Project Manager (for author info)
  const pm = await prisma.user.upsert({
    where: { email: 'pm@test.com' },
    update: {},
    create: {
      email: 'pm@test.com',
      username: 'ProjectManager',
      role: 'PROFESSIONAL',
      isVerified: true,
      profile: { 
        create: { 
          firstName: 'Jude', 
          lastName: 'Fonyuy',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jude' 
        } 
      }
    }
  });

  // 3. Create the Main Test Project
  const project = await prisma.project.create({
    data: {
      title: "ProVen Mobile App Alpha",
      description: "A high-end investment vetting platform for African startups.",
      targetAudience: "Investors and Founders",
      industry: ["Fintech", "Venture Capital"],
      requirements: "Must be scalable and secure.",
      budgetRange: "FROM_25K_TO_50K",
      timeline: "FROM_3_TO_6_MONTHS",
      status: "ACTIVE",
      clientId: client.id,
      projectManagerId: pm.id,
      totalBudget: 45000,
      budgetUsed: 12500,
    }
  });

  // 4. Create a Rich Sprint with ALL requested fields
  const sprint = await prisma.projectSprint.create({
    data: {
      projectId: project.id,
      title: "Phase 1: Brand & Infrastructure",
      description: "Setting the foundation for the ProVen ecosystem.",
      status: "IN_REVIEW",
      sprintNumber: 1,
      budget: 12500,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      
      // A. Objectives Checklist
      objectives: {
        create: [
          { title: "Define Color Palette & Typography", isCompleted: true, order: 1 },
          { title: "Setup PostgreSQL with Prisma", isCompleted: true, order: 2 },
          { title: "Implement JWT Auth Flow", isCompleted: false, order: 3 },
        ]
      },

      // B. Deliverables with Author Info
      sprintDeliverables: {
        create: [
          { 
            title: "Brand Guidelines PDF", 
            type: "PDF_DOCUMENT", 
            status: "SUBMITTED", 
            authorId: pm.id,
            fileUrl: "https://example.com/brand.pdf"
          },
          { 
            title: "Authentication API Core", 
            type: "GITHUB_REPOSITORY", 
            status: "PENDING", 
            authorId: pm.id,
            fileUrl: "https://github.com/proven/auth-api" 
          }
        ]
      },

      // C. Payment & Budget Info
      payment: {
        create: {
          totalAmount: 12500,
          amountPaid: 5000,
          status: "PARTIAL",
          paidAt: new Date(),
        }
      },

      // D. Activity Log
      activities: {
        create: [
          { type: "SPRINT_STARTED", description: "Sprint initiated by the project manager.", actorId: pm.id },
          { type: "DELIVERABLE_SUBMITTED", description: "Brand Guidelines PDF submitted for review.", actorId: pm.id },
          { type: "COMMENT_ADDED", description: "Looking great so far! Please check the colors.", actorId: client.id },
        ]
      },

      // E. Tasks (for the Kanban Board)
      tasks: {
        create: [
          { title: "Design Login Screen", status: "DONE", priority: "HIGH", professionalIds: [pm.id], projectId: project.id },
          { title: "API Endpoint Testing", status: "IN_PROGRESS", priority: "MEDIUM", professionalIds: [pm.id], projectId: project.id },
          { title: "Fix Header Styling", status: "TODO", priority: "LOW", professionalIds: [pm.id], projectId: project.id },
        ]
      }
    }
  });

  console.log("");
  console.log("  ✅ SUCCESS: Test Data Created!");
  console.log("");
  console.log("  USE THESE IDs IN SWAGGER:");
  console.log("  -------------------------");
  console.log(`  Project ID: ${project.id}`);
  console.log(`  Sprint ID:  ${sprint.id}`);
  console.log("  -------------------------");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
