import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

const STABILITY_API_URL = 'https://api.stability.ai';

export interface EditResult {
  success: boolean;
  image?: {
    base64: string;
    url: string;
  };
  error?: string;
  creditsUsed: number;
}

/**
 * Stability AI Edit Services
 * Provides image editing capabilities: remove background, erase objects,
 * search & replace, outpaint, and upscale
 */
export class StabilityEdit {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: STABILITY_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'image/*'
      },
      responseType: 'arraybuffer'
    });
  }

  /**
   * Remove background from image
   * Returns image with transparent background
   */
  async removeBackground(imageBase64: string): Promise<EditResult> {
    const formData = new FormData();
    const buffer = this.base64ToBuffer(imageBase64);
    formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append('output_format', 'png');

    try {
      const response = await this.client.post(
        '/v2beta/stable-image/edit/remove-background',
        formData,
        { headers: formData.getHeaders() }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: 3
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Erase objects from image using a mask
   * Mask should be white where you want to erase, black elsewhere
   */
  async erase(imageBase64: string, maskBase64: string): Promise<EditResult> {
    const formData = new FormData();

    const imageBuffer = this.base64ToBuffer(imageBase64);
    const maskBuffer = this.base64ToBuffer(maskBase64);

    formData.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append('mask', maskBuffer, { filename: 'mask.png', contentType: 'image/png' });
    formData.append('output_format', 'png');

    try {
      const response = await this.client.post(
        '/v2beta/stable-image/edit/erase',
        formData,
        { headers: formData.getHeaders() }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: 3
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Search and replace objects in image
   * Find objects matching the search prompt and replace with the prompt
   */
  async searchAndReplace(
    imageBase64: string,
    searchPrompt: string,
    replacePrompt: string
  ): Promise<EditResult> {
    const formData = new FormData();

    const buffer = this.base64ToBuffer(imageBase64);
    formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append('prompt', replacePrompt);
    formData.append('search_prompt', searchPrompt);
    formData.append('output_format', 'png');

    try {
      const response = await this.client.post(
        '/v2beta/stable-image/edit/search-and-replace',
        formData,
        { headers: formData.getHeaders() }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: 4
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Outpaint - extend image in specified directions
   * Useful for adapting images to different aspect ratios
   */
  async outpaint(
    imageBase64: string,
    direction: 'left' | 'right' | 'up' | 'down',
    pixels: number = 512,
    prompt?: string
  ): Promise<EditResult> {
    const formData = new FormData();

    const buffer = this.base64ToBuffer(imageBase64);
    formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append(direction, pixels.toString());
    formData.append('output_format', 'png');

    if (prompt) {
      formData.append('prompt', prompt);
    }

    try {
      const response = await this.client.post(
        '/v2beta/stable-image/edit/outpaint',
        formData,
        { headers: formData.getHeaders() }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: 4
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Outpaint to target dimensions
   * Intelligently extends image to match target aspect ratio
   */
  async outpaintToSize(
    imageBase64: string,
    currentWidth: number,
    currentHeight: number,
    targetWidth: number,
    targetHeight: number,
    prompt?: string
  ): Promise<EditResult> {
    // Calculate how much to extend in each direction
    const widthDiff = targetWidth - currentWidth;
    const heightDiff = targetHeight - currentHeight;

    let result: EditResult = {
      success: true,
      image: { base64: imageBase64, url: `data:image/png;base64,${imageBase64}` },
      creditsUsed: 0
    };

    // Extend horizontally if needed (split between left and right)
    if (widthDiff > 0) {
      const leftExtend = Math.floor(widthDiff / 2);
      const rightExtend = widthDiff - leftExtend;

      if (leftExtend > 0) {
        result = await this.outpaint(result.image!.base64, 'left', leftExtend, prompt);
        if (!result.success) return result;
      }
      if (rightExtend > 0) {
        result = await this.outpaint(result.image!.base64, 'right', rightExtend, prompt);
        if (!result.success) return result;
      }
    }

    // Extend vertically if needed (split between up and down)
    if (heightDiff > 0) {
      const upExtend = Math.floor(heightDiff / 2);
      const downExtend = heightDiff - upExtend;

      if (upExtend > 0) {
        result = await this.outpaint(result.image!.base64, 'up', upExtend, prompt);
        if (!result.success) return result;
      }
      if (downExtend > 0) {
        result = await this.outpaint(result.image!.base64, 'down', downExtend, prompt);
        if (!result.success) return result;
      }
    }

    return result;
  }

  /**
   * Upscale image to higher resolution
   * Supports 'fast' (4x) and 'conservative' modes
   */
  async upscale(
    imageBase64: string,
    mode: 'fast' | 'conservative' = 'fast',
    prompt?: string
  ): Promise<EditResult> {
    const formData = new FormData();

    const buffer = this.base64ToBuffer(imageBase64);
    formData.append('image', buffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append('output_format', 'png');

    if (prompt) {
      formData.append('prompt', prompt);
    }

    const endpoint = mode === 'fast'
      ? '/v2beta/stable-image/upscale/fast'
      : '/v2beta/stable-image/upscale/conservative';

    try {
      const response = await this.client.post(endpoint, formData, {
        headers: formData.getHeaders()
      });

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: mode === 'fast' ? 4 : 25
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Inpaint - fill masked area with AI-generated content based on prompt
   */
  async inpaint(
    imageBase64: string,
    maskBase64: string,
    prompt: string
  ): Promise<EditResult> {
    const formData = new FormData();

    const imageBuffer = this.base64ToBuffer(imageBase64);
    const maskBuffer = this.base64ToBuffer(maskBase64);

    formData.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
    formData.append('mask', maskBuffer, { filename: 'mask.png', contentType: 'image/png' });
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');

    try {
      const response = await this.client.post(
        '/v2beta/stable-image/edit/inpaint',
        formData,
        { headers: formData.getHeaders() }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        image: {
          base64,
          url: `data:image/png;base64,${base64}`
        },
        creditsUsed: 3
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Replace background with AI-generated one
   * Combines remove-background with inpaint/generation
   */
  async replaceBackground(
    imageBase64: string,
    newBackgroundPrompt: string
  ): Promise<EditResult> {
    // First, try search and replace with "background"
    return this.searchAndReplace(
      imageBase64,
      'background',
      newBackgroundPrompt
    );
  }

  private base64ToBuffer(base64: string): Buffer {
    // Handle data URL format
    if (base64.startsWith('data:')) {
      base64 = base64.split(',')[1];
    }
    return Buffer.from(base64, 'base64');
  }

  private handleError(error: any): EditResult {
    let errorMessage = 'Unknown error';

    if (error.response?.data) {
      try {
        const data = Buffer.from(error.response.data).toString('utf-8');
        const parsed = JSON.parse(data);
        errorMessage = parsed.message || parsed.error || data;
      } catch {
        errorMessage = Buffer.from(error.response.data).toString('utf-8');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Stability Edit Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      creditsUsed: 0
    };
  }
}
