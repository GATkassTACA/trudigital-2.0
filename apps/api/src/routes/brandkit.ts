import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schema for brand kit
const BrandKitSchema = z.object({
  brandColors: z.array(z.string()).optional(),
  logoUrl: z.string().optional().nullable(),
  logoLightUrl: z.string().optional().nullable(),
  brandFonts: z.array(z.string()).optional(),
  brandName: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
});

// Get brand kit for organization
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        brandColors: true,
        logoUrl: true,
        logoLightUrl: true,
        brandFonts: true,
        brandName: true,
        tagline: true,
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      brandKit: {
        organizationId: org.id,
        organizationName: org.name,
        brandColors: org.brandColors || [],
        logoUrl: org.logoUrl,
        logoLightUrl: org.logoLightUrl,
        brandFonts: org.brandFonts || ['Arial', 'Georgia'],
        brandName: org.brandName || org.name,
        tagline: org.tagline,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update brand kit
router.patch('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const input = BrandKitSchema.parse(req.body);

    const updateData: any = {};
    if (input.brandColors !== undefined) updateData.brandColors = input.brandColors;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.logoLightUrl !== undefined) updateData.logoLightUrl = input.logoLightUrl;
    if (input.brandFonts !== undefined) updateData.brandFonts = input.brandFonts;
    if (input.brandName !== undefined) updateData.brandName = input.brandName;
    if (input.tagline !== undefined) updateData.tagline = input.tagline;

    const org = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
      select: {
        id: true,
        name: true,
        brandColors: true,
        logoUrl: true,
        logoLightUrl: true,
        brandFonts: true,
        brandName: true,
        tagline: true,
      }
    });

    res.json({
      success: true,
      brandKit: {
        organizationId: org.id,
        organizationName: org.name,
        brandColors: org.brandColors || [],
        logoUrl: org.logoUrl,
        logoLightUrl: org.logoLightUrl,
        brandFonts: org.brandFonts || ['Arial', 'Georgia'],
        brandName: org.brandName || org.name,
        tagline: org.tagline,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Upload logo (accepts base64 data URL)
router.post('/logo', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { dataUrl, type = 'primary' } = req.body; // type: 'primary' or 'light'

    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // For now, store as data URL directly (in production, upload to blob storage)
    const field = type === 'light' ? 'logoLightUrl' : 'logoUrl';

    const org = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { [field]: dataUrl },
      select: {
        logoUrl: true,
        logoLightUrl: true,
      }
    });

    res.json({
      success: true,
      logoUrl: org.logoUrl,
      logoLightUrl: org.logoLightUrl,
    });
  } catch (error) {
    next(error);
  }
});

// Delete logo
router.delete('/logo/:type', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { type } = req.params; // 'primary' or 'light'

    const field = type === 'light' ? 'logoLightUrl' : 'logoUrl';

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { [field]: null },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Extract colors from uploaded image (for auto-detection)
router.post('/extract-colors', authMiddleware, async (req, res, next) => {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Import color extractor
    const { extractColorsFromImage } = await import('../services/colorExtractor');
    const palette = await extractColorsFromImage(dataUrl);

    res.json({
      success: true,
      palette,
      suggestedColors: [palette.primary, palette.secondary, palette.accent].filter(Boolean)
    });
  } catch (error: any) {
    console.error('Color extraction error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract colors' });
  }
});

export default router;
