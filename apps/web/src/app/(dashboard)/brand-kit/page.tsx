'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Palette,
  Upload,
  Save,
  Loader2,
  Plus,
  X,
  Trash2,
  Type,
  Sparkles,
  Check,
  Image as ImageIcon,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { brandkit } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BrandKit {
  organizationId: string;
  organizationName: string;
  brandColors: string[];
  logoUrl: string | null;
  logoLightUrl: string | null;
  brandFonts: string[];
  brandName: string | null;
  tagline: string | null;
}

const POPULAR_FONTS = [
  'Arial', 'Helvetica', 'Verdana', 'Roboto', 'Open Sans', 'Lato',
  'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Raleway', 'Ubuntu',
  'Times New Roman', 'Georgia', 'Garamond', 'Playfair Display',
  'Merriweather', 'Oswald', 'Bebas Neue', 'Anton', 'Pacifico', 'Lobster'
];

const SUGGESTED_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#1F2937',
  '#374151', '#6B7280', '#FFFFFF', '#000000'
];

export default function BrandKitPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  // Form state
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [headingFont, setHeadingFont] = useState('Arial');
  const [bodyFont, setBodyFont] = useState('Georgia');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLightUrl, setLogoLightUrl] = useState<string | null>(null);

  const [newColor, setNewColor] = useState('#6366F1');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightFileInputRef = useRef<HTMLInputElement>(null);

  // Load brand kit
  useEffect(() => {
    loadBrandKit();
  }, []);

  const loadBrandKit = async () => {
    try {
      const { data } = await brandkit.get();
      const kit = data.brandKit;
      setBrandKit(kit);
      setBrandName(kit.brandName || '');
      setTagline(kit.tagline || '');
      setColors(kit.brandColors || []);
      setHeadingFont(kit.brandFonts?.[0] || 'Arial');
      setBodyFont(kit.brandFonts?.[1] || 'Georgia');
      setLogoUrl(kit.logoUrl);
      setLogoLightUrl(kit.logoLightUrl);
    } catch (error) {
      console.error('Failed to load brand kit:', error);
      toast.error('Failed to load brand kit');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await brandkit.update({
        brandName: brandName || null,
        tagline: tagline || null,
        brandColors: colors,
        brandFonts: [headingFont, bodyFont],
        logoUrl,
        logoLightUrl,
      });
      toast.success('Brand kit saved!');
    } catch (error) {
      console.error('Failed to save brand kit:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = useCallback(async (file: File, type: 'primary' | 'light') => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const { data } = await brandkit.uploadLogo(dataUrl, type);
        if (type === 'primary') {
          setLogoUrl(data.logoUrl);
        } else {
          setLogoLightUrl(data.logoLightUrl);
        }
        toast.success('Logo uploaded!');

        // Auto-extract colors from logo
        try {
          const colorResponse = await brandkit.extractColors(dataUrl);
          if (colorResponse.data.suggestedColors?.length > 0) {
            const newColors = [...colors];
            colorResponse.data.suggestedColors.forEach((color: string) => {
              if (!newColors.includes(color)) {
                newColors.push(color);
              }
            });
            setColors(newColors.slice(0, 6)); // Max 6 colors
            toast.success('Colors extracted from logo!');
          }
        } catch (e) {
          // Silent fail for color extraction
        }
      } catch (error) {
        toast.error('Failed to upload logo');
      }
    };
    reader.readAsDataURL(file);
  }, [colors]);

  const handleDeleteLogo = async (type: 'primary' | 'light') => {
    try {
      await brandkit.deleteLogo(type);
      if (type === 'primary') {
        setLogoUrl(null);
      } else {
        setLogoLightUrl(null);
      }
      toast.success('Logo removed');
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };

  const addColor = () => {
    if (colors.length >= 6) {
      toast.error('Maximum 6 brand colors');
      return;
    }
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
    setShowColorPicker(false);
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Palette className="w-7 h-7 text-brand-400" />
            Brand Kit
          </h1>
          <p className="text-gray-400 mt-1">
            Save your brand settings for consistent designs across all content
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-xl transition"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Brand Kit
        </button>
      </div>

      <div className="space-y-8">
        {/* Brand Info */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Brand Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your Business Name"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Your catchy tagline"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>
        </section>

        {/* Logos */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-400" />
            Logos
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary Logo (for light backgrounds) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Primary Logo (for light backgrounds)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'primary')}
                className="hidden"
              />
              {logoUrl ? (
                <div className="relative bg-white rounded-xl p-6 border border-gray-600 group">
                  <img src={logoUrl} alt="Primary Logo" className="max-h-32 mx-auto object-contain" />
                  <button
                    onClick={() => handleDeleteLogo('primary')}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-600 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition"
                >
                  <Upload className="w-8 h-8" />
                  <span>Upload Logo</span>
                </button>
              )}
            </div>

            {/* Light Logo (for dark backgrounds) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Light Logo (for dark backgrounds)
              </label>
              <input
                ref={lightFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'light')}
                className="hidden"
              />
              {logoLightUrl ? (
                <div className="relative bg-gray-900 rounded-xl p-6 border border-gray-600 group">
                  <img src={logoLightUrl} alt="Light Logo" className="max-h-32 mx-auto object-contain" />
                  <button
                    onClick={() => handleDeleteLogo('light')}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => lightFileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-600 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition bg-gray-900"
                >
                  <Upload className="w-8 h-8" />
                  <span>Upload Light Logo</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Tip: Upload your logo and we'll automatically extract your brand colors!
          </p>
        </section>

        {/* Brand Colors */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-400" />
            Brand Colors
          </h2>

          {/* Current Colors */}
          <div className="flex flex-wrap gap-3 mb-4">
            {colors.map((color, index) => (
              <div key={color} className="relative group">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-lg cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <button
                  onClick={() => removeColor(color)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-mono">
                  {index === 0 ? 'Primary' : index === 1 ? 'Secondary' : ''}
                </span>
              </div>
            ))}

            {colors.length < 6 && (
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-600 hover:border-brand-500 flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                  <Plus className="w-6 h-6" />
                </button>

                {showColorPicker && (
                  <div className="absolute top-20 left-0 z-10 bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-xl w-72">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
                      />
                      <button
                        onClick={addColor}
                        className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded transition"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">Quick pick:</p>
                    <div className="grid grid-cols-7 gap-1">
                      {SUGGESTED_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColor(color)}
                          className={cn(
                            'w-8 h-8 rounded border transition',
                            newColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm">
            Add up to 6 brand colors. The first color is your primary, second is secondary.
          </p>
        </section>

        {/* Typography */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-brand-400" />
            Typography
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Heading Font
              </label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 transition"
              >
                {POPULAR_FONTS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
              <div
                className="mt-3 p-4 bg-gray-900 rounded-lg text-2xl text-white"
                style={{ fontFamily: headingFont }}
              >
                Heading Preview
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Body Font
              </label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 transition"
              >
                {POPULAR_FONTS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
              <div
                className="mt-3 p-4 bg-gray-900 rounded-lg text-base text-gray-300"
                style={{ fontFamily: bodyFont }}
              >
                Body text preview. This is how your body copy will look across your signage.
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Brand Preview</h2>
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: colors[0] || '#6366F1' }}
          >
            {logoLightUrl && (
              <img src={logoLightUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
            )}
            <h3
              className="text-4xl font-bold text-white mb-2"
              style={{ fontFamily: headingFont }}
            >
              {brandName || 'Your Brand Name'}
            </h3>
            <p
              className="text-xl text-white/80"
              style={{ fontFamily: bodyFont }}
            >
              {tagline || 'Your tagline here'}
            </p>
            {colors.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {colors.slice(1).map((color) => (
                  <div
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-white/30"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
