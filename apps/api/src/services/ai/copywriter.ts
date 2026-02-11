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

// ============================================
// AI DESIGN CRITIC
// ============================================

export interface DesignCritique {
  score: number; // 0-100
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    category: 'readability' | 'contrast' | 'composition' | 'brand' | 'color' | 'spacing';
    message: string;
    suggestion: string;
  }>;
  summary: string;
}

/**
 * AI Design Critic - analyzes a canvas design for readability, contrast,
 * composition, and brand compliance using Claude Vision
 */
export async function critiqueDesign(
  imageBase64: string,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    viewingDistance?: number;
    brandColors?: string[];
    brandFonts?: string[];
    brandName?: string;
  }
): Promise<DesignCritique> {
  const { viewingDistance = 10, brandColors, brandFonts, brandName } = options || {};

  const brandContext = brandColors?.length
    ? `\nBrand colors: ${brandColors.join(', ')}` +
      (brandFonts?.length ? `\nBrand fonts: ${brandFonts.join(', ')}` : '') +
      (brandName ? `\nBrand name: ${brandName}` : '')
    : '';

  const prompt = `You are an expert digital signage design critic. Analyze this design for a ${canvasWidth}x${canvasHeight}px display viewed from approximately ${viewingDistance} feet away.
${brandContext}

Evaluate these criteria:

1. **Readability**: Is text large enough for ${viewingDistance}ft viewing? Rule of thumb: 1 inch of letter height per 10 feet of viewing distance. At ${viewingDistance}ft on a ${canvasWidth}x${canvasHeight} display, minimum font should be roughly ${Math.round(viewingDistance * 2.5)}px.
2. **Contrast**: Do text elements have sufficient contrast against their backgrounds? WCAG requires 4.5:1 for normal text, 3:1 for large text.
3. **Composition**: Is there clear visual hierarchy? Is the most important element prominent? Is there balanced whitespace?
4. **Brand compliance**: ${brandColors?.length ? 'Are the brand colors being used effectively?' : 'General color harmony and consistency.'}
5. **Signage effectiveness**: Will this grab attention? Is any call-to-action clear? Can the message be understood in 3-5 seconds?
6. **Spacing**: Are elements too crowded? Is there breathing room between elements?

Score from 0-100 where:
- 90-100: Excellent, production-ready
- 70-89: Good, minor improvements possible
- 50-69: Needs work, several issues
- Below 50: Major issues, redesign recommended

Respond in JSON format:
{
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "category": "readability|contrast|composition|brand|color|spacing",
      "message": "what's wrong",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

Be specific and actionable. Reference actual elements you see in the design.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
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
    console.error('Design critique error:', error);
    return {
      score: 0,
      issues: [{
        severity: 'error',
        category: 'readability',
        message: 'Unable to analyze design',
        suggestion: 'Please try again or check your image format'
      }],
      summary: 'Analysis failed. Please try again.'
    };
  }
}

// ============================================
// RESPONSIVE LAYOUT ADAPTATION
// ============================================

export interface AdaptedLayout {
  elements: Array<{
    type: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    fontSize?: number;
    text?: string;
  }>;
  reasoning: string;
}

/**
 * Adapt a canvas layout to new dimensions using Claude Vision
 * Analyzes the current design and repositions elements for the target aspect ratio
 */
export async function adaptLayout(
  imageBase64: string,
  canvasJson: any,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Promise<AdaptedLayout> {
  // Extract simplified element list from canvas JSON
  const elements = (canvasJson?.objects || [])
    .filter((obj: any) => obj.type !== 'image' || !obj.data?._isBackground)
    .map((obj: any, i: number) => ({
      index: i,
      type: obj.type,
      left: Math.round(obj.left),
      top: Math.round(obj.top),
      width: Math.round(obj.width * (obj.scaleX || 1)),
      height: Math.round(obj.height * (obj.scaleY || 1)),
      text: obj.type === 'textbox' || obj.type === 'i-text' ? obj.text : undefined,
      fontSize: obj.fontSize,
    }));

  const prompt = `You are a digital signage layout expert. I have a design at ${sourceWidth}x${sourceHeight}px that needs to be adapted to ${targetWidth}x${targetHeight}px.

The design has these overlay elements (background will be handled separately):
${JSON.stringify(elements, null, 2)}

Reposition and resize these elements for the ${targetWidth}x${targetHeight} target while maintaining:
1. Visual hierarchy (most important element stays prominent)
2. Relative proportions and relationships between elements
3. Readable text sizes (scale font sizes proportionally, but never below 16px)
4. Balanced composition for the new aspect ratio
5. Adequate margins (at least 5% from edges)

If the target is significantly smaller, you may suggest shortened text.

Respond in JSON format:
{
  "elements": [
    {
      "type": "textbox|rect|image|etc",
      "left": number,
      "top": number,
      "width": number,
      "height": number,
      "scaleX": 1,
      "scaleY": 1,
      "fontSize": number (for text only),
      "text": "string (for text only, include if shortened)"
    }
  ],
  "reasoning": "brief explanation of layout strategy"
}

Return elements in the same order as input.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
    console.error('Layout adaptation error:', error);
    // Fallback: simple proportional scaling
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      elements: elements.map((el: any) => ({
        type: el.type,
        left: Math.round(el.left * scaleX),
        top: Math.round(el.top * scaleY),
        width: el.width ? Math.round(el.width * scale) : undefined,
        height: el.height ? Math.round(el.height * scale) : undefined,
        scaleX: 1,
        scaleY: 1,
        fontSize: el.fontSize ? Math.max(16, Math.round(el.fontSize * scale)) : undefined,
        text: el.text,
      })),
      reasoning: 'Fallback: proportional scaling (AI analysis unavailable)'
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
