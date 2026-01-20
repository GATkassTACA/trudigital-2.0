import { Router } from 'express';
import { z } from 'zod';
import { ImageGenerator, SIGNAGE_PRESETS, SignagePreset } from '@trudigital/ai-service';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { enhancePrompt, analyzeIntent } from '../services/promptEnhancer';

const router = Router();
const prisma = new PrismaClient();

// Initialize AI generator
const generator = ImageGenerator.withStability(process.env.STABILITY_API_KEY || '');

// Validation schema
const GenerateSchema = z.object({
  prompt: z.string().min(1).max(1000),
  negativePrompt: z.string().optional(),
  preset: z.enum(Object.keys(SIGNAGE_PRESETS) as [SignagePreset, ...SignagePreset[]]).optional(),
  size: z.string().optional(),
  style: z.string().optional(),
  samples: z.number().min(1).max(4).optional(),
  saveToLibrary: z.boolean().optional(),
  enhance: z.boolean().optional() // Enable AI prompt enhancement
});

// Generate images
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const input = GenerateSchema.parse(req.body);

    // Get organization brand settings
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    // Enhance prompt with AI reasoning if requested
    let finalPrompt = input.prompt;
    let finalNegativePrompt = input.negativePrompt;
    let finalStyle = input.style;
    let enhancement = null;

    if (input.enhance) {
      console.log('Enhancing prompt with AI reasoning...');
      enhancement = await enhancePrompt({
        userPrompt: input.prompt,
        signageType: input.preset,
        brandColors: org?.brandColors || [],
        brandName: org?.name,
        targetSize: input.size || SIGNAGE_PRESETS[input.preset || 'landscape-standard'].size,
        style: input.style
      });

      finalPrompt = enhancement.enhancedPrompt;
      finalNegativePrompt = enhancement.negativePrompt;
      if (!input.style && enhancement.suggestedStyle) {
        finalStyle = enhancement.suggestedStyle;
      }

      console.log('Enhancement result:', {
        original: input.prompt,
        enhanced: finalPrompt,
        reasoning: enhancement.reasoning
      });
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        prompt: finalPrompt,
        negativePrompt: finalNegativePrompt,
        size: input.size || SIGNAGE_PRESETS[input.preset || 'landscape-standard'].size,
        style: finalStyle,
        preset: input.preset,
        status: 'PROCESSING',
        organizationId: user.organizationId,
        userId: user.id
      }
    });

    // Generate with AI
    const result = await generator.generate({
      prompt: finalPrompt,
      negativePrompt: finalNegativePrompt,
      preset: input.preset as SignagePreset,
      size: input.size as any,
      style: finalStyle as any,
      samples: input.samples,
      brandColors: org?.brandColors || [],
      brandName: org?.name
    });

    if (!result.success) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        error: result.error || 'Generation failed'
      });
    }

    // Update generation with result
    const image = result.images[0];
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: 'COMPLETED',
        imageUrl: image.url,
        seed: image.seed,
        creditsUsed: result.creditsUsed
      }
    });

    // Optionally save to content library
    let content = null;
    if (input.saveToLibrary && image) {
      content = await prisma.content.create({
        data: {
          name: input.prompt.slice(0, 50),
          type: 'IMAGE',
          url: image.url,
          thumbnailUrl: image.url,
          isGenerated: true,
          organizationId: user.organizationId,
          userId: user.id
        }
      });

      await prisma.generation.update({
        where: { id: generation.id },
        data: { contentId: content.id }
      });
    }

    res.json({
      success: true,
      generation: {
        id: generation.id,
        images: result.images,
        creditsUsed: result.creditsUsed,
        originalPrompt: input.prompt,
        enhancedPrompt: input.enhance ? finalPrompt : undefined,
        enhancement: enhancement ? {
          reasoning: enhancement.reasoning,
          suggestedStyle: enhancement.suggestedStyle,
          tags: enhancement.tags
        } : undefined
      },
      content
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: error.message || 'Generation failed',
      details: error.response?.data || error.stack
    });
  }
});

// Get generation history
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { limit = 20, offset = 0 } = req.query;

    const generations = await prisma.generation.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        user: { select: { id: true, name: true, email: true } },
        content: true
      }
    });

    res.json({ generations });
  } catch (error) {
    next(error);
  }
});

// Get presets
router.get('/presets', (req, res) => {
  res.json({
    presets: Object.entries(SIGNAGE_PRESETS).map(([key, value]) => ({
      id: key,
      ...value
    }))
  });
});

// Check balance
router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const balance = await generator.getBalance();
    res.json({ balance });
  } catch (error) {
    next(error);
  }
});

export default router;
