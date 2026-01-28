import {
  AIProvider,
  VideoProvider,
  GenerateImageOptions,
  GenerationResult,
  GenerateVideoOptions,
  VideoGenerationResult,
  ImageSize,
  ImageStyle,
  QualityTier,
  VideoSize
} from './types';
import { StabilityAI } from './stability';
import { StabilityV2 } from './stabilityV2';

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

// Video-compatible presets (must match SVD requirements)
export const VIDEO_PRESETS = {
  'video-landscape': { size: '1024x576' as VideoSize },
  'video-portrait': { size: '576x1024' as VideoSize },
  'video-square': { size: '768x768' as VideoSize },
} as const;

export type SignagePreset = keyof typeof SIGNAGE_PRESETS;
export type VideoPreset = keyof typeof VIDEO_PRESETS;

export interface SignageGenerateOptions extends Omit<GenerateImageOptions, 'size' | 'style'> {
  preset?: SignagePreset;
  size?: ImageSize;
  style?: ImageStyle;
  brandColors?: string[];       // Hex colors to incorporate
  brandName?: string;           // Company name to include
  includeText?: string;         // Text overlay to add
  quality?: QualityTier;        // 'standard' (SDXL) or 'ultra' (SD3.5 Large)
}

export class ImageGenerator {
  private standardProvider: AIProvider;
  private ultraProvider: AIProvider & VideoProvider;

  constructor(standardProvider: AIProvider, ultraProvider: AIProvider & VideoProvider) {
    this.standardProvider = standardProvider;
    this.ultraProvider = ultraProvider;
  }

  // Factory method - creates generator with both standard and ultra providers
  static withStability(apiKey: string): ImageGenerator {
    return new ImageGenerator(
      new StabilityAI(apiKey),
      new StabilityV2(apiKey)
    );
  }

  // Main generation method with quality tier support
  async generate(options: SignageGenerateOptions): Promise<GenerationResult> {
    const { preset, brandColors, brandName, includeText, quality = 'standard', ...rest } = options;

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

    // Choose provider based on quality tier
    const provider = quality === 'ultra' ? this.ultraProvider : this.standardProvider;

    return provider.generate({
      ...rest,
      prompt: enhancedPrompt,
      negativePrompt,
      size: size || '1344x768',  // Default to landscape for signage
      style: style || 'photographic',
      quality
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

  // Generate video from an image (Stable Video Diffusion)
  async generateVideo(options: GenerateVideoOptions): Promise<VideoGenerationResult> {
    return this.ultraProvider.generateVideo(options);
  }

  // Poll for video generation result
  async getVideoResult(generationId: string): Promise<VideoGenerationResult> {
    return this.ultraProvider.getVideoResult(generationId);
  }

  // Get provider balance (if supported)
  async getBalance(): Promise<number> {
    if (this.ultraProvider.getBalance) {
      return this.ultraProvider.getBalance();
    }
    return -1;
  }
}
