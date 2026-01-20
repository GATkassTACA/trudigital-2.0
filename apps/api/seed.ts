import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function seed() {
  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const org = await prisma.organization.create({
      data: {
        name: 'Demo Company',
        slug: 'demo',
      }
    });

    await prisma.user.create({
      data: {
        email: 'demo@trudigital.com',
        passwordHash: hashedPassword,
        name: 'Demo User',
        role: 'OWNER',
        organizationId: org.id
      }
    });

    console.log('Demo account created!');
    console.log('Email: demo@trudigital.com');
    console.log('Password: demo123');
  } catch (e: any) {
    if (e.code === 'P2002') {
      console.log('Demo account already exists');
      console.log('Email: demo@trudigital.com');
      console.log('Password: demo123');
    } else {
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }
}

seed();
