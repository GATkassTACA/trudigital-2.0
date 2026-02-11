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
  const systemPrompt = `You are a senior creative director at a top digital out-of-home (DOOH) advertising agency with 20 years of experience writing copy for LED billboards, retail displays, QSR menu boards, and lobby screens.

You understand the fundamental truth of signage: people glance for 3-8 seconds. Every word must justify its existence. You write copy that stops foot traffic and drives action.

YOUR COPY PRINCIPLES:
1. SPECIFICITY SELLS — "Smoked 14 Hours Over Hickory" beats "Quality BBQ". Use real details from the business description. Numbers, ingredients, years in business, neighborhood names — concrete beats abstract every time.
2. ONE IDEA PER SLIDE — Each slide has exactly one job. Don't cram. A promo slide promotes. An atmosphere slide sets mood. Never both.
3. HEADLINE = HOOK — 2-6 words max. Must work at a glance from 15 feet away. Use active voice, strong verbs, unexpected phrasing. NEVER use: "Welcome", "Our Services", "Experience Excellence", "Quality You Can Trust", or any corporate filler.
4. SUBHEADLINE = PAYOFF — 6-12 words. Adds the detail that makes the headline land. Answers "why should I care?" Be specific to THIS business.
5. NARRATIVE ARC — The slides form a sequence. Open with intrigue or appetite appeal, build through differentiators, close with a clear CTA. Think of it as a 30-second story told in ${'{slideCount}'} frames.
6. MATCH THE VOICE — A tattoo parlor and a law firm don't sound the same. Extract the brand's personality from the description and write in THEIR voice, not generic marketing-speak.
7. CTA = SPECIFIC ACTION — "Order at the Counter" beats "Visit Us Today". "Book Your Free Consult" beats "Get Started". Tell them exactly what to do.

IMAGE PROMPT RULES:
- Describe a BACKGROUND image only. Absolutely NO text, words, letters, numbers, signage, or typography in the image.
- Be cinematically specific: lighting direction, depth of field, color temperature, material textures, camera angle
- Each image should evoke a distinct emotion that matches its slide's purpose
- Use the business details to ground images in reality — if they mention exposed brick, put exposed brick in the prompt
- Prompts must be optimized for Stability AI SDXL: 20-40 words, descriptive, no abstract concepts

TECHNICAL:
- textColor: #FFFFFF for dark/moody images, #000000 or dark hex for bright/light images
- Transitions: vary between fade, slide-left, slide-right, zoom — use zoom sparingly for emphasis
- purpose values: hook, differentiator, product, atmosphere, social-proof, promo, cta`;

  const brandContext = brandKit.brandName
    ? `\nBRAND: ${brandKit.brandName}${brandKit.tagline ? ` - "${brandKit.tagline}"` : ''}`
    : '';
  const colorContext = brandKit.brandColors.length > 0
    ? `\nBRAND COLORS: ${brandKit.brandColors.join(', ')}`
    : '';

  const userMessage = `Plan a ${slideCount}-slide digital signage playlist for this specific business. Mine the description for real details — names, products, atmosphere, differentiators. Generic copy is failure.

BUSINESS DESCRIPTION: ${description}
${industry ? `INDUSTRY: ${industry}` : ''}
${vibe ? `DESIRED VIBE: ${vibe}` : ''}${brandContext}${colorContext}

CRITICAL: Do NOT use filler headlines like "Welcome", "Our Services", "Experience the Difference", "Quality You Trust". Every headline must be specific to THIS business. If they make pizza, the headline should smell like pizza. If they're a law firm, it should feel like authority.

Respond with ONLY a JSON object:
{
  "slides": [
    {
      "purpose": "hook",
      "headline": "Fired at 900 Degrees",
      "subheadline": "Neapolitan pizza the way Naples intended — since 2012",
      "imagePrompt": "Close-up wood-fired pizza oven with flames licking the dome, warm orange glow, shallow depth of field, rustic brick interior, smoke wisps, cinematic food photography",
      "style": "photographic",
      "mood": "appetizing",
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
  const ind = industry?.toLowerCase() || 'business';
  const base: SlidePlan[] = [
    {
      purpose: 'hook',
      headline: 'Made Different Here',
      subheadline: `The ${ind} experience your neighborhood has been waiting for`,
      imagePrompt: `Dramatic interior of a modern ${ind} space, warm golden hour lighting through large windows, shallow depth of field, cinematic composition, inviting atmosphere`,
      style: 'photographic',
      mood: 'intriguing',
      textColor: '#FFFFFF',
      transition: 'fade',
    },
    {
      purpose: 'differentiator',
      headline: 'Craft Meets Precision',
      subheadline: `Every detail designed with intention — that\'s the difference`,
      imagePrompt: `Extreme close-up of hands working on a craft, beautiful shallow depth of field, warm side lighting, professional ${ind} context, textured materials`,
      style: 'cinematic',
      mood: 'authentic',
      textColor: '#FFFFFF',
      transition: 'slide-left',
    },
    {
      purpose: 'promo',
      headline: 'This Week Only',
      subheadline: 'Ask about our featured special before it\'s gone',
      imagePrompt: `Bold vibrant ${ind} product showcase, dramatic top-down lighting, rich saturated colors, clean dark background, commercial photography style`,
      style: 'photographic',
      mood: 'urgent',
      textColor: '#FFFFFF',
      transition: 'zoom',
    },
    {
      purpose: 'atmosphere',
      headline: 'Stay A While',
      subheadline: 'Great spaces make great moments — pull up a seat',
      imagePrompt: `Wide angle cozy ${ind} interior at dusk, warm ambient lighting, bokeh string lights, people-shaped shadows suggesting life, inviting seating area`,
      style: 'cinematic',
      mood: 'warm',
      textColor: '#FFFFFF',
      transition: 'fade',
    },
    {
      purpose: 'cta',
      headline: 'Walk In Anytime',
      subheadline: 'No appointment needed — we\'re ready when you are',
      imagePrompt: `Welcoming storefront entrance at golden hour, warm light spilling from doorway, clean modern exterior, inviting pathway, ${ind} signage context`,
      style: 'photographic',
      mood: 'welcoming',
      textColor: '#FFFFFF',
      transition: 'slide-right',
    },
  ];

  return base.slice(0, count);
}

export default router;
