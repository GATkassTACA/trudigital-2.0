import {
  AIProvider,
  GenerateImageOptions,
  GenerationResult,
  ImageSize,
  ImageStyle
} from './types';
import { StabilityAI } from './stability';

// Signage-specific presets
export const SIGNAGE_PRESETS = {
  // Horizontal displays
  'landscape-standard': { size: '1344x768' as ImageSize, style: 'photographic' as ImageStyle },
  'landscape-wide': { size: '1536x640' as ImageSize, style: 'photographic' as ImageStyle },

  // Vertical/portrait displays
  'portrait-standard': { size: '768x1344' as ImageSize, style: 'photographic' as ImageStyle },
  'portrait-tall': { size: '640x1536' as ImageSize, style: 'photographic' as ImageStyle },

  // Square displays
  'square': { size: '1024x1024' as ImageSize, style: 'photographic' as ImageStyle },

  // Common use cases
  'menu-board': { size: '896x1152' as ImageSize, style: 'photographic' as ImageStyle },
  'lobby-display': { size: '1344x768' as ImageSize, style: 'cinematic' as ImageStyle },
  'retail-banner': { size: '1536x640' as ImageSize, style: 'digital-art' as ImageStyle },
  'event-poster': { size: '768x1344' as ImageSize, style: 'cinematic' as ImageStyle },
} as const;

export type SignagePreset = keyof typeof SIGNAGE_PRESETS;

export interface SignageGenerateOptions extends Omit<GenerateImageOptions, 'size' | 'style'> {
  preset?: SignagePreset;
  size?: ImageSize;
  style?: ImageStyle;
  brandColors?: string[];       // Hex colors to incorporate
  brandName?: string;           // Company name to include
  includeText?: string;         // Text overlay to add
}

export class ImageGenerator {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  // Factory methods for different providers
  static withStability(apiKey: string): ImageGenerator {
    return new ImageGenerator(new StabilityAI(apiKey));
  }

  // Main generation method
  async generate(options: SignageGenerateOptions): Promise<GenerationResult> {
    const { preset, brandColors, brandName, includeText, ...rest } = options;

    // Apply preset if specified
    let size = rest.size;
    let style = rest.style;
    if (preset && SIGNAGE_PRESETS[preset]) {
      size = size || SIGNAGE_PRESETS[preset].size;
      style = style || SIGNAGE_PRESETS[preset].style;
    }

    // Enhance prompt with brand context
    let enhancedPrompt = rest.prompt;

    if (brandColors && brandColors.length > 0) {
      const colorStr = brandColors.join(', ');
      enhancedPrompt += `. Color scheme: ${colorStr}`;
    }

    if (brandName) {
      enhancedPrompt += `. For ${brandName} brand`;
    }

    // Add signage-specific quality enhancements
    enhancedPrompt += '. High quality, professional, suitable for digital signage display, crisp and clear';

    // Build negative prompt for better results
    const negativePrompt = [
      rest.negativePrompt,
      'blurry',
      'low quality',
      'pixelated',
      'watermark',
      'text artifacts',
      'distorted'
    ].filter(Boolean).join(', ');

    return this.provider.generate({
      ...rest,
      prompt: enhancedPrompt,
      negativePrompt,
      size: size || '1344x768',  // Default to landscape for signage
      style: style || 'photographic'
    });
  }

  // Generate multiple variations
  async generateVariations(
    options: SignageGenerateOptions,
    count: number = 4
  ): Promise<GenerationResult> {
    return this.generate({
      ...options,
      samples: Math.min(count, 4) // Stability max is 4
    });
  }

  // Generate for specific signage use case
  async generateForUseCase(
    useCase: 'sale' | 'event' | 'menu' | 'welcome' | 'announcement',
    details: string,
    options?: Partial<SignageGenerateOptions>
  ): Promise<GenerationResult> {
    const prompts: Record<string, string> = {
      sale: `Eye-catching sale promotion display: ${details}. Bold, attention-grabbing, retail marketing style`,
      event: `Professional event announcement display: ${details}. Elegant, informative, engaging`,
      menu: `Restaurant menu board display: ${details}. Appetizing, clean layout, food photography style`,
      welcome: `Welcoming lobby display: ${details}. Professional, warm, inviting corporate style`,
      announcement: `Important announcement display: ${details}. Clear, professional, easy to read`
    };

    const presets: Record<string, SignagePreset> = {
      sale: 'retail-banner',
      event: 'event-poster',
      menu: 'menu-board',
      welcome: 'lobby-display',
      announcement: 'landscape-standard'
    };

    return this.generate({
      prompt: prompts[useCase],
      preset: presets[useCase],
      ...options
    });
  }

  // Get provider balance (if supported)
  async getBalance(): Promise<number> {
    if (this.provider.getBalance) {
      return this.provider.getBalance();
    }
    return -1;
  }
}
