import axios, { AxiosInstance } from 'axios';
import {
  AIProvider,
  GenerateImageOptions,
  GenerationResult,
  GeneratedImage,
  ImageSize,
  ImageStyle
} from '../types';

const STABILITY_API_URL = 'https://api.stability.ai';

// Stability AI engine IDs
const ENGINES = {
  SD3: 'stable-diffusion-3',
  SDXL: 'stable-diffusion-xl-1024-v1-0',
  SD_TURBO: 'stable-diffusion-xl-turbo'
} as const;

// Size to Stability dimensions mapping
const SIZE_MAP: Record<ImageSize, { width: number; height: number }> = {
  '1024x1024': { width: 1024, height: 1024 },
  '1152x896': { width: 1152, height: 896 },
  '896x1152': { width: 896, height: 1152 },
  '1344x768': { width: 1344, height: 768 },
  '768x1344': { width: 768, height: 1344 },
  '1536x640': { width: 1536, height: 640 },
  '640x1536': { width: 640, height: 1536 }
};

// Style presets for Stability
const STYLE_PRESETS: Record<ImageStyle, string> = {
  'photographic': 'photographic',
  'digital-art': 'digital-art',
  'cinematic': 'cinematic',
  'anime': 'anime',
  'comic-book': 'comic-book',
  'fantasy-art': 'fantasy-art',
  'neon-punk': 'neon-punk',
  'origami': 'origami',
  '3d-model': '3d-model',
  'enhance': 'enhance'
};

export class StabilityAI implements AIProvider {
  name = 'stability';
  private client: AxiosInstance;
  private apiKey: string;
  private engine: string;

  constructor(apiKey: string, engine: keyof typeof ENGINES = 'SDXL') {
    this.apiKey = apiKey;
    this.engine = ENGINES[engine];
    this.client = axios.create({
      baseURL: STABILITY_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async generate(options: GenerateImageOptions): Promise<GenerationResult> {
    const {
      prompt,
      negativePrompt,
      size = '1024x1024',
      style = 'photographic',
      samples = 1,
      seed,
      cfgScale = 7
    } = options;

    const dimensions = SIZE_MAP[size];

    try {
      const response = await this.client.post(
        `/v1/generation/${this.engine}/text-to-image`,
        {
          text_prompts: [
            { text: prompt, weight: 1 },
            ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : [])
          ],
          cfg_scale: cfgScale,
          width: dimensions.width,
          height: dimensions.height,
          samples,
          steps: 30,
          style_preset: STYLE_PRESETS[style],
          ...(seed !== undefined && { seed })
        }
      );

      const images: GeneratedImage[] = response.data.artifacts.map(
        (artifact: any, index: number) => ({
          id: `stability-${Date.now()}-${index}`,
          url: `data:image/png;base64,${artifact.base64}`,
          base64: artifact.base64,
          prompt,
          size,
          style,
          seed: artifact.seed,
          createdAt: new Date(),
          provider: 'stability' as const,
          cost: this.calculateCost(size)
        })
      );

      return {
        success: true,
        images,
        creditsUsed: samples * this.calculateCost(size)
      };
    } catch (error: any) {
      console.error('Stability AI Error:', error.response?.data || error.message);
      return {
        success: false,
        images: [],
        error: error.response?.data?.message || error.message,
        creditsUsed: 0
      };
    }
  }

  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get('/v1/user/balance');
      return response.data.credits;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return -1;
    }
  }

  // Cost in cents per image
  private calculateCost(size: ImageSize): number {
    // Stability pricing is roughly $0.002-0.006 per image depending on resolution
    // Using conservative estimate of ~3 cents per image
    const baseCost = 3;
    const dimensions = SIZE_MAP[size];
    const pixels = dimensions.width * dimensions.height;
    const basePixels = 1024 * 1024;

    // Scale cost by resolution
    return Math.ceil(baseCost * (pixels / basePixels));
  }

  // Upscale an existing image
  async upscale(imageBase64: string, width: number = 2048): Promise<GenerationResult> {
    try {
      const response = await this.client.post(
        `/v1/generation/${this.engine}/image-to-image/upscale`,
        {
          image: imageBase64,
          width
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const images: GeneratedImage[] = response.data.artifacts.map(
        (artifact: any, index: number) => ({
          id: `stability-upscale-${Date.now()}-${index}`,
          url: `data:image/png;base64,${artifact.base64}`,
          base64: artifact.base64,
          prompt: 'upscaled',
          size: '1024x1024',
          seed: artifact.seed,
          createdAt: new Date(),
          provider: 'stability' as const,
          cost: 5 // Upscaling costs a bit more
        })
      );

      return {
        success: true,
        images,
        creditsUsed: 5
      };
    } catch (error: any) {
      return {
        success: false,
        images: [],
        error: error.response?.data?.message || error.message,
        creditsUsed: 0
      };
    }
  }
}
