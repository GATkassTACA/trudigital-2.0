/**
 * Image Compositor Service
 * Composites logo and text onto generated backgrounds
 */

// Dynamic import to avoid crashing on Vercel where sharp may not work
let sharpModule: typeof import('sharp') | null = null;

async function getSharp() {
  if (sharpModule) return sharpModule;
  try {
    sharpModule = (await import('sharp')).default;
    return sharpModule;
  } catch (error) {
    console.error('Sharp not available:', error);
    return null;
  }
}

interface CompositeOptions {
  background: string; // Base64 image
  logo: string; // Base64 image
  text: string;
  textPosition?: 'top' | 'center' | 'bottom';
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top';
  logoScale?: number; // 0.1 to 0.5 of width
  textColor?: string;
  textShadow?: boolean;
  mood?: string; // Affects text styling
}

interface CompositeResult {
  success: boolean;
  image?: string; // Base64 result
  error?: string;
}

// Convert base64 data URL to buffer
function base64ToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Convert buffer to base64 data URL
function bufferToBase64(buffer: Buffer, format: string = 'png'): string {
  return `data:image/${format};base64,${buffer.toString('base64')}`;
}

// Create text SVG overlay
function createTextSvg(
  text: string,
  width: number,
  height: number,
  position: 'top' | 'center' | 'bottom',
  textColor: string,
  mood: string
): string {
  // Calculate font size based on text length and image size
  const maxWidth = width * 0.85;
  const baseFontSize = Math.min(width / 12, 80);
  const fontSize = text.length > 30 ? baseFontSize * 0.7 : baseFontSize;

  // Position calculations
  let y: number;
  switch (position) {
    case 'top':
      y = height * 0.2;
      break;
    case 'bottom':
      y = height * 0.75;
      break;
    case 'center':
    default:
      y = height * 0.5;
  }

  // Style based on mood
  let fontFamily = 'Arial, sans-serif';
  let fontWeight = 'bold';
  let letterSpacing = '0.05em';

  if (mood === 'elegant' || mood === 'premium') {
    fontFamily = 'Georgia, serif';
    letterSpacing = '0.1em';
  } else if (mood === 'modern') {
    fontFamily = 'Helvetica, Arial, sans-serif';
    letterSpacing = '0.02em';
  } else if (mood === 'energetic') {
    fontWeight = '900';
  }

  // Shadow filter for better readability
  const shadowFilter = `
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.8)"/>
    </filter>
  `;

  // Text background for readability
  const textBgY = y - fontSize * 0.8;
  const textBgHeight = fontSize * 1.6;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${shadowFilter}
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${textColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${textColor};stop-opacity:0.9" />
        </linearGradient>
      </defs>

      <!-- Semi-transparent background bar for text -->
      <rect x="0" y="${textBgY}" width="${width}" height="${textBgHeight}"
            fill="rgba(0,0,0,0.4)" />

      <!-- Main text with shadow -->
      <text
        x="${width / 2}"
        y="${y}"
        font-family="${fontFamily}"
        font-size="${fontSize}px"
        font-weight="${fontWeight}"
        letter-spacing="${letterSpacing}"
        fill="${textColor}"
        text-anchor="middle"
        dominant-baseline="middle"
        filter="url(#shadow)"
      >${escapeXml(text)}</text>
    </svg>
  `;
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Composite logo and text onto a background image
 */
export async function compositeDesign(options: CompositeOptions): Promise<CompositeResult> {
  const {
    background,
    logo,
    text,
    textPosition = 'center',
    logoPosition = 'top-left',
    logoScale = 0.15,
    textColor = '#FFFFFF',
    mood = 'professional'
  } = options;

  try {
    const sharp = await getSharp();
    if (!sharp) {
      return {
        success: false,
        error: 'Image processing not available in this environment'
      };
    }

    // Load background
    const bgBuffer = base64ToBuffer(background);
    const bgImage = sharp(bgBuffer);
    const bgMetadata = await bgImage.metadata();

    if (!bgMetadata.width || !bgMetadata.height) {
      throw new Error('Could not read background dimensions');
    }

    const width = bgMetadata.width;
    const height = bgMetadata.height;

    // Process logo
    const logoBuffer = base64ToBuffer(logo);
    const logoTargetWidth = Math.round(width * logoScale);

    const resizedLogo = await sharp!(logoBuffer)
      .resize(logoTargetWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    const logoMeta = await sharp!(resizedLogo).metadata();
    const logoWidth = logoMeta.width || logoTargetWidth;
    const logoHeight = logoMeta.height || logoTargetWidth;

    // Calculate logo position
    let logoX: number, logoY: number;
    const padding = Math.round(width * 0.03);

    switch (logoPosition) {
      case 'top-right':
        logoX = width - logoWidth - padding;
        logoY = padding;
        break;
      case 'bottom-left':
        logoX = padding;
        logoY = height - logoHeight - padding;
        break;
      case 'bottom-right':
        logoX = width - logoWidth - padding;
        logoY = height - logoHeight - padding;
        break;
      case 'center-top':
        logoX = Math.round((width - logoWidth) / 2);
        logoY = padding;
        break;
      case 'top-left':
      default:
        logoX = padding;
        logoY = padding;
    }

    // Create text overlay
    const textSvg = createTextSvg(text, width, height, textPosition, textColor, mood);
    const textBuffer = Buffer.from(textSvg);

    // Composite everything
    const result = await sharp!(bgBuffer)
      .composite([
        {
          input: resizedLogo,
          left: logoX,
          top: logoY
        },
        {
          input: textBuffer,
          left: 0,
          top: 0
        }
      ])
      .png()
      .toBuffer();

    return {
      success: true,
      image: bufferToBase64(result, 'png')
    };

  } catch (error: any) {
    console.error('Composite error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate multiple design variations with different layouts
 */
export async function compositeDesignVariations(
  background: string,
  logo: string,
  text: string,
  mood: string
): Promise<CompositeResult[]> {
  // Different layout combinations
  const layouts = [
    { textPosition: 'center' as const, logoPosition: 'top-left' as const },
    { textPosition: 'bottom' as const, logoPosition: 'top-right' as const },
    { textPosition: 'top' as const, logoPosition: 'bottom-left' as const },
    { textPosition: 'center' as const, logoPosition: 'center-top' as const },
    { textPosition: 'bottom' as const, logoPosition: 'top-left' as const },
    { textPosition: 'center' as const, logoPosition: 'bottom-right' as const },
  ];

  const results = await Promise.all(
    layouts.map((layout, index) =>
      compositeDesign({
        background,
        logo,
        text,
        textPosition: layout.textPosition,
        logoPosition: layout.logoPosition,
        logoScale: 0.12 + (index % 3) * 0.02, // Vary logo size slightly
        mood
      })
    )
  );

  return results;
}
