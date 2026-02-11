'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Wand2,
  Loader2,
  Download,
  Save,
  RefreshCw,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  Pencil,
  ImageIcon,
  Brain,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generate, content } from '@/lib/api';
import { cn } from '@/lib/utils';
import EnhancedEditor from '@/components/editor/EnhancedEditor';
import CanvaIntegration from '@/components/editor/CanvaIntegration';
import AutoDesign from '@/components/studio/AutoDesign';
import TemplateAI from '@/components/studio/TemplateAI';

const PRESETS = [
  { id: 'landscape-standard', name: 'Landscape', icon: Monitor, size: '1344×768', width: 1344, height: 768 },
  { id: 'portrait-standard', name: 'Portrait', icon: Smartphone, size: '768×1344', width: 768, height: 1344 },
  { id: 'landscape-wide', name: 'Ultra Wide', icon: Monitor, size: '1536×640', width: 1536, height: 640 },
  { id: 'square', name: 'Square', icon: Square, size: '1024×1024', width: 1024, height: 1024 },
];

const STYLES = [
  { id: 'photographic', name: 'Photographic' },
  { id: 'digital-art', name: 'Digital Art' },
  { id: 'cinematic', name: 'Cinematic' },
  { id: '3d-model', name: '3D Render' },
  { id: 'neon-punk', name: 'Neon' },
];

