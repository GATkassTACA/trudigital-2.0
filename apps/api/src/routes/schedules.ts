import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const CreateScheduleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['ALWAYS', 'TIME_RANGE', 'DATE_RANGE', 'DAY_OF_WEEK', 'DATETIME_RANGE']).default('TIME_RANGE'),
  startTime: z.string().optional(), // HH:mm
  endTime: z.string().optional(),
  startDate: z.string().optional(), // ISO date
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
});

const UpdateScheduleSchema = CreateScheduleSchema.partial();

// List all schedules for organization
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const schedules = await prisma.schedule.findMany({
      where: { organizationId: user.organizationId },
      include: {
        playlistItems: {
          include: {
            content: {
              select: { id: true, name: true, thumbnailUrl: true }
            },
            playlist: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
    });

    res.json({ schedules });
  } catch (error) {
    next(error);
  }
});

// Get single schedule
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { id } = req.params;

    const schedule = await prisma.schedule.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        playlistItems: {
          include: {
            content: true,
            playlist: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

// Create schedule
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const input = CreateScheduleSchema.parse(req.body);

    const schedule = await prisma.schedule.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        startTime: input.startTime,
        endTime: input.endTime,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        daysOfWeek: input.daysOfWeek,
        priority: input.priority,
        isActive: input.isActive,
        organizationId: user.organizationId,
      }
    });

    res.json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
});

// Update schedule
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { id } = req.params;
    const input = UpdateScheduleSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const updateData: any = { ...input };
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
});

// Delete schedule
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Remove schedule from all playlist items first
    await prisma.playlistItem.updateMany({
      where: { scheduleId: id },
      data: { scheduleId: null }
    });

    await prisma.schedule.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Assign schedule to playlist item
router.post('/:id/assign', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { id } = req.params;
    const { playlistItemId } = req.body;

    // Verify schedule ownership
    const schedule = await prisma.schedule.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Verify playlist item ownership (via playlist -> org)
    const playlistItem = await prisma.playlistItem.findFirst({
      where: { id: playlistItemId },
      include: { playlist: true }
    });

    if (!playlistItem || playlistItem.playlist.organizationId !== user.organizationId) {
      return res.status(404).json({ error: 'Playlist item not found' });
    }

    const updated = await prisma.playlistItem.update({
      where: { id: playlistItemId },
      data: { scheduleId: id },
      include: { schedule: true, content: true }
    });

    res.json({ success: true, playlistItem: updated });
  } catch (error) {
    next(error);
  }
});

// Remove schedule from playlist item
router.post('/:id/unassign', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { playlistItemId } = req.body;

    // Verify playlist item ownership (via playlist -> org)
    const playlistItem = await prisma.playlistItem.findFirst({
      where: { id: playlistItemId },
      include: { playlist: true }
    });

    if (!playlistItem || playlistItem.playlist.organizationId !== user.organizationId) {
      return res.status(404).json({ error: 'Playlist item not found' });
    }

    const updated = await prisma.playlistItem.update({
      where: { id: playlistItemId },
      data: { scheduleId: null },
      include: { content: true }
    });

    res.json({ success: true, playlistItem: updated });
  } catch (error) {
    next(error);
  }
});

// Get active content for a display based on current time
router.get('/active/:displayId', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { displayId } = req.params;

    // Get the display and its playlist
    const display = await prisma.display.findFirst({
      where: { id: displayId, organizationId: user.organizationId },
      include: {
        playlist: {
          include: {
            items: {
              include: {
                content: true,
                schedule: true
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!display || !display.playlist) {
      return res.json({ activeItems: [] });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const currentDay = now.getDay(); // 0 = Sunday

    // Filter items based on schedules
    const activeItems = display.playlist.items.filter(item => {
      if (!item.schedule || !item.schedule.isActive) {
        return true; // No schedule = always show
      }

      const schedule = item.schedule;

      // Check day of week
      if (!schedule.daysOfWeek.includes(currentDay)) {
        return false;
      }

      // Check date range
      if (schedule.startDate && now < schedule.startDate) return false;
      if (schedule.endDate && now > schedule.endDate) return false;

      // Check time range
      if (schedule.startTime && schedule.endTime) {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Handle overnight schedules (e.g., 22:00 - 06:00)
        if (endMinutes < startMinutes) {
          if (currentTimeMinutes < startMinutes && currentTimeMinutes >= endMinutes) {
            return false;
          }
        } else {
          if (currentTimeMinutes < startMinutes || currentTimeMinutes >= endMinutes) {
            return false;
          }
        }
      }

      return true;
    });

    res.json({
      activeItems: activeItems.map(item => ({
        id: item.id,
        content: item.content,
        duration: item.duration,
        transition: item.transition,
        order: item.order,
        schedule: item.schedule
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Preset schedules (quick templates)
router.get('/presets/list', authMiddleware, async (req, res) => {
  const presets = [
    {
      id: 'morning',
      name: 'Morning Hours',
      description: 'Weekdays 6 AM - 11 AM',
      type: 'TIME_RANGE',
      startTime: '06:00',
      endTime: '11:00',
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    {
      id: 'lunch',
      name: 'Lunch Rush',
      description: 'Every day 11 AM - 2 PM',
      type: 'TIME_RANGE',
      startTime: '11:00',
      endTime: '14:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'happy-hour',
      name: 'Happy Hour',
      description: 'Weekdays 4 PM - 7 PM',
      type: 'TIME_RANGE',
      startTime: '16:00',
      endTime: '19:00',
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    {
      id: 'dinner',
      name: 'Dinner Service',
      description: 'Every day 5 PM - 10 PM',
      type: 'TIME_RANGE',
      startTime: '17:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'weekend',
      name: 'Weekends Only',
      description: 'All day Saturday & Sunday',
      type: 'DAY_OF_WEEK',
      daysOfWeek: [0, 6]
    },
    {
      id: 'weekday',
      name: 'Weekdays Only',
      description: 'Monday through Friday',
      type: 'DAY_OF_WEEK',
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    {
      id: 'business-hours',
      name: 'Business Hours',
      description: 'Weekdays 9 AM - 5 PM',
      type: 'TIME_RANGE',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    {
      id: 'late-night',
      name: 'Late Night',
      description: 'Every day 10 PM - 2 AM',
      type: 'TIME_RANGE',
      startTime: '22:00',
      endTime: '02:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    }
  ];

  res.json({ presets });
});

export default router;
