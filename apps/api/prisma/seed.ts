import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'PROFESSIONAL',
      brandColors: ['#6366f1', '#8b5cf6', '#ec4899']
    }
  });

  console.log('Created organization:', org.name);

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@trudigital.io' },
    update: { passwordHash },
    create: {
      email: 'demo@trudigital.io',
      passwordHash,
      name: 'Demo User',
      role: 'ADMIN',
      organizationId: org.id
    }
  });

  console.log('Created user:', user.email);
  console.log('Password: demo123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
