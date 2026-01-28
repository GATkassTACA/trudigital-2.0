export type ImageSize =
  | '1024x1024'   // Square
  | '1152x896'    // Landscape
  | '896x1152'    // Portrait
  | '1344x768'    // Wide landscape (good for digital signage)
  | '768x1344'    // Tall portrait
  | '1536x640'    // Ultra-wide (great for banner displays)
  | '640x1536';   // Ultra-tall

// Video-compatible sizes (Stable Video Diffusion requirements)
export type VideoSize =
  | '1024x576'    // Landscape 16:9
  | '576x1024'    // Portrait 9:16
  | '768x768';    // Square

export type ImageStyle =
  | 'photographic'
  | 'digital-art'
  | 'cinematic'
  | 'anime'
  | 'comic-book'
  | 'fantasy-art'
  | 'neon-punk'
  | 'origami'
  | '3d-model'
  | 'enhance';    // For upscaling/enhancing existing images

// Quality tier for generation
export type QualityTier = 'standard' | 'ultra';

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  size?: ImageSize;
  style?: ImageStyle;
  samples?: number;        // Number of images to generate (1-4)
  seed?: number;           // For reproducibility
  cfgScale?: number;       // How closely to follow prompt (1-35, default 7)
  quality?: QualityTier;   // 'standard' = SDXL/Core, 'ultra' = SD3.5 Large
}

export interface GeneratedImage {
  id: string;
  url: string;              // URL or base64
  base64?: string;
  prompt: string;
  size: ImageSize;
  style?: ImageStyle;
  seed: number;
  createdAt: Date;
  provider: 'stability' | 'stability-ultra' | 'openai' | 'grok';
  cost: number;             // Cost in cents
}

export interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  creditsUsed: number;
}

// Video generation types
export interface GenerateVideoOptions {
  image: string;            // Base64 image or URL to animate
  seed?: number;
  cfgScale?: number;        // 0-10, default 1.8
  motionBucketId?: number;  // 1-255, controls motion amount (default 127)
}

export interface GeneratedVideo {
  id: string;
  url: string;              // URL or base64
  base64?: string;
  sourceImage: string;
  duration: number;         // Duration in seconds
  createdAt: Date;
  provider: 'stability';
  cost: number;
}

export interface VideoGenerationResult {
  success: boolean;
  video?: GeneratedVideo;
  generationId?: string;    // For async polling
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  creditsUsed: number;
}

export interface AIProvider {
  name: string;
  generate(options: GenerateImageOptions): Promise<GenerationResult>;
  getBalance?(): Promise<number>;
}

export interface VideoProvider {
  name: string;
  generateVideo(options: GenerateVideoOptions): Promise<VideoGenerationResult>;
  getVideoResult(generationId: string): Promise<VideoGenerationResult>;
}
