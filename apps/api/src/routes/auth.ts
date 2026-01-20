import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create organization and user
    const passwordHash = await bcrypt.hash(password, 10);
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: `${slug}-${Date.now()}`,
        users: {
          create: {
            email,
            passwordHash,
            name,
            role: 'OWNER'
          }
        }
      },
      include: { users: true }
    });

    const user = org.users[0];
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
        organizationName: org.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    });

    res.json({
      user: {
        id: fullUser!.id,
        email: fullUser!.email,
        name: fullUser!.name,
        role: fullUser!.role,
        organizationId: fullUser!.organizationId,
        organization: fullUser!.organization
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
