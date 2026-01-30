import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { ImageGenerator, SIGNAGE_PRESETS, SignagePreset } from '../services/ai';
import { extractColorsFromImage, generateDesignVariations, BrandPalette } from '../services/colorExtractor';
import { compositeDesign } from '../services/imageCompositor';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// Initialize AI generator
const generator = ImageGenerator.withStability(process.env.STABILITY_API_KEY || '');

// Validation schema
const AutoDesignSchema = z.object({
  logo: z.string().min(1), // Base64 image data URL
  text: z.string().min(1).max(200), // Text to include in design
  businessType: z.string().optional(), // e.g., "restaurant", "retail", "corporate"
  preset: z.enum(Object.keys(SIGNAGE_PRESETS) as [SignagePreset, ...SignagePreset[]]).optional(),
  style: z.string().optional(), // User style preference
});

interface DesignVariation {
  id: string;
  prompt: string;
  style: string;
  mood: string;
  image?: {
    url: string;
    base64?: string;
    rawBackground?: string; // Original background without logo/text overlay
  };
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

/**
 * AI Auto-Design Endpoint
 * Upload logo + text → Get 6 complete design variations
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    const input = AutoDesignSchema.parse(req.body);

    console.log('Auto-Design request:', {
      hasLogo: !!input.logo,
      textLength: input.text.length,
      businessType: input.businessType,
      preset: input.preset
    });

    // Step 1: Extract brand colors from logo
    console.log('Extracting brand colors from logo...');
    let palette: BrandPalette;
    try {
      palette = await extractColorsFromImage(input.logo);
      console.log('Extracted palette:', {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        colorCount: palette.colors.length
      });
    } catch (error) {
      console.error('Color extraction failed, using defaults:', error);
      palette = {
        primary: '#6366F1',
        secondary: '#EC4899',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#000000',
        colors: []
      };
    }

    // Step 2: Use AI to generate optimized prompts for each variation
    console.log('Generating design variations with AI...');
    const designPrompts = await generateAIDesignPrompts(input.text, palette, input.businessType);

    // Step 3: Generate all 6 images in parallel
    const presetKey = (input.preset || 'landscape-standard') as SignagePreset;
    const size = SIGNAGE_PRESETS[presetKey].size;

    const variations: DesignVariation[] = designPrompts.map((design, index) => ({
      id: `variation-${index + 1}`,
      prompt: design.prompt,
      style: design.style,
      mood: design.mood,
      status: 'pending' as const
    }));

    // Return immediately with the design plans
    // Then generate images (could be done async with webhooks in production)
    console.log('Starting parallel image generation...');

    // Different layout combinations for variety
    const layouts = [
      { textPosition: 'center' as const, logoPosition: 'top-left' as const },
      { textPosition: 'bottom' as const, logoPosition: 'top-right' as const },
      { textPosition: 'top' as const, logoPosition: 'bottom-left' as const },
      { textPosition: 'center' as const, logoPosition: 'center-top' as const },
      { textPosition: 'bottom' as const, logoPosition: 'top-left' as const },
      { textPosition: 'center' as const, logoPosition: 'bottom-right' as const },
    ];

    const generationPromises = variations.map(async (variation, index) => {
      try {
        variation.status = 'generating';

        // Step 1: Generate the background
        const result = await generator.generate({
          prompt: variation.prompt,
          negativePrompt: 'blurry, low quality, distorted, amateur, watermark, ugly, deformed, text, words, letters, typography, font',
          size: size as any,
          style: (variation.style || 'photographic') as any,
          samples: 1,
          brandColors: [palette.primary, palette.secondary],
        });

        if (!result.success || !result.images[0]) {
          variation.status = 'failed';
          variation.error = result.error || 'Background generation failed';
          return variation;
        }

        // Step 2: Composite logo and text onto the background
        console.log(`Compositing design ${index + 1}...`);
        const layout = layouts[index % layouts.length];

        const compositeResult = await compositeDesign({
          background: result.images[0].url, // This is already base64 data URL
          logo: input.logo,
          text: input.text,
          textPosition: layout.textPosition,
          logoPosition: layout.logoPosition,
          logoScale: 0.12 + (index % 3) * 0.02,
          textColor: '#FFFFFF',
          mood: variation.mood
        });

        if (compositeResult.success && compositeResult.image) {
          variation.image = {
            url: compositeResult.image,
            base64: compositeResult.image.replace(/^data:image\/\w+;base64,/, ''),
            // Store raw background for editor use (separate layers)
            rawBackground: result.images[0].url
          };
          variation.status = 'completed';
          console.log(`Design ${index + 1} completed with logo and text`);
        } else {
          // Fallback to just the background if compositing fails
          console.warn(`Compositing failed for design ${index + 1}, using background only:`, compositeResult.error);
          variation.image = {
            url: result.images[0].url,
            base64: result.images[0].base64,
            rawBackground: result.images[0].url
          };
          variation.status = 'completed';
        }
      } catch (error: any) {
        variation.status = 'failed';
        variation.error = error.message;
        console.error(`Design ${index + 1} failed:`, error.message);
      }

      return variation;
    });

    const completedVariations = await Promise.all(generationPromises);

    // Save generation record
    const generation = await prisma.generation.create({
      data: {
        prompt: `Auto-Design: ${input.text}`,
        status: 'COMPLETED',
        organizationId: user.organizationId,
        userId: user.id,
        provider: 'stability-autodesign',
        metadata: JSON.stringify({
          type: 'autodesign',
          text: input.text,
          palette,
          variationCount: completedVariations.length,
          successCount: completedVariations.filter(v => v.status === 'completed').length
        })
      }
    });

    res.json({
      success: true,
      generationId: generation.id,
      palette,
      variations: completedVariations,
      text: input.text,
      summary: {
        total: completedVariations.length,
        completed: completedVariations.filter(v => v.status === 'completed').length,
        failed: completedVariations.filter(v => v.status === 'failed').length
      }
    });

  } catch (error: any) {
    console.error('Auto-Design error:', error);
    res.status(500).json({
      error: error.message || 'Auto-design failed',
      details: error.response?.data || error.stack
    });
  }
});

/**
 * Generate AI-optimized design prompts using Claude
 */
async function generateAIDesignPrompts(
  text: string,
  palette: BrandPalette,
  businessType?: string
): Promise<Array<{ prompt: string; style: string; mood: string }>> {

  const systemPrompt = `You are an expert graphic designer specializing in digital signage and promotional displays. Given brand colors and a message, create 6 unique design concepts that would work perfectly for AI image generation.

Each design should be distinct in mood and style while staying cohesive with the brand colors. Focus on creating backgrounds and visual compositions that leave space for text overlays.

Important rules:
- DO NOT include actual text in the image descriptions - the text will be added in an editor
- Focus on visual elements, textures, backgrounds, and composition
- Always include the brand colors naturally in the design
- Consider different moods: professional, energetic, elegant, modern, warm, premium
- Each prompt should be optimized for Stability AI's SDXL model`;

  const userMessage = `Create 6 unique design prompts for digital signage.

BRAND COLORS:
- Primary: ${palette.primary}
- Secondary: ${palette.secondary}
- Accent: ${palette.accent}

MESSAGE/TEXT TO DISPLAY: "${text}"
${businessType ? `BUSINESS TYPE: ${businessType}` : ''}

For each design, provide:
1. A detailed prompt for AI image generation (no text in the image)
2. The recommended style preset (photographic, digital-art, cinematic, 3d-model, or neon-punk)
3. The mood/feeling (professional, energetic, elegant, modern, warm, premium)

Respond in this exact JSON format:
{
  "designs": [
    {
      "prompt": "detailed image generation prompt here",
      "style": "photographic",
      "mood": "professional"
    },
    ... (6 total designs)
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.designs;

  } catch (error: any) {
    console.error('AI prompt generation failed, using fallback:', error.message);

    // Fallback to basic variations
    return generateDesignVariations(palette, text).map((prompt, i) => ({
      prompt,
      style: ['photographic', 'digital-art', 'cinematic', '3d-model', 'neon-punk', 'photographic'][i],
      mood: ['professional', 'energetic', 'elegant', 'modern', 'warm', 'premium'][i]
    }));
  }
}

/**
 * Get a specific design variation by ID
 */
router.get('/:generationId', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    const { generationId } = req.params;

    const generation = await prisma.generation.findFirst({
      where: {
        id: generationId,
        organizationId: user.organizationId
      }
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json({ generation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});

export default router;
