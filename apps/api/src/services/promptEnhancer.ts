import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

interface EnhancementResult {
  enhancedPrompt: string;
  negativePrompt: string;
  reasoning: string;
  suggestedStyle: string;
  tags: string[];
}

interface EnhanceOptions {
  userPrompt: string;
  signageType?: string;
  brandColors?: string[];
  brandName?: string;
  targetSize?: string;
  style?: string;
}

export async function enhancePrompt(options: EnhanceOptions): Promise<EnhancementResult> {
  const { userPrompt, signageType, brandColors, brandName, targetSize, style } = options;

  const systemPrompt = `You are an expert at creating prompts for AI image generation, specifically for digital signage and displays. Your job is to take a user's basic request and transform it into a detailed, optimized prompt that will generate stunning professional signage images.

You understand:
- Digital signage best practices (high contrast, readable text areas, eye-catching visuals)
- Composition for different display orientations (landscape, portrait, square)
- Color psychology and brand integration
- What makes effective promotional, informational, and decorative signage

When enhancing prompts:
1. Add specific visual details (lighting, perspective, depth)
2. Include composition guidance (rule of thirds, focal points, negative space for text)
3. Suggest complementary elements that enhance the message
4. Consider the display context (lobby, retail, restaurant, etc.)
5. Add technical quality terms (8k, professional photography, sharp focus)

IMPORTANT: Generate prompts optimized for Stability AI's SDXL model. Focus on visual descriptions, not text content (the user will add text in the editor).`;

  const userMessage = `Please enhance this signage image request:

USER REQUEST: "${userPrompt}"

CONTEXT:
- Signage Type: ${signageType || 'general digital signage'}
- Target Size: ${targetSize || '1344x768 landscape'}
- Preferred Style: ${style || 'photographic'}
${brandColors?.length ? `- Brand Colors: ${brandColors.join(', ')}` : ''}
${brandName ? `- Brand Name: ${brandName}` : ''}

Respond in this exact JSON format:
{
  "reasoning": "Brief explanation of your interpretation and approach (2-3 sentences)",
  "enhancedPrompt": "The optimized, detailed prompt for image generation",
  "negativePrompt": "Things to avoid in the image (artifacts, unwanted elements)",
  "suggestedStyle": "photographic|digital-art|cinematic|3d-model|neon-punk",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      system: systemPrompt
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]) as EnhancementResult;
    return result;

  } catch (error: any) {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const keyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT SET';
    console.error('Prompt enhancement error:', {
      message: error.message,
      status: error.status,
      hasApiKey,
      keyPrefix,
      error: error.toString()
    });

    // Fallback to basic enhancement if Claude fails
    return {
      enhancedPrompt: `${userPrompt}, professional digital signage, high quality, 8k resolution, sharp focus, commercial photography`,
      negativePrompt: 'blurry, low quality, distorted, amateur, watermark, text, words, letters',
      reasoning: hasApiKey ? `API error: ${error.message}` : 'ANTHROPIC_API_KEY not configured',
      suggestedStyle: style || 'photographic',
      tags: ['signage', 'professional', 'digital display']
    };
  }
}

export async function analyzeIntent(userPrompt: string): Promise<{
  intent: string;
  signageType: string;
  mood: string;
  keyElements: string[];
}> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Analyze this signage request and identify the intent:

"${userPrompt}"

Respond in JSON:
{
  "intent": "promotion|information|welcome|menu|event|decoration|announcement",
  "signageType": "retail banner|menu board|lobby display|event poster|sale sign|wayfinding|general",
  "mood": "energetic|calm|professional|festive|urgent|luxurious|friendly",
  "keyElements": ["element1", "element2", "element3"]
}`
        }
      ]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      intent: 'general',
      signageType: 'general',
      mood: 'professional',
      keyElements: []
    };
  }
}
