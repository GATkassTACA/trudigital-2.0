'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Wand2,
  Upload,
  Sparkles,
  Loader2,
  Check,
  X,
  Palette,
  Type,
  Zap,
  ArrowRight,
  Download,
  Pencil,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Building2,
  Store,
  Coffee,
  Building,
  Heart,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { autodesign, content } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  colors: Array<{
    hex: string;
    name: string;
    percentage: number;
  }>;
}

interface DesignVariation {
  id: string;
  prompt: string;
  style: string;
  mood: string;
  image?: {
    url: string;
    base64?: string;
    rawBackground?: string; // Original AI background without compositing
  };
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

interface AutoDesignResult {
  success: boolean;
  generationId: string;
  palette: BrandPalette;
  variations: DesignVariation[];
  text: string;
  summary: {
    total: number;
    completed: number;
    failed: number;
  };
}

const BUSINESS_TYPES = [
  { id: 'retail', name: 'Retail Store', icon: Store },
  { id: 'restaurant', name: 'Restaurant', icon: Coffee },
  { id: 'corporate', name: 'Corporate', icon: Building },
  { id: 'healthcare', name: 'Healthcare', icon: Heart },
  { id: 'professional', name: 'Professional Services', icon: Briefcase },
  { id: 'other', name: 'Other', icon: Building2 },
];

const MOOD_ICONS: Record<string, string> = {
  professional: '💼',
  energetic: '⚡',
  elegant: '✨',
  modern: '🔷',
  warm: '☀️',
  premium: '👑',
};

interface AutoDesignProps {
  onSelectDesign: (imageUrl: string, layers?: { logo?: string; text?: string; rawBackground?: string }) => void;
  preset?: string;
}

export default function AutoDesign({ onSelectDesign, preset = 'landscape-standard' }: AutoDesignProps) {
  const [step, setStep] = useState<'upload' | 'text' | 'generating' | 'results'>('upload');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [businessType, setBusinessType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutoDesignResult | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<DesignVariation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoDataUrl(dataUrl);
      setLogoPreview(dataUrl);
      setStep('text');
      toast.success('Logo uploaded!');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleGenerate = async () => {
    if (!logoDataUrl || !text.trim()) {
      toast.error('Please upload a logo and enter your text');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const { data } = await autodesign.create({
        logo: logoDataUrl,
        text: text.trim(),
        businessType: businessType || undefined,
        preset,
      });

      if (data.success) {
        setResult(data);
        setSelectedDesign(data.variations.find((v: DesignVariation) => v.status === 'completed') || null);
        setStep('results');
        toast.success(`Generated ${data.summary.completed} designs!`);
      } else {
        toast.error('Generation failed');
        setStep('text');
      }
    } catch (error: any) {
      console.error('Auto-design error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate designs');
      setStep('text');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async (variation: DesignVariation) => {
    if (!variation.image?.url) return;

    try {
      toast.loading('Saving to library...', { id: 'save-design' });
      const name = `${text.slice(0, 30)} - ${variation.mood}`;
      await content.upload(variation.image.url, name);
      toast.success('Saved to Content Library!', { id: 'save-design' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save', { id: 'save-design' });
    }
  };

  const handleDownload = (variation: DesignVariation) => {
    if (!variation.image?.url) return;
    const link = document.createElement('a');
    link.href = variation.image.url;
    link.download = `trudigital-${variation.mood}-${Date.now()}.png`;
    link.click();
  };

  const handleEdit = (variation: DesignVariation) => {
    if (!variation.image?.url) return;
    // Pass the raw background + layers so editor can make them movable
    const rawBg = variation.image.rawBackground || variation.image.url;
    onSelectDesign(rawBg, {
      logo: logoDataUrl || undefined,
      text: text,
      rawBackground: rawBg
    });
  };

  const handleReset = () => {
    setStep('upload');
    setLogoDataUrl(null);
    setLogoPreview(null);
    setText('');
    setBusinessType('');
    setResult(null);
    setSelectedDesign(null);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border border-purple-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-6 py-4 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              AI Auto-Design
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold rounded">
                MAGIC
              </span>
            </h2>
            <p className="text-sm text-purple-300">Upload logo + text → 6 designs instantly</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { id: 'upload', label: 'Upload Logo', icon: Upload },
            { id: 'text', label: 'Add Text', icon: Type },
            { id: 'generating', label: 'AI Magic', icon: Sparkles },
            { id: 'results', label: 'Choose Design', icon: Check },
          ].map((s, index) => {
            const isActive = s.id === step;
            const isPast = ['upload', 'text', 'generating', 'results'].indexOf(step) >
                          ['upload', 'text', 'generating', 'results'].indexOf(s.id);
            return (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                  isActive ? 'bg-purple-500 text-white scale-110' :
                  isPast ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-800 text-gray-500'
                )}>
                  <s.icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {index < 3 && (
                  <ArrowRight className={cn(
                    'w-4 h-4 mx-2',
                    isPast ? 'text-green-400' : 'text-gray-600'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload Logo */}
        {step === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center transition-all',
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-purple-500/50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Upload className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Your Logo</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Drop your logo here or click to browse. We'll extract your brand colors automatically.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition"
            >
              Choose Logo File
            </button>
            <p className="text-gray-500 text-sm mt-4">Supports PNG, JPG, WebP • Transparent backgrounds work best</p>
          </div>
        )}

        {/* Step 2: Enter Text & Business Type */}
        {step === 'text' && (
          <div className="space-y-6">
            {/* Logo Preview */}
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain bg-white/10 rounded-lg p-2"
                />
              )}
              <div className="flex-1">
                <p className="text-white font-medium">Logo uploaded</p>
                <p className="text-gray-400 text-sm">Brand colors will be extracted automatically</p>
              </div>
              <button
                onClick={() => { setStep('upload'); setLogoPreview(null); setLogoDataUrl(null); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What text should appear on your designs?
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., Summer Sale 30% Off, Welcome to Our Store, Now Open"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                maxLength={200}
              />
              <p className="text-gray-500 text-xs mt-2">{text.length}/200 characters</p>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business type (optional - helps AI understand your vibe)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setBusinessType(businessType === type.id ? '' : type.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-xl border transition text-left',
                      businessType === type.id
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-sm">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!text.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-3 text-lg"
            >
              <Zap className="w-6 h-6" />
              Generate 6 Designs
            </button>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="text-center py-12">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse opacity-50" />
              <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-purple-400 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">AI Magic in Progress</h3>
            <p className="text-gray-400 mb-4">
              Extracting brand colors and generating 6 unique designs...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-purple-400">This takes about 30-60 seconds</span>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && result && (
          <div className="space-y-6">
            {/* Brand Palette */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Extracted Brand Palette</span>
              </div>
              <div className="flex items-center gap-3">
                {[result.palette.primary, result.palette.secondary, result.palette.accent].map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-400 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Grid */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Choose Your Design ({result.summary.completed} variations)
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {result.variations.map((variation) => (
                  <div
                    key={variation.id}
                    className={cn(
                      'relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                      selectedDesign?.id === variation.id
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-transparent hover:border-gray-600'
                    )}
                    onClick={() => variation.status === 'completed' && setSelectedDesign(variation)}
                  >
                    {variation.status === 'completed' && variation.image ? (
                      <>
                        <div className="aspect-video bg-gray-900">
                          <img
                            src={variation.image.url}
                            alt={variation.mood}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium capitalize flex items-center gap-1">
                                  {MOOD_ICONS[variation.mood] || '🎨'} {variation.mood}
                                </p>
                                <p className="text-gray-400 text-xs capitalize">{variation.style}</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(variation); }}
                                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                                  title="Edit in Canvas"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownload(variation); }}
                                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSaveToLibrary(variation); }}
                                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                  title="Save to Library"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {selectedDesign?.id === variation.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </>
                    ) : variation.status === 'failed' ? (
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-red-400 text-sm">Failed</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Design Actions */}
            {selectedDesign && selectedDesign.image && (
              <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDesign.image.url}
                    alt="Selected"
                    className="w-16 h-10 object-cover rounded-lg"
                  />
                  <div>
                    <p className="text-white font-medium capitalize">{selectedDesign.mood} Design Selected</p>
                    <p className="text-gray-400 text-sm">Ready to edit or use</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(selectedDesign)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition flex items-center gap-2"
                >
                  <Pencil className="w-5 h-5" />
                  Edit in Canvas
                </button>
              </div>
            )}

            {/* Start Over */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
                Start Over with New Design
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
