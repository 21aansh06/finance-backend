import { PrismaClient, Role, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB seed...');

  const passwordHashAdmin = await bcrypt.hash('Admin@123', 12);
  const passwordHashAnalyst = await bcrypt.hash('Analyst@123', 12);
  const passwordHashViewer = await bcrypt.hash('Viewer@123', 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@finance.com',
      passwordHash: passwordHashAdmin,
      role: Role.ADMIN,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance.com' },
    update: {},
    create: {
      name: 'Analyst User',
      email: 'analyst@finance.com',
      passwordHash: passwordHashAnalyst,
      role: Role.ANALYST,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finance.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@finance.com',
      passwordHash: passwordHashViewer,
      role: Role.VIEWER,
    },
  });

  //30 records
  await prisma.financialRecord.deleteMany({ where: { createdBy: admin.id } });

  const recordsData: any[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const isIncome = Math.random() < 0.4;
    const type = isIncome ? RecordType.INCOME : RecordType.EXPENSE;
    
    let category = '';
    let amountStr = '';
    
    if (isIncome) {
      category = ['Salary', 'Freelance', 'Investment'][Math.floor(Math.random() * 3)];
      const amt = Math.floor(Math.random() * (80000 - 50000 + 1) + 50000); 
      amountStr = amt.toString();
    } else {
      category = ['Rent', 'Food', 'Utilities', 'Healthcare', 'Transport', 'Entertainment'][Math.floor(Math.random() * 6)];
      if (category === 'Rent') {
        const amt = Math.floor(Math.random() * (25000 - 15000 + 1) + 15000);
        amountStr = amt.toString();
      } else if (category === 'Food') {
        const amt = Math.floor(Math.random() * (8000 - 3000 + 1) + 3000);
        amountStr = amt.toString();
      } else {
        const amt = Math.floor(Math.random() * (5000 - 500 + 1) + 500);
        amountStr = amt.toString();
      }
    }

    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    recordsData.push({
      amount: amountStr,
      type,
      category,
      date,
      createdBy: admin.id,
      notes: `Seeded ${category} record`,
    });
  }

  await prisma.financialRecord.createMany({
    data: recordsData
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