const QUALITY_TIERS = [
  { id: 'standard', name: 'Standard', description: 'SDXL - Fast & reliable', badge: null },
  { id: 'ultra', name: 'Ultra', description: 'SD3.5 Large - Best quality', badge: 'PRO' },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

interface Enhancement {
  reasoning: string;
  suggestedStyle: string;
  tags: string[];
  enhancedPrompt: string;
}

type Tab = 'generate' | 'autodesign' | 'templateai' | 'editor';

export default function StudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial tab from URL or default to 'generate'
  const initialTab = (searchParams.get('tab') as Tab) || 'generate';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [prompt, setPrompt] = useState('');

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/studio?tab=${tab}`, { scroll: false });
  };
  const [preset, setPreset] = useState('landscape-standard');
  const [style, setStyle] = useState('photographic');
  const [quality, setQuality] = useState<'standard' | 'ultra'>('standard');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editorLayers, setEditorLayers] = useState<{ logo?: string; text?: string } | null>(null);
  const [smartPrompts, setSmartPrompts] = useState(true);
  const [enhancement, setEnhancement] = useState<Enhancement | null>(null);
  const [showEnhancement, setShowEnhancement] = useState(false);

  // Library picker state
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [libraryContent, setLibraryContent] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const currentPreset = PRESETS.find(p => p.id === preset) || PRESETS[0];

  // Fetch library content
  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const response = await content.list();
      const images = (response.data.content || []).filter(
        (item: any) => item.type === 'IMAGE'
      );
      setLibraryContent(images);
    } catch (error) {
      console.error('Failed to fetch library:', error);
      toast.error('Failed to load content library');
    } finally {
      setLibraryLoading(false);
    }
  };

  const openLibraryPicker = () => {
    setShowLibraryPicker(true);
    fetchLibrary();
  };

  const selectFromLibrary = (item: any) => {
    const imageUrl = item.url.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.url}`
      : item.url;
    setEditorImage(imageUrl);
    setShowLibraryPicker(false);
    toast.success(`Loaded "${item.name}"`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setImages([]);
    setEnhancement(null);

    try {
      const { data } = await generate.create({
        prompt,
        preset,
        style,
        quality,
        samples: 4,
        saveToLibrary: false,
        enhance: smartPrompts,
      });

      if (data.success && data.generation.images) {
        setImages(data.generation.images);
        setSelectedImage(data.generation.images[0]);

        // Store enhancement info if available
        if (data.generation.enhancement) {
          setEnhancement({
            ...data.generation.enhancement,
            enhancedPrompt: data.generation.enhancedPrompt
          });
          setShowEnhancement(true);
        }

        toast.success(smartPrompts ? 'Images generated with AI enhancement!' : 'Images generated!');
      } else {
        toast.error('Generation failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async (image: GeneratedImage) => {
    try {
      await generate.create({
        prompt: image.prompt || prompt,
        preset,
        style,
        quality,
        samples: 1,
        saveToLibrary: true,
      });
      toast.success('Saved to library!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `trudigital-${Date.now()}.png`;
    link.click();
  };

  const handleEditInCanvas = (image: GeneratedImage) => {
    setEditorImage(image.url);
    handleTabChange('editor');
  };

  const handleSaveFromEditor = async (dataUrl: string): Promise<void> => {
    console.log('handleSaveFromEditor called');
    console.log('dataUrl length:', dataUrl?.length);
    console.log('dataUrl prefix:', dataUrl?.substring(0, 60));

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      toast.error('Invalid image data');
      console.error('Invalid dataUrl:', dataUrl);
      throw new Error('Invalid image data');
    }

    const name = window.prompt('Name your design:', `Design ${new Date().toLocaleDateString()}`);
    if (!name) {
      console.log('User cancelled name prompt');
      return;
    }

    try {
      console.log('Uploading with name:', name);
      toast.loading('Saving to library...', { id: 'save-design' });

      const { data } = await content.upload(dataUrl, name);
      console.log('Upload response:', data);

      if (data.success) {
        toast.success('Saved to Content Library!', { id: 'save-design' });
      } else {
        toast.error(data.error || 'Failed to save', { id: 'save-design' });
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to save design', { id: 'save-design' });
      throw error;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wand2 className="w-7 h-7 text-brand-400" />
            AI Studio
          </h1>
          <p className="text-gray-400 mt-1">
            Generate and design custom images for your digital signage
          </p>
        </div>

        {/* Tabs + Canva Button */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('generate')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                activeTab === 'generate'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
            <button
              onClick={() => handleTabChange('autodesign')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition relative',
                activeTab === 'autodesign'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Wand2 className="w-4 h-4" />
              Auto-Design
            </button>
            <button
              onClick={() => handleTabChange('templateai')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition relative',
                activeTab === 'templateai'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Template AI
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-[10px] font-bold text-black rounded">
                NEW
              </span>
            </button>
            <button
              onClick={() => handleTabChange('editor')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                activeTab === 'editor'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Pencil className="w-4 h-4" />
              Editor
            </button>
          </div>

          {/* Prominent Canva Button */}
          <CanvaIntegration
            width={currentPreset.width}
            height={currentPreset.height}
            onDesignComplete={(dataUrl) => {
              setEditorImage(dataUrl);
              handleTabChange('editor');
            }}
          />
        </div>
      </div>

      {activeTab === 'templateai' ? (
        /* Template AI Tab */
        <TemplateAI preset={preset} />
      ) : activeTab === 'autodesign' ? (
        /* Auto-Design Tab */
        <AutoDesign
          preset={preset}
          onSelectDesign={(imageUrl, layers) => {
            setEditorImage(imageUrl);
            setEditorLayers(layers || null);
            handleTabChange('editor');
          }}
        />
      ) : activeTab === 'generate' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Prompt */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Describe your image
                </label>
                <button
                  onClick={() => setSmartPrompts(!smartPrompts)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                    smartPrompts
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-gray-700 text-gray-400 border border-gray-600'
                  )}
                >
                  <Brain className="w-4 h-4" />
                  Smart Prompts {smartPrompts ? 'ON' : 'OFF'}
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={smartPrompts
                  ? "Just describe what you want - AI will enhance your prompt automatically..."
                  : "Summer sale promotion with beach theme, palm trees, and sunset colors..."
                }
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition resize-none"
              />
              {smartPrompts && (
                <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  AI will analyze your request and create an optimized prompt for better results
                </p>
              )}
            </div>

            {/* Enhancement Details */}
            {enhancement && (
              <div className="bg-purple-900/20 rounded-xl border border-purple-500/30 overflow-hidden">
                <button
                  onClick={() => setShowEnhancement(!showEnhancement)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-purple-300">AI Enhancement Applied</span>
                  </div>
                  {showEnhancement ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  )}
                </button>
                {showEnhancement && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-xs text-purple-400 uppercase tracking-wide mb-1">Reasoning</p>
                      <p className="text-sm text-gray-300">{enhancement.reasoning}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-400 uppercase tracking-wide mb-1">Enhanced Prompt</p>
                      <p className="text-sm text-gray-400 bg-gray-900/50 rounded p-2">{enhancement.enhancedPrompt}</p>
                    </div>
                    {enhancement.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {enhancement.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Preset */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Display Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border transition',
                      preset === p.id
                        ? 'bg-brand-500/20 border-brand-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    <p.icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs opacity-60">{p.size}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm font-medium transition',
                      style === s.id
                        ? 'bg-brand-500/20 border-brand-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Tier */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Quality
              </label>
              <div className="grid grid-cols-2 gap-3">
                {QUALITY_TIERS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuality(q.id as 'standard' | 'ultra')}
                    className={cn(
                      'relative flex flex-col items-start p-4 rounded-lg border transition',
                      quality === q.id
                        ? 'bg-brand-500/20 border-brand-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    {q.badge && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded">
                        {q.badge}
                      </span>
                    )}
                    <span className="font-medium">{q.name}</span>
                    <span className="text-xs opacity-60 mt-1">{q.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-brand-500 to-blue-500 hover:from-brand-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Images
                </>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Selected Image */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="aspect-video relative bg-gray-900 flex items-center justify-center">
                {selectedImage ? (
                  <Image
                    src={selectedImage.url}
                    alt="Generated image"
                    fill
                    className="object-contain"
                  />
                ) : loading ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Creating your images...</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your generated images will appear here</p>
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="flex items-center justify-between p-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 truncate flex-1 mr-4">
                    {prompt}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditInCanvas(selectedImage)}
                      className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition text-sm"
                      title="Edit in Canvas"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownload(selectedImage)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSaveToLibrary(selectedImage)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title="Save to Library"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={cn(
                      'aspect-video rounded-lg overflow-hidden border-2 transition',
                      selectedImage?.id === image.id
                        ? 'border-brand-500'
                        : 'border-transparent hover:border-gray-600'
                    )}
                  >
                    <Image
                      src={image.url}
                      alt="Generated thumbnail"
                      width={200}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Prompts */}
            {!images.length && !loading && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-4">
                  Try these prompts
                </h3>
                <div className="space-y-2">
                  {[
                    'Summer sale promotion with beach vibes and tropical colors',
                    'Welcome message for corporate lobby with modern minimalist design',
                    'Restaurant menu special featuring gourmet burger with fries',
                    'Holiday event announcement with festive decorations',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="w-full text-left px-4 py-3 bg-gray-900 hover:bg-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Editor Tab */
        <div className="space-y-6">
          {/* Editor Controls */}
          {!editorImage && (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Start with an image</h3>
              <p className="text-gray-400 mb-6">
                Generate an AI image, use from library, start blank, or design in Canva
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => handleTabChange('generate')}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate with AI
                </button>
                <button
                  onClick={openLibraryPicker}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <FolderOpen className="w-5 h-5" />
                  From Library
                </button>
                <button
                  onClick={() => setEditorImage('')}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition"
                >
                  <Square className="w-5 h-5" />
                  Blank Canvas
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                Or use the "Edit in Canva" button above to design in Canva
              </p>
            </div>
          )}

          {/* Canvas Size Selector (when no image) */}
          {editorImage === '' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Canvas Size
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border transition',
                      preset === p.id
                        ? 'bg-brand-500/20 border-brand-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    <p.icon className="w-4 h-4" />
                    <span>{p.name}</span>
                    <span className="text-xs opacity-60">({p.size})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Canvas Editor */}
          {editorImage !== null && (
            <EnhancedEditor
              backgroundImage={editorImage || undefined}
              width={currentPreset.width}
              height={currentPreset.height}
              onSave={handleSaveFromEditor}
              initialLayers={editorLayers || undefined}
            />
          )}
        </div>
      )}

      {/* Library Picker Modal */}
      {showLibraryPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-[700px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-brand-400" />
                Select from Content Library
              </h3>
              <button onClick={() => setShowLibraryPicker(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">Click an image to use it as your canvas background</p>

            <div className="flex-1 overflow-y-auto">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
                </div>
              ) : libraryContent.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No images in your library</p>
                  <p className="text-gray-500 text-sm mt-2">Upload images in the Content section first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {libraryContent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectFromLibrary(item)}
                      className="group relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-500 transition"
                    >
                      <img
                        src={item.url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.url}` : item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <span className="text-white text-sm font-medium truncate w-full">{item.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
