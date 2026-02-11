import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { StabilityEdit } from '../services/ai/stabilityEdit';
import { generateCopy, suggestTextPlacement, generateSignageDesign, critiqueDesign, adaptLayout } from '../services/ai/copywriter';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Initialize edit service
const editor = new StabilityEdit(process.env.STABILITY_API_KEY || '');

// Validation schemas
const ImageSchema = z.object({
  image: z.string().min(1) // Base64 image
});

const EraseSchema = z.object({
  image: z.string().min(1),
  mask: z.string().min(1)  // White = erase, Black = keep
});

const InpaintSchema = z.object({
  image: z.string().min(1),
  mask: z.string().min(1),
  prompt: z.string().min(1)
});

const SearchReplaceSchema = z.object({
  image: z.string().min(1),
  searchPrompt: z.string().min(1),
  replacePrompt: z.string().min(1)
});

const OutpaintSchema = z.object({
  image: z.string().min(1),
  direction: z.enum(['left', 'right', 'up', 'down']),
  pixels: z.number().min(64).max(2048).optional(),
  prompt: z.string().optional()
});

const ResizeSchema = z.object({
  image: z.string().min(1),
  currentWidth: z.number(),
  currentHeight: z.number(),
  targetWidth: z.number(),
  targetHeight: z.number(),
  prompt: z.string().optional()
});

const UpscaleSchema = z.object({
  image: z.string().min(1),
  mode: z.enum(['fast', 'conservative']).optional(),
  prompt: z.string().optional()
});

const CopywriterSchema = z.object({
  context: z.string().min(1),
  tone: z.string().optional(),
  type: z.enum(['headline', 'subheadline', 'body', 'cta', 'all']).optional(),
  maxLength: z.number().optional(),
  brandName: z.string().optional(),
  keywords: z.array(z.string()).optional()
});

const TextPlacementSchema = z.object({
  image: z.string().min(1),
  canvasWidth: z.number(),
  canvasHeight: z.number()
});

const SignageDesignSchema = z.object({
  image: z.string().min(1),
  context: z.string().min(1),
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  tone: z.string().optional(),
  brandName: z.string().optional()
});

// ============================================
// IMAGE EDITING ENDPOINTS
// ============================================

/**
 * Remove background from image
 * Returns PNG with transparent background
 */
