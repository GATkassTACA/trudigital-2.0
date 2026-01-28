import { Router } from 'express';
import { z } from 'zod';
import { ImageGenerator, SIGNAGE_PRESETS, VIDEO_PRESETS, SignagePreset } from '../services/ai';
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
  enhance: z.boolean().optional(), // Enable AI prompt enhancement
  quality: z.enum(['standard', 'ultra']).optional() // Quality tier: standard (SDXL) or ultra (SD3.5 Large)
});

// Video generation schema
const VideoGenerateSchema = z.object({
  image: z.string().min(1), // Base64 image or data URL
  seed: z.number().optional(),
  cfgScale: z.number().min(0).max(10).optional(),
  motionBucketId: z.number().min(1).max(255).optional(),
  saveToLibrary: z.boolean().optional()
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
      const presetKey = (input.preset || 'landscape-standard') as SignagePreset;
      enhancement = await enhancePrompt({
        userPrompt: input.prompt,
        signageType: input.preset,
        brandColors: org?.brandColors || [],
        brandName: org?.name,
        targetSize: input.size || SIGNAGE_PRESETS[presetKey].size,
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
      brandName: org?.name,
      quality: input.quality || 'standard'
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
      size: value.size,
      style: value.style
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

// Get video presets (must be before parameterized route)
router.get('/video/presets', (req, res) => {
  res.json({
    presets: Object.entries(VIDEO_PRESETS).map(([key, value]) => ({
      id: key,
      size: value.size,
      description: key.replace('video-', '').replace('-', ' ')
    })),
    info: {
      maxDuration: 4,
      supportedSizes: ['1024x576 (landscape)', '576x1024 (portrait)', '768x768 (square)'],
      note: 'Video generation takes 2-3 minutes. Use an image with one of the supported sizes for best results.'
    }
  });
});

// Generate video from image (Stable Video Diffusion)
router.post('/video', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const input = VideoGenerateSchema.parse(req.body);

    // Start video generation (async)
    const result = await generator.generateVideo({
      image: input.image,
      seed: input.seed,
      cfgScale: input.cfgScale,
      motionBucketId: input.motionBucketId
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Video generation failed'
      });
    }

    // Store the generation ID for polling
    const generation = await prisma.generation.create({
      data: {
        prompt: 'video-generation',
        status: 'PROCESSING',
        organizationId: user.organizationId,
        userId: user.id,
        provider: 'stability-video',
        metadata: JSON.stringify({
          type: 'video',
          generationId: result.generationId,
          seed: input.seed,
          cfgScale: input.cfgScale,
          motionBucketId: input.motionBucketId
        })
      }
    });

    res.json({
      success: true,
      generationId: result.generationId,
      internalId: generation.id,
      status: 'processing',
      message: 'Video generation started. Poll /generate/video/:generationId for result.'
    });
  } catch (error: any) {
    console.error('Video generate error:', error);
    res.status(500).json({
      error: error.message || 'Video generation failed'
    });
  }
});

// Poll for video generation result
router.get('/video/:generationId', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { generationId } = req.params;
    const { saveToLibrary } = req.query;

    const result = await generator.getVideoResult(generationId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to get video result',
        status: result.status
      });
    }

    // Still processing
    if (result.status === 'processing') {
      return res.json({
        success: true,
        status: 'processing',
        message: 'Video is still being generated. Please poll again.'
      });
    }

    // Completed - optionally save to library
    let content = null;
    if (saveToLibrary === 'true' && result.video) {
      content = await prisma.content.create({
        data: {
          name: `Generated Video ${new Date().toISOString()}`,
          type: 'VIDEO',
          url: result.video.url,
          thumbnailUrl: '', // Could extract first frame
          isGenerated: true,
          duration: result.video.duration,
          organizationId: user.organizationId,
          userId: user.id
        }
      });
    }

    // Update generation record
    await prisma.generation.updateMany({
      where: {
        organizationId: user.organizationId,
        metadata: { contains: generationId }
      },
      data: {
        status: 'COMPLETED',
        creditsUsed: result.creditsUsed,
        imageUrl: result.video?.url
      }
    });

    res.json({
      success: true,
      status: 'completed',
      video: result.video,
      creditsUsed: result.creditsUsed,
      content
    });
  } catch (error: any) {
    console.error('Video result error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get video result'
    });
  }
});

export default router;
