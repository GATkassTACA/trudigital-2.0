import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { ImageGenerator, SIGNAGE_PRESETS, SignagePreset } from '../services/ai';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const generator = ImageGenerator.withStability(process.env.STABILITY_API_KEY || '');

// Validation schema
const TemplateAISchema = z.object({
  businessDescription: z.string().min(10).max(1000),
  industry: z.string().optional(),
  vibe: z.string().optional(),
  slideCount: z.number().min(3).max(8).optional(),
  preset: z.enum(Object.keys(SIGNAGE_PRESETS) as [SignagePreset, ...SignagePreset[]]).optional(),
  playlistName: z.string().optional(),
});

interface SlidePlan {
  purpose: string;
  headline: string;
  subheadline: string;
  imagePrompt: string;
  style: string;
  mood: string;
  textColor: string;
  transition: string;
}

interface GeneratedSlide extends SlidePlan {
  backgroundUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

/**
 * Template AI — Describe your business, get a playlist
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    const input = TemplateAISchema.parse(req.body);
    const slideCount = input.slideCount || 5;

    console.log('Template AI request:', {
      descLength: input.businessDescription.length,
      industry: input.industry,
      vibe: input.vibe,
      slideCount,
    });

    // Step 1: Fetch org brand kit
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    const brandKit = {
      brandColors: org?.brandColors || [],
      brandFonts: org?.brandFonts || [],
      brandName: org?.brandName || null,
      tagline: org?.tagline || null,
      logoUrl: org?.logoUrl || null,
    };

    // Step 2: Claude plans the slides
    console.log('Planning slides with Claude...');
    const slidePlans = await planPlaylistSlides(
      input.businessDescription,
      slideCount,
      brandKit,
      input.industry,
      input.vibe
    );

    // Step 3: Parallel image generation for each slide
    const presetKey = (input.preset || 'landscape-standard') as SignagePreset;
    const size = SIGNAGE_PRESETS[presetKey].size;

    console.log(`Generating ${slidePlans.length} backgrounds in parallel...`);

    const slides: GeneratedSlide[] = slidePlans.map((plan) => ({
      ...plan,
      status: 'pending' as const,
    }));

    const generationPromises = slides.map(async (slide, index) => {
      try {
        slide.status = 'generating';

        const colorHints = brandKit.brandColors.length > 0
          ? `. Color scheme incorporating: ${brandKit.brandColors.join(', ')}`
          : '';

        const result = await generator.generate({
          prompt: slide.imagePrompt + colorHints,
          negativePrompt: 'blurry, low quality, distorted, watermark, text, words, letters, typography, font, writing, numbers, digits',
          size: size as any,
          style: (slide.style || 'photographic') as any,
          samples: 1,
          brandColors: brandKit.brandColors as string[],
        });

        if (!result.success || !result.images[0]) {
          slide.status = 'failed';
          slide.error = result.error || 'Generation failed';
          return slide;
        }

        slide.backgroundUrl = result.images[0].url;
        slide.status = 'completed';
        console.log(`Slide ${index + 1} generated`);
      } catch (error: any) {
        slide.status = 'failed';
        slide.error = error.message;
        console.error(`Slide ${index + 1} failed:`, error.message);
      }
      return slide;
    });

    const completedSlides = await Promise.all(generationPromises);

    // Save generation record
    const generation = await prisma.generation.create({
      data: {
        prompt: `Template AI: ${input.businessDescription.substring(0, 100)}`,
        status: 'COMPLETED',
        organizationId: user.organizationId,
        userId: user.id,
        provider: 'stability-templateai',
        metadata: JSON.stringify({
          type: 'templateai',
          industry: input.industry,
          vibe: input.vibe,
          slideCount: completedSlides.length,
          successCount: completedSlides.filter((s) => s.status === 'completed').length,
        }),
      },
    });

    const playlistName =
      input.playlistName ||
      `${brandKit.brandName || input.industry || 'My'} Playlist`;

    res.json({
      success: true,
      generationId: generation.id,
      playlistName,
      brandKit,
      slides: completedSlides,
      summary: {
        total: completedSlides.length,
        completed: completedSlides.filter((s) => s.status === 'completed').length,
        failed: completedSlides.filter((s) => s.status === 'failed').length,
      },
    });
  } catch (error: any) {
    console.error('Template AI error:', error);
    res.status(500).json({
      error: error.message || 'Template AI generation failed',
    });
  }
});

/**
 * Plan playlist slides using Claude
 */
async function planPlaylistSlides(
  description: string,
  slideCount: number,
  brandKit: {
    brandColors: any[];
    brandFonts: any[];
    brandName: string | null;
    tagline: string | null;
  },
  industry?: string,
  vibe?: string
): Promise<SlidePlan[]> {
  const systemPrompt = `You are an expert signage content strategist. Given a business description, you plan a multi-slide digital signage playlist.

Each slide serves a specific purpose in a cohesive content rotation. The slides should tell a story that draws viewers in and drives action.

Rules:
- Headlines: 3-7 words, punchy, no generic filler
- Subheadlines: 5-15 words, supporting detail
- Image prompts: Describe a BACKGROUND image only. NO text, words, letters, or typography in the image.
- Image prompts should be detailed, cinematic, and optimized for Stability AI SDXL
- textColor must contrast well with the expected image (usually #FFFFFF or #000000)
- Transitions should vary: fade, slide-left, slide-right, zoom
- Each slide should have a distinct purpose: welcome, services, promo, testimonial, cta, info, atmosphere`;

  const brandContext = brandKit.brandName
    ? `\nBRAND: ${brandKit.brandName}${brandKit.tagline ? ` - "${brandKit.tagline}"` : ''}`
    : '';
  const colorContext = brandKit.brandColors.length > 0
    ? `\nBRAND COLORS: ${brandKit.brandColors.join(', ')}`
    : '';

  const userMessage = `Plan a ${slideCount}-slide digital signage playlist.

BUSINESS: ${description}
${industry ? `INDUSTRY: ${industry}` : ''}
${vibe ? `VIBE/MOOD: ${vibe}` : ''}${brandContext}${colorContext}

Respond with ONLY a JSON object in this exact format:
{
  "slides": [
    {
      "purpose": "welcome",
      "headline": "Short Punchy Headline",
      "subheadline": "Supporting text with more detail here",
      "imagePrompt": "Detailed background image description for AI generation, no text",
      "style": "photographic",
      "mood": "warm",
      "textColor": "#FFFFFF",
      "transition": "fade"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.slides.slice(0, slideCount);
  } catch (error: any) {
    console.error('Slide planning failed, using fallback:', error.message);
    return getFallbackSlides(slideCount, industry);
  }
}

/**
 * Fallback slides if Claude fails
 */
function getFallbackSlides(count: number, industry?: string): SlidePlan[] {
  const base: SlidePlan[] = [
    {
      purpose: 'welcome',
      headline: 'Welcome',
      subheadline: 'We\'re glad you\'re here',
      imagePrompt: `Professional welcoming ${industry || 'business'} interior, warm lighting, modern design, clean and inviting atmosphere`,
      style: 'photographic',
      mood: 'warm',
      textColor: '#FFFFFF',
      transition: 'fade',
    },
    {
      purpose: 'services',
      headline: 'Our Services',
      subheadline: 'Quality you can count on',
      imagePrompt: `Abstract professional background with soft gradients, ${industry || 'business'} themed, modern corporate aesthetic`,
      style: 'digital-art',
      mood: 'professional',
      textColor: '#FFFFFF',
      transition: 'slide-left',
    },
    {
      purpose: 'promo',
      headline: 'Special Offer',
      subheadline: 'Limited time — don\'t miss out',
      imagePrompt: `Eye-catching promotional background, bold dynamic composition, ${industry || 'retail'} marketing style, energetic and vibrant`,
      style: 'digital-art',
      mood: 'energetic',
      textColor: '#FFFFFF',
      transition: 'zoom',
    },
    {
      purpose: 'atmosphere',
      headline: 'Experience Excellence',
      subheadline: 'Crafted with care, delivered with pride',
      imagePrompt: `Beautiful cinematic ${industry || 'lifestyle'} scene, premium quality feel, soft bokeh background, elegant composition`,
      style: 'cinematic',
      mood: 'premium',
      textColor: '#FFFFFF',
      transition: 'fade',
    },
    {
      purpose: 'cta',
      headline: 'Visit Us Today',
      subheadline: 'Your journey starts here',
      imagePrompt: `Inspiring landscape or cityscape at golden hour, warm inviting tones, open road or pathway, ${industry || 'business'} context`,
      style: 'photographic',
      mood: 'inspiring',
      textColor: '#FFFFFF',
      transition: 'slide-right',
    },
  ];

  return base.slice(0, count);
}

export default router;
