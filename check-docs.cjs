
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectDocs() {
  try {
    const latestProject = await prisma.project.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });

    if (latestProject) {
      console.log('--- LATEST PROJECT ---');
      console.log('ID:', latestProject.id);
      console.log('Title:', latestProject.title);
      console.log('Documentscount:', latestProject.documents.length);
      latestProject.documents.forEach((doc, idx) => {
        console.log(`Document ${idx + 1}:`, doc.name, '->', doc.url);
      });
    } else {
      console.log('No projects found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectDocs();
