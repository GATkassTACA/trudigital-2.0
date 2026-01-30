import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all displays
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const displays = await prisma.display.findMany({
      where: { organizationId: user.organizationId },
      include: {
        playlist: {
          include: {
            items: {
              include: { content: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ displays });
  } catch (error) {
    next(error);
  }
});

// Get single display
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const display = await prisma.display.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      },
      include: {
        playlist: {
          include: {
            items: { include: { content: true }, orderBy: { order: 'asc' } }
          }
        }
      }
    });

    if (!display) {
      return res.status(404).json({ error: 'Display not found' });
    }

    res.json({ display });
  } catch (error) {
    next(error);
  }
});

// Register new display
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, orientation, width, height, location, timezone } = req.body;

    const display = await prisma.display.create({
      data: {
        name,
        orientation: orientation || 'LANDSCAPE',
        width: width || 1920,
        height: height || 1080,
        location,
        timezone: timezone || 'America/New_York',
        organizationId: user.organizationId
      }
    });

    res.json({ display });
  } catch (error) {
    next(error);
  }
});

// Update display
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, orientation, playlistId, location, timezone } = req.body;

    const display = await prisma.display.updateMany({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      },
      data: {
        ...(name && { name }),
        ...(orientation && { orientation }),
        ...(playlistId !== undefined && { playlistId }),
        ...(location && { location }),
        ...(timezone && { timezone })
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete display
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    await prisma.display.deleteMany({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// =====================
// DISPLAY PLAYER ENDPOINTS (public, use deviceKey)
// =====================

// Player heartbeat / get content
router.get('/player/:deviceKey', async (req, res, next) => {
  try {
    const display = await prisma.display.update({
      where: { deviceKey: req.params.deviceKey },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        ipAddress: req.ip
      },
      include: {
        playlist: {
          include: {
            items: {
              include: { content: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    res.json({
      display: {
        id: display.id,
        name: display.name,
        orientation: display.orientation,
        width: display.width,
        height: display.height,
        playlist: display.playlist
      }
    });
  } catch (error) {
    next(error);
  }
});

// Heartbeat only (lightweight)
router.post('/heartbeat', async (req, res, next) => {
  try {
    const { deviceKey } = req.body;

    if (!deviceKey) {
      return res.status(400).json({ error: 'Device key required' });
    }

    await prisma.display.update({
      where: { deviceKey },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        ipAddress: req.ip
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
