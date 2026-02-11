import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all playlists
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const playlists = await prisma.playlist.findMany({
      where: { organizationId: user.organizationId },
      include: {
        items: { include: { content: true }, orderBy: { order: 'asc' } },
        _count: { select: { displays: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ playlists });
  } catch (error) {
    next(error);
  }
});

// Get single playlist
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      },
      include: {
        items: { include: { content: true }, orderBy: { order: 'asc' } },
        displays: true
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ playlist });
  } catch (error) {
    next(error);
  }
});

// Create playlist
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, isDefault } = req.body;

    const playlist = await prisma.playlist.create({
      data: {
        name,
        isDefault: isDefault || false,
        organizationId: user.organizationId
      }
    });

    res.json({ playlist });
  } catch (error) {
    next(error);
  }
});

// Update playlist
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, scheduleType, scheduleData } = req.body;

    const playlist = await prisma.playlist.updateMany({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      },
      data: {
        ...(name && { name }),
        ...(scheduleType && { scheduleType }),
        ...(scheduleData && { scheduleData })
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete playlist
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    await prisma.playlist.deleteMany({
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

// Add content to playlist
router.post('/:id/items', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { contentId, duration, order, transition, transitionData } = req.body;

    // Verify playlist belongs to org
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const item = await prisma.playlistItem.create({
      data: {
        playlistId: req.params.id,
        contentId,
        duration: duration || 10,
        order: order || 0,
        transition: transition || 'fade',
        ...(transitionData && { transitionData })
      },
      include: { content: true }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Remove content from playlist
router.delete('/:id/items/:itemId', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    // Verify playlist belongs to org
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    await prisma.playlistItem.delete({
      where: { id: req.params.itemId }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Reorder playlist items
router.put('/:id/reorder', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { items } = req.body; // Array of { id, order }

    // Verify playlist belongs to org
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Update all items
    await Promise.all(
      items.map((item: { id: string; order: number }) =>
        prisma.playlistItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