router.post('/remove-background', authMiddleware, async (req, res) => {
  try {
    const { image } = ImageSchema.parse(req.body);
    const result = await editor.removeBackground(image);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Remove background error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Erase objects from image using mask
 * AI fills in the erased area naturally
 */
router.post('/erase', authMiddleware, async (req, res) => {
  try {
    const { image, mask } = EraseSchema.parse(req.body);
    const result = await editor.erase(image, mask);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Erase error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Inpaint - fill masked area with prompt-guided content
 */
router.post('/inpaint', authMiddleware, async (req, res) => {
  try {
    const { image, mask, prompt } = InpaintSchema.parse(req.body);
    const result = await editor.inpaint(image, mask, prompt);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Inpaint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search and replace objects in image
 * Find objects matching search prompt, replace with new content
 */
router.post('/search-replace', authMiddleware, async (req, res) => {
  try {
    const { image, searchPrompt, replacePrompt } = SearchReplaceSchema.parse(req.body);
    const result = await editor.searchAndReplace(image, searchPrompt, replacePrompt);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Search/replace error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Replace background with AI-generated one
 */
router.post('/replace-background', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      image: z.string().min(1),
      backgroundPrompt: z.string().min(1)
    });
    const { image, backgroundPrompt } = schema.parse(req.body);
    const result = await editor.replaceBackground(image, backgroundPrompt);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Replace background error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Outpaint - extend image in a direction
 */
router.post('/outpaint', authMiddleware, async (req, res) => {
  try {
    const { image, direction, pixels = 512, prompt } = OutpaintSchema.parse(req.body);
    const result = await editor.outpaint(image, direction, pixels, prompt);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Outpaint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Smart resize - adapt image to new dimensions using outpainting
 */
router.post('/smart-resize', authMiddleware, async (req, res) => {
  try {
    const { image, currentWidth, currentHeight, targetWidth, targetHeight, prompt } =
      ResizeSchema.parse(req.body);

    const result = await editor.outpaintToSize(
      image,
      currentWidth,
      currentHeight,
      targetWidth,
      targetHeight,
      prompt
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Smart resize error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upscale image to higher resolution
 */
router.post('/upscale', authMiddleware, async (req, res) => {
  try {
    const { image, mode = 'fast', prompt } = UpscaleSchema.parse(req.body);
    const result = await editor.upscale(image, mode, prompt);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      image: result.image,
      creditsUsed: result.creditsUsed
    });
  } catch (error: any) {
    console.error('Upscale error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI COPYWRITING ENDPOINTS
// ============================================

/**
 * Generate copy for signage
 */
router.post('/copywriter', authMiddleware, async (req, res) => {
  try {
    const input = CopywriterSchema.parse(req.body);
    const result = await generateCopy(input);

    res.json({
      success: true,
      copy: result
    });
  } catch (error: any) {
    console.error('Copywriter error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze image and suggest text placement
 */
router.post('/suggest-placement', authMiddleware, async (req, res) => {
  try {
    const { image, canvasWidth, canvasHeight } = TextPlacementSchema.parse(req.body);
    const result = await suggestTextPlacement(image, canvasWidth, canvasHeight);

    res.json({
      success: true,
      suggestions: result
    });
  } catch (error: any) {
    console.error('Text placement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate complete signage design (copy + placement)
 */
router.post('/design-assist', authMiddleware, async (req, res) => {
  try {
    const { image, context, canvasWidth, canvasHeight, tone, brandName } =
      SignageDesignSchema.parse(req.body);

    const result = await generateSignageDesign(
      image,
      context,
      canvasWidth,
      canvasHeight,
      { tone, brandName }
    );

    res.json({
      success: true,
      design: result
    });
  } catch (error: any) {
    console.error('Design assist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI DESIGN CRITIC
// ============================================

const DesignCritiqueSchema = z.object({
  image: z.string().min(1),
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  viewingDistance: z.number().optional()
});

/**
 * AI Design Critic - analyzes design for readability, contrast, composition, brand compliance
 */
router.post('/design-critique', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    const { image, canvasWidth, canvasHeight, viewingDistance } = DesignCritiqueSchema.parse(req.body);

    // Get org brand settings for brand compliance check
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    const critique = await critiqueDesign(image, canvasWidth, canvasHeight, {
      viewingDistance,
      brandColors: org?.brandColors || [],
      brandFonts: org?.brandFonts || [],
      brandName: org?.brandName || undefined
    });

    res.json({
      success: true,
      critique
    });
  } catch (error: any) {
    console.error('Design critique error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RESPONSIVE LAYOUT ADAPTATION
// ============================================

const AdaptLayoutSchema = z.object({
  image: z.string().min(1),
  canvasJson: z.any().optional(),
  sourceWidth: z.number(),
  sourceHeight: z.number(),
  targetWidth: z.number(),
  targetHeight: z.number()
});

/**
 * Adapt design to new dimensions - outpaints background + repositions overlays with AI
 */
router.post('/adapt-layout', authMiddleware, async (req, res) => {
  try {
    const { image, canvasJson, sourceWidth, sourceHeight, targetWidth, targetHeight } =
      AdaptLayoutSchema.parse(req.body);

    // Step 1: Outpaint the background image to target dimensions
    const bgResult = await editor.outpaintToSize(
      image,
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight
    );

    if (!bgResult.success) {
      return res.status(400).json({ error: bgResult.error || 'Failed to adapt background' });
    }

    // Step 2: If canvas has overlays, use Claude to reposition them
    let adaptedLayout = undefined;
    if (canvasJson && canvasJson.objects && canvasJson.objects.length > 1) {
      adaptedLayout = await adaptLayout(
        image,
        canvasJson,
        sourceWidth,
        sourceHeight,
        targetWidth,
        targetHeight
      );
    }

    res.json({
      success: true,
      backgroundImage: bgResult.image?.url,
      adaptedLayout,
      creditsUsed: bgResult.creditsUsed
    });
  } catch (error: any) {
    console.error('Adapt layout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available editing capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    imageEditing: [
      {
        id: 'remove-background',
        name: 'Remove Background',
        description: 'Remove background from image, returns transparent PNG',
        cost: 3
      },
      {
        id: 'erase',
        name: 'AI Erase',
        description: 'Erase objects using a mask, AI fills naturally',
        cost: 3
      },
      {
        id: 'inpaint',
        name: 'AI Fill',
        description: 'Fill masked area with prompt-guided content',
        cost: 3
      },
      {
        id: 'search-replace',
        name: 'Search & Replace',
        description: 'Find and replace objects in image',
        cost: 4
      },
      {
        id: 'replace-background',
        name: 'Replace Background',
        description: 'Swap background with AI-generated one',
        cost: 4
      },
      {
        id: 'outpaint',
        name: 'Extend Image',
        description: 'Expand image beyond its borders',
        cost: 4
      },
      {
        id: 'smart-resize',
        name: 'Smart Resize',
        description: 'Adapt image to different aspect ratios',
        cost: '4-16 (depends on size change)'
      },
      {
        id: 'upscale',
        name: 'AI Upscale',
        description: 'Increase resolution up to 4x',
        cost: '4 (fast) / 25 (conservative)'
      }
    ],
    aiAssist: [
      {
        id: 'copywriter',
        name: 'AI Copywriter',
        description: 'Generate headlines, subheadlines, and CTAs',
        cost: 0
      },
      {
        id: 'suggest-placement',
        name: 'Smart Text Placement',
        description: 'AI suggests optimal text positions',
        cost: 0
      },
      {
        id: 'design-assist',
        name: 'Design Assistant',
        description: 'Complete copy + placement suggestions',
        cost: 0
      },
      {
        id: 'design-critique',
        name: 'AI Design Critic',
        description: 'Analyze readability, contrast, composition & brand compliance',
        cost: 0
      },
      {
        id: 'adapt-layout',
        name: 'Responsive Adaptation',
        description: 'AI-powered redesign for different aspect ratios',
        cost: '4-16 (outpaint) + 0 (layout AI)'
      }
    ]
  });
});

export default router;
