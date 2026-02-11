'use client';

import { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Pencil,
  Check,
  RefreshCw,
  ListMusic,
  ChevronRight,
  ArrowLeft,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { templateai, content, playlists } from '@/lib/api';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'Restaurant', 'Retail', 'Corporate', 'Healthcare',
  'Fitness', 'Entertainment', 'Professional', 'Education',
];

const VIBES = [
  'Modern', 'Elegant', 'Energetic', 'Premium', 'Warm', 'Bold', 'Minimal', 'Fun',
];

interface SlideData {
  purpose: string;
  headline: string;
  subheadline: string;
  backgroundUrl?: string;
  style: string;
  mood: string;
  textColor: string;
  transition: string;
  status: string;
}

type Step = 'describe' | 'generating' | 'preview' | 'saved';

interface TemplateAIProps {
  preset?: string;
}

export default function TemplateAI({ preset }: TemplateAIProps) {
  const [step, setStep] = useState<Step>('describe');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(5);
  const [playlistName, setPlaylistName] = useState('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);

  const progressMessages = [
    'Understanding your business...',
    'Planning slide content with AI...',
    'Generating background images...',
    'Almost there...',
  ];
  const [progressIdx, setProgressIdx] = useState(0);

  const handleGenerate = async () => {
    if (!description.trim() || description.length < 10) {
      toast.error('Describe your business in at least 10 characters');
      return;
    }

    setStep('generating');
    setProgressIdx(0);

    // Cycle progress messages
    const interval = setInterval(() => {
      setProgressIdx((prev) => Math.min(prev + 1, progressMessages.length - 1));
    }, 4000);

    try {
      const { data } = await templateai.generate({
        businessDescription: description,
        industry: industry || undefined,
        vibe: vibe || undefined,
        slideCount,
        preset: preset || 'landscape-standard',
      });

      clearInterval(interval);

      if (data.success) {
        setSlides(data.slides);
        setBrandKit(data.brandKit);
        setPlaylistName(data.playlistName || 'My Playlist');
        setStep('preview');
        toast.success(`${data.summary.completed} slides generated!`);
      } else {
        toast.error('Generation failed');
        setStep('describe');
      }
    } catch (error: any) {
      clearInterval(interval);
      toast.error(error.response?.data?.error || 'Failed to generate');
      setStep('describe');
    }
  };

  /**
   * Composite text onto background image using off-screen canvas
   */
  const compositeSlide = async (slide: SlideData): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw background
        ctx.drawImage(img, 0, 0);

        // Semi-transparent dark band at bottom 40%
        const bandTop = canvas.height * 0.6;
        const gradient = ctx.createLinearGradient(0, bandTop - 40, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.15, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, bandTop - 40, canvas.width, canvas.height - bandTop + 40);

        const textColor = slide.textColor || '#FFFFFF';
        const padding = canvas.width * 0.06;
        const maxWidth = canvas.width - padding * 2;

        // Headline
        const headlineSize = Math.round(canvas.height * 0.07);
        ctx.font = `bold ${headlineSize}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';

        const headlineY = bandTop + (canvas.height - bandTop) * 0.35;
        wrapText(ctx, slide.headline, padding, headlineY, maxWidth, headlineSize * 1.2);

        // Subheadline
        const subSize = Math.round(canvas.height * 0.04);
        ctx.font = `${subSize}px sans-serif`;
        ctx.fillStyle = textColor + 'CC'; // slight transparency

        const subY = headlineY + headlineSize * 1.5;
        wrapText(ctx, slide.subheadline, padding, subY, maxWidth, subSize * 1.3);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load background image'));
      img.src = slide.backgroundUrl!;
    });
  };

  /**
   * Simple canvas text wrapping
   */
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  const handleSavePlaylist = async () => {
    const completedSlides = slides.filter((s) => s.status === 'completed' && s.backgroundUrl);
    if (completedSlides.length === 0) {
      toast.error('No completed slides to save');
      return;
    }

    setSaving(true);
    const toastId = 'save-playlist';
    toast.loading('Compositing slides...', { id: toastId });

    try {
      // Step 1: Composite text onto each background
      const composited: string[] = [];
      for (let i = 0; i < completedSlides.length; i++) {
        toast.loading(`Compositing slide ${i + 1}/${completedSlides.length}...`, { id: toastId });
        const dataUrl = await compositeSlide(completedSlides[i]);
        composited.push(dataUrl);
      }

      // Step 2: Upload each composited slide to content library
      toast.loading('Uploading to library...', { id: toastId });
      const contentIds: string[] = [];
      for (let i = 0; i < composited.length; i++) {
        const slideName = `${playlistName} - ${completedSlides[i].purpose}`;
        const { data } = await content.upload(composited[i], slideName);
        if (data.success && data.content?.id) {
          contentIds.push(data.content.id);
        }
      }

      if (contentIds.length === 0) {
        throw new Error('No slides were uploaded successfully');
      }

      // Step 3: Create playlist
      toast.loading('Creating playlist...', { id: toastId });
      const { data: playlistData } = await playlists.create(playlistName);
      const playlistId = playlistData.playlist?.id;

      if (!playlistId) {
        throw new Error('Failed to create playlist');
      }

      // Step 4: Add each slide as a playlist item with transitions
      for (let i = 0; i < contentIds.length; i++) {
        const slide = completedSlides[i];
        const transitionType = slide.transition || 'fade';

        const transitionData = {
          type: transitionType.includes('slide') ? 'slide' : transitionType,
          duration: 800,
          easing: 'power2.inOut',
          direction: transitionType.includes('left') ? 'left'
            : transitionType.includes('right') ? 'right'
            : transitionType.includes('up') ? 'up'
            : transitionType.includes('down') ? 'down'
            : undefined,
        };

        await playlists.addItem(playlistId, contentIds[i], 8, transitionType, transitionData);
      }

      toast.success(`Playlist "${playlistName}" created with ${contentIds.length} slides!`, { id: toastId });
      setSavedPlaylistId(playlistId);
      setStep('saved');
    } catch (error: any) {
      console.error('Save playlist error:', error);
      toast.error(error.message || 'Failed to save playlist', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const updateSlideText = (index: number, field: 'headline' | 'subheadline', value: string) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  // =============================================
  // RENDER
  // =============================================

  // Step 1: Describe
  if (step === 'describe') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Template AI</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Describe your business, get a playlist
          </h2>
          <p className="text-gray-400">
            AI generates complete multi-slide content — backgrounds, copy, transitions — ready for your screens.
          </p>
        </div>

        {/* Business Description */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tell us about your business
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Italian restaurant with wood-fired pizza, cozy rustic atmosphere, family-friendly, located downtown..."
            className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/1000 — The more detail, the better the results
          </p>
        </div>

        {/* Industry */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Industry
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(industry === ind ? null : ind)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition',
                  industry === ind
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(vibe === v ? null : v)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition',
                  vibe === v
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Slide Count */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Number of slides
          </label>
          <div className="flex gap-3">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setSlideCount(n)}
                className={cn(
                  'w-14 h-14 rounded-lg border text-lg font-bold transition',
                  slideCount === n
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={description.length < 10}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-3 text-lg"
        >
          <Sparkles className="w-6 h-6" />
          Generate Playlist
        </button>
      </div>
    );
  }

  // Step 2: Generating
  if (step === 'generating') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Creating Your Playlist</h2>
        <p className="text-gray-400 text-lg mb-6">{progressMessages[progressIdx]}</p>
        <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{ width: `${((progressIdx + 1) / progressMessages.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Step 4: Saved
  if (step === 'saved') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Playlist Created!</h2>
        <p className="text-gray-400 mb-8">
          "{playlistName}" is ready with {slides.filter((s) => s.status === 'completed').length} slides.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/playlists"
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
          >
            <ListMusic className="w-5 h-5" />
            View Playlists
          </a>
          <button
            onClick={() => {
              setStep('describe');
              setSlides([]);
              setDescription('');
              setIndustry(null);
              setVibe(null);
              setSavedPlaylistId(null);
            }}
            className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
            Create Another
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Preview
  const completedSlides = slides.filter((s) => s.status === 'completed' && s.backgroundUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep('describe')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Preview Your Playlist</h2>
            <p className="text-sm text-gray-400">
              {completedSlides.length} slides ready — click text to edit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Playlist Name */}
          <input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="Playlist name"
          />
          <button
            onClick={handleSavePlaylist}
            disabled={saving || completedSlides.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Playlist
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group"
          >
            {/* Slide Preview */}
            <div className="aspect-video relative bg-gray-900">
              {slide.status === 'completed' && slide.backgroundUrl ? (
                <>
                  <img
                    src={slide.backgroundUrl}
                    alt={slide.headline}
                    className="w-full h-full object-cover"
                  />
                  {/* Text overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {editingSlide === index ? (
                      <div className="space-y-2">
                        <input
                          value={slide.headline}
                          onChange={(e) => updateSlideText(index, 'headline', e.target.value)}
                          className="w-full bg-black/50 border border-white/30 rounded px-2 py-1 text-white font-bold text-lg focus:outline-none focus:border-purple-400"
                          autoFocus
                        />
                        <input
                          value={slide.subheadline}
                          onChange={(e) => updateSlideText(index, 'subheadline', e.target.value)}
                          className="w-full bg-black/50 border border-white/30 rounded px-2 py-1 text-white/80 text-sm focus:outline-none focus:border-purple-400"
                        />
                        <button
                          onClick={() => setEditingSlide(null)}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          Done editing
                        </button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => setEditingSlide(index)}
                      >
                        <h3
                          className="font-bold text-lg leading-tight mb-1"
                          style={{ color: slide.textColor || '#FFFFFF' }}
                        >
                          {slide.headline}
                        </h3>
                        <p
                          className="text-sm opacity-80"
                          style={{ color: slide.textColor || '#FFFFFF' }}
                        >
                          {slide.subheadline}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : slide.status === 'failed' ? (
                <div className="flex items-center justify-center h-full text-red-400 text-sm">
                  Failed to generate
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Slide Meta */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-purple-400 uppercase">
                  {slide.purpose}
                </span>
                <span className="text-xs text-gray-600">|</span>
                <span className="text-xs text-gray-500">{slide.transition}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingSlide(editingSlide === index ? null : index)}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition"
                  title="Edit text"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transition Flow */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">Playback Order</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <div key={index} className="flex items-center gap-2 flex-shrink-0">
              <div className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium',
                slide.status === 'completed'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-gray-700 text-gray-500'
              )}>
                {index + 1}. {slide.headline.substring(0, 20)}{slide.headline.length > 20 ? '...' : ''}
              </div>
              {index < slides.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
