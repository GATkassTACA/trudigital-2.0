import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import {
  AIProvider,
  VideoProvider,
  GenerateImageOptions,
  GenerationResult,
  GeneratedImage,
  GenerateVideoOptions,
  VideoGenerationResult,
  GeneratedVideo,
  ImageSize,
  ImageStyle
} from './types';

const STABILITY_API_URL = 'https://api.stability.ai';

// Style presets for v2beta
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

// Map our sizes to aspect ratios for v2beta
const SIZE_TO_ASPECT: Record<ImageSize, string> = {
  '1024x1024': '1:1',
  '1152x896': '4:3',
  '896x1152': '3:4',
  '1344x768': '16:9',
  '768x1344': '9:16',
  '1536x640': '21:9',
  '640x1536': '9:21'
};

/**
 * Stability AI v2beta provider
 * Supports SD3.5 Large (Ultra) and Stable Video Diffusion
 */
export class StabilityV2 implements AIProvider, VideoProvider {
  name = 'stability-ultra';
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: STABILITY_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Generate image using SD3.5 Large (Ultra) or Core
   */
  async generate(options: GenerateImageOptions): Promise<GenerationResult> {
    const {
      prompt,
      negativePrompt,
      size = '1024x1024',
      style = 'photographic',
      seed,
      quality = 'ultra'
    } = options;

    const endpoint = quality === 'ultra'
      ? '/v2beta/stable-image/generate/ultra'
      : '/v2beta/stable-image/generate/core';

    const formData = new FormData();
    formData.append('prompt', prompt);

    if (negativePrompt) {
      formData.append('negative_prompt', negativePrompt);
    }

    formData.append('aspect_ratio', SIZE_TO_ASPECT[size] || '16:9');
    formData.append('output_format', 'png');

    if (seed !== undefined) {
      formData.append('seed', seed.toString());
    }

    // Ultra supports style_preset
    if (quality === 'ultra' && style) {
      formData.append('style_preset', STYLE_PRESETS[style]);
    }

    try {
      const response = await this.client.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*'
        },
        responseType: 'arraybuffer'
      });

      const base64 = Buffer.from(response.data).toString('base64');
      const cost = quality === 'ultra' ? 8 : 3; // cents

      const image: GeneratedImage = {
        id: `stability-v2-${Date.now()}`,
        url: `data:image/png;base64,${base64}`,
        base64,
        prompt,
        size,
        style,
        seed: seed || 0,
        createdAt: new Date(),
        provider: 'stability-ultra',
        cost
      };

      return {
        success: true,
        images: [image],
        creditsUsed: cost
      };
    } catch (error: any) {
      console.error('Stability v2 Error:', error.response?.data?.toString() || error.message);
      return {
        success: false,
        images: [],
        error: this.parseError(error),
        creditsUsed: 0
      };
    }
  }

  /**
   * Generate video from image using Stable Video Diffusion
   * Returns a generation ID for async polling
   */
  async generateVideo(options: GenerateVideoOptions): Promise<VideoGenerationResult> {
    const {
      image,
      seed = 0,
      cfgScale = 1.8,
      motionBucketId = 127
    } = options;

    const formData = new FormData();

    // Handle base64 or URL
    if (image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    } else if (image.startsWith('http')) {
      // Fetch the image first
      const imageResponse = await axios.get(image, { responseType: 'arraybuffer' });
      formData.append('image', Buffer.from(imageResponse.data), { filename: 'image.png', contentType: 'image/png' });
    } else {
      // Assume raw base64
      const buffer = Buffer.from(image, 'base64');
      formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    }

    formData.append('seed', seed.toString());
    formData.append('cfg_scale', cfgScale.toString());
    formData.append('motion_bucket_id', motionBucketId.toString());

    try {
      const response = await this.client.post('/v2beta/image-to-video', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        generationId: response.data.id,
        status: 'processing',
        creditsUsed: 0 // Charged on completion
      };
    } catch (error: any) {
      console.error('Stability Video Error:', error.response?.data || error.message);
      return {
        success: false,
        error: this.parseError(error),
        creditsUsed: 0
      };
    }
  }

  /**
   * Poll for video generation result
   */
  async getVideoResult(generationId: string): Promise<VideoGenerationResult> {
    try {
      const response = await this.client.get(
        `/v2beta/image-to-video/result/${generationId}`,
        {
          headers: {
            'Accept': 'video/*'
          },
          responseType: 'arraybuffer',
          validateStatus: (status) => status === 200 || status === 202
        }
      );

      // 202 = still processing
      if (response.status === 202) {
        return {
          success: true,
          generationId,
          status: 'processing',
          creditsUsed: 0
        };
      }

      // 200 = completed
      const base64 = Buffer.from(response.data).toString('base64');
      const video: GeneratedVideo = {
        id: generationId,
        url: `data:video/mp4;base64,${base64}`,
        base64,
        sourceImage: '',
        duration: 4, // SVD generates ~4 second videos
        createdAt: new Date(),
        provider: 'stability',
        cost: 20 // ~$0.20 per video
      };

      return {
        success: true,
        video,
        generationId,
        status: 'completed',
        creditsUsed: 20
      };
    } catch (error: any) {
      // Check if it's a "not ready" response
      if (error.response?.status === 202) {
        return {
          success: true,
          generationId,
          status: 'processing',
          creditsUsed: 0
        };
      }

      console.error('Stability Video Result Error:', error.response?.data || error.message);
      return {
        success: false,
        generationId,
        status: 'failed',
        error: this.parseError(error),
        creditsUsed: 0
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get('/v1/user/balance');
      return response.data.credits;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return -1;
    }
  }

  private parseError(error: any): string {
    if (error.response?.data) {
      const data = error.response.data;
      if (Buffer.isBuffer(data)) {
        try {
          return data.toString('utf-8');
        } catch {
          return 'Unknown error';
        }
      }
      if (data instanceof ArrayBuffer) {
        try {
          return Buffer.from(new Uint8Array(data)).toString('utf-8');
        } catch {
          return 'Unknown error';
        }
      }
      return data.message || data.error || JSON.stringify(data);
    }
    return error.message || 'Unknown error';
  }
}
