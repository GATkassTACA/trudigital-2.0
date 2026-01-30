/**
 * Color Extraction Service
 * Analyzes images to extract dominant colors and create brand palettes
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorInfo {
  hex: string;
  rgb: RGB;
  name: string;
  percentage: number;
}

interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  colors: ColorInfo[];
}

// Simple color name mapping
const COLOR_NAMES: Record<string, string> = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FFFFFF': 'White',
  '#000000': 'Black',
  '#FFA500': 'Orange',
  '#800080': 'Purple',
  '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown',
  '#808080': 'Gray',
};

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function getColorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function getClosestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  let closestName = 'Unknown';
  let closestDistance = Infinity;

  for (const [colorHex, name] of Object.entries(COLOR_NAMES)) {
    const colorRgb = hexToRgb(colorHex);
    const distance = getColorDistance(rgb, colorRgb);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestName = name;
    }
  }

  // Add modifiers based on lightness
  const lightness = (rgb.r + rgb.g + rgb.b) / 3;
  if (lightness > 200 && closestName !== 'White') {
    closestName = 'Light ' + closestName;
  } else if (lightness < 50 && closestName !== 'Black') {
    closestName = 'Dark ' + closestName;
  }

  return closestName;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

function generateComplementary(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

function generateAnalogous(hex: string): string[] {
  const rgb = hexToRgb(hex);
  // Rotate hue by 30 degrees in both directions (simplified)
  const shift = 30;
  return [
    rgbToHex(
      Math.min(255, Math.max(0, rgb.r + shift)),
      rgb.g,
      Math.min(255, Math.max(0, rgb.b - shift))
    ),
    rgbToHex(
      Math.min(255, Math.max(0, rgb.r - shift)),
      rgb.g,
      Math.min(255, Math.max(0, rgb.b + shift))
    ),
  ];
}

/**
 * Extract colors from a base64 encoded image
 * Uses a simple sampling algorithm for server-side extraction
 */
export async function extractColorsFromImage(base64Data: string): Promise<BrandPalette> {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Decode base64 to buffer
  const buffer = Buffer.from(cleanBase64, 'base64');

  // For server-side, we'll do a simplified color analysis
  // by sampling bytes from the raw image data
  const colorMap = new Map<string, number>();

  // Sample pixels from the buffer (simplified approach)
  // Real implementation would use a proper image library
  for (let i = 0; i < buffer.length - 2; i += 4) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];

    // Skip near-transparent pixels (assuming RGBA)
    if (buffer.length > i + 3 && buffer[i + 3] < 128) continue;

    // Quantize colors to reduce variety (group similar colors)
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;

    const hex = rgbToHex(qr, qg, qb);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0);

  const colors: ColorInfo[] = sortedColors.map(([hex, count]) => ({
    hex,
    rgb: hexToRgb(hex),
    name: getClosestColorName(hex),
    percentage: Math.round((count / totalPixels) * 100)
  }));

  // Determine palette roles
  // Filter out near-white and near-black for primary/secondary
  const significantColors = colors.filter(c => {
    const rgb = c.rgb;
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 30 && brightness < 225;
  });

  const primary = significantColors[0]?.hex || colors[0]?.hex || '#6366F1';
  const secondary = significantColors[1]?.hex || generateAnalogous(primary)[0] || '#EC4899';
  const accent = generateComplementary(primary);
  const background = colors.find(c => {
    const rgb = c.rgb;
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 200;
  })?.hex || '#FFFFFF';
  const text = getContrastColor(background);

  return {
    primary,
    secondary,
    accent,
    background,
    text,
    colors
  };
}

/**
 * Generate design variations based on brand palette
 */
export function generateDesignVariations(
  palette: BrandPalette,
  text: string
): string[] {
  const { primary, secondary, accent } = palette;

  // 6 different design styles/moods
  return [
    // 1. Bold & Professional
    `Professional commercial signage design with bold typography space for "${text}", clean minimalist composition, primary brand color ${primary}, accent color ${secondary}, corporate aesthetic, negative space for text overlay in center, 8k resolution, sharp focus, advertising quality`,

    // 2. Vibrant & Energetic
    `High-energy promotional display with dynamic shapes and gradients using ${primary} and ${accent}, vibrant neon accents, space for headline "${text}", modern retail signage style, eye-catching composition, dramatic lighting, commercial photography quality`,

    // 3. Elegant & Luxurious
    `Sophisticated luxury signage background with subtle gold accents, rich ${primary} tones blending to ${secondary}, elegant marble or silk textures, premium brand aesthetic, ample negative space for refined typography "${text}", high-end retail display quality`,

    // 4. Modern & Geometric
    `Contemporary geometric pattern signage with abstract shapes in ${primary} and ${secondary}, clean lines, mathematical precision, modern art influenced, space for bold sans-serif text "${text}", trendy digital aesthetic, sharp details, 8k`,

    // 5. Warm & Inviting
    `Welcoming promotional display with warm gradients from ${primary} to ${secondary}, soft bokeh lights, friendly atmosphere, organic flowing shapes, hospitality signage style, text space for "${text}", inviting commercial aesthetic`,

    // 6. Dark & Premium
    `Dark premium signage background with deep blacks and ${primary} accent lighting, dramatic shadows, cinematic mood, luxury brand aesthetic, glowing edge highlights in ${accent}, space for white text "${text}", high contrast professional display`
  ];
}

export { BrandPalette, ColorInfo };
