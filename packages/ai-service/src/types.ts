export type ImageSize =
  | '1024x1024'   // Square
  | '1152x896'    // Landscape
  | '896x1152'    // Portrait
  | '1344x768'    // Wide landscape (good for digital signage)
  | '768x1344'    // Tall portrait
  | '1536x640'    // Ultra-wide (great for banner displays)
  | '640x1536';   // Ultra-tall

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

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  size?: ImageSize;
  style?: ImageStyle;
  samples?: number;        // Number of images to generate (1-4)
  seed?: number;           // For reproducibility
  cfgScale?: number;       // How closely to follow prompt (1-35, default 7)
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
  provider: 'stability' | 'openai' | 'grok';
  cost: number;             // Cost in cents
}

export interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  creditsUsed: number;
}

export interface AIProvider {
  name: string;
  generate(options: GenerateImageOptions): Promise<GenerationResult>;
  getBalance?(): Promise<number>;
}
