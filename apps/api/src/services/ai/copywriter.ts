import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export interface CopywriterInput {
  context: string;          // What the signage is for (e.g., "coffee shop sale", "gym membership")
  tone?: string;            // e.g., "professional", "playful", "urgent", "luxurious"
  type?: 'headline' | 'subheadline' | 'body' | 'cta' | 'all';
  maxLength?: number;       // Max characters for the text
  brandName?: string;
  keywords?: string[];
}

export interface CopywriterOutput {
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;             // Call to action
  alternatives?: {
    headlines?: string[];
    subheadlines?: string[];
    ctas?: string[];
  };
}

export interface TextPlacement {
  zone: 'top' | 'middle' | 'bottom' | 'left' | 'right' | 'center';
  x: number;                // Percentage from left (0-100)
  y: number;                // Percentage from top (0-100)
  maxWidth: number;         // Percentage of canvas width
  alignment: 'left' | 'center' | 'right';
  reasoning: string;
}

export interface TextPlacementSuggestion {
  placements: TextPlacement[];
  colorSuggestions: {
    textColor: string;
    backgroundColor?: string;
    reasoning: string;
  };
}

/**
 * AI Copywriter - generates signage text using Claude
 */
export async function generateCopy(input: CopywriterInput): Promise<CopywriterOutput> {
  const { context, tone = 'professional', type = 'all', maxLength, brandName, keywords } = input;

  const prompt = `You are an expert copywriter specializing in digital signage and advertising.

Generate compelling copy for the following signage:

Context: ${context}
Tone: ${tone}
${brandName ? `Brand: ${brandName}` : ''}
${keywords?.length ? `Keywords to include: ${keywords.join(', ')}` : ''}
${maxLength ? `Maximum length: ${maxLength} characters per element` : ''}

${type === 'all' ? `Generate ALL of the following:
1. Headline (short, attention-grabbing, 3-7 words)
2. Subheadline (supporting message, 5-12 words)
3. Body text (optional details, 1-2 sentences)
4. Call to action (what you want them to do, 2-4 words)

Also provide 2 alternative headlines and CTAs.` : `Generate a ${type} only.`}

Respond in JSON format:
{
  "headline": "...",
  "subheadline": "...",
  "body": "...",
  "cta": "...",
  "alternatives": {
    "headlines": ["...", "..."],
    "ctas": ["...", "..."]
  }
}

Keep text punchy and scannable - this is for signage that people see briefly.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Copywriter error:', error);
    // Return fallback
    return {
      headline: 'Your Message Here',
      subheadline: 'Add your supporting text',
      cta: 'Learn More'
    };
  }
}

/**
 * Analyze image and suggest optimal text placement zones
 * Uses Claude's vision capabilities
 */
export async function suggestTextPlacement(
  imageBase64: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<TextPlacementSuggestion> {
  const prompt = `Analyze this image for digital signage and suggest optimal text placement.

Canvas dimensions: ${canvasWidth}x${canvasHeight}px

Consider:
1. Areas with low visual complexity (good for text readability)
2. Rule of thirds for composition
3. Avoid placing text over faces, products, or key visual elements
4. Ensure sufficient contrast for readability

Respond in JSON format:
{
  "placements": [
    {
      "zone": "top|middle|bottom|left|right|center",
      "x": 0-100,  // percentage from left
      "y": 0-100,  // percentage from top
      "maxWidth": 0-100,  // percentage of canvas width for text container
      "alignment": "left|center|right",
      "reasoning": "why this spot works"
    }
  ],
  "colorSuggestions": {
    "textColor": "#FFFFFF or #000000 etc",
    "backgroundColor": "optional semi-transparent bg like rgba(0,0,0,0.5)",
    "reasoning": "why these colors work with the image"
  }
}

Suggest 2-3 placement options ranked by preference.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Text placement analysis error:', error);
    // Return default suggestions
    return {
      placements: [
        {
          zone: 'bottom',
          x: 50,
          y: 85,
          maxWidth: 80,
          alignment: 'center',
          reasoning: 'Default bottom placement for headlines'
        },
        {
          zone: 'top',
          x: 50,
          y: 15,
          maxWidth: 70,
          alignment: 'center',
          reasoning: 'Alternative top placement'
        }
      ],
      colorSuggestions: {
        textColor: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.6)',
        reasoning: 'White text with dark overlay ensures readability on any background'
      }
    };
  }
}

/**
 * Generate a complete signage design suggestion
 * Combines copy generation with placement analysis
 */
export async function generateSignageDesign(
  imageBase64: string,
  context: string,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    tone?: string;
    brandName?: string;
  }
): Promise<{
  copy: CopywriterOutput;
  placement: TextPlacementSuggestion;
}> {
  // Run both in parallel
  const [copy, placement] = await Promise.all([
    generateCopy({
      context,
      tone: options?.tone,
      brandName: options?.brandName,
      type: 'all'
    }),
    suggestTextPlacement(imageBase64, canvasWidth, canvasHeight)
  ]);

  return { copy, placement };
}
