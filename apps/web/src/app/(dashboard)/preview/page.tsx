'use client';

import { useState, useEffect, useRef } from 'react';
import { displays, playlists, content as contentApi } from '@/lib/api';
import {
  Monitor,
  Smartphone,
  Tablet,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  RotateCw,
  Settings,
  X,
  ChevronDown,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Display {
  id: string;
  name: string;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  width: number;
  height: number;
  playlist?: {
    id: string;
    name: string;
    items: PlaylistItem[];
  };
}

interface PlaylistItem {
  id: string;
  order: number;
  duration: number;
  transition: string;
  content: {
    id: string;
    name: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
  };
}

interface Content {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

const DISPLAY_SIZES = [
  { name: 'TV (16:9)', width: 1920, height: 1080, icon: Monitor },
  { name: 'Digital Sign (9:16)', width: 1080, height: 1920, icon: Smartphone },
  { name: 'Square', width: 1080, height: 1080, icon: Tablet },
  { name: 'Ultra-wide', width: 2560, height: 1080, icon: Monitor },
  { name: 'Tablet', width: 1024, height: 768, icon: Tablet },
];

export default function PreviewPage() {
  const [displayList, setDisplayList] = useState<Display[]>([]);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<Display | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDisplayPicker, setShowDisplayPicker] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [previewSize, setPreviewSize] = useState(DISPLAY_SIZES[0]);
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');

  const previewRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (playing && selectedDisplay?.playlist?.items?.length) {
      const currentItem = selectedDisplay.playlist.items[currentIndex];
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % selectedDisplay.playlist!.items.length);
      }, (currentItem?.duration || 10) * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, currentIndex, selectedDisplay]);

  const loadData = async () => {
    try {
      const [displaysRes, contentRes] = await Promise.all([
        displays.list(),
        contentApi.list(),
      ]);
      setDisplayList(displaysRes.data.displays || []);
      setContentList(contentRes.data.content || []);

      // Auto-select first display with a playlist
      const displayWithPlaylist = (displaysRes.data.displays || []).find((d: Display) => d.playlist);
      if (displayWithPlaylist) {
        setSelectedDisplay(displayWithPlaylist);
        setPreviewSize(DISPLAY_SIZES.find(s =>
          (s.width === displayWithPlaylist.width && s.height === displayWithPlaylist.height) ||
          (displayWithPlaylist.orientation === 'PORTRAIT' && s.height === displayWithPlaylist.width && s.width === displayWithPlaylist.height)
        ) || DISPLAY_SIZES[0]);
        setOrientation(displayWithPlaylist.orientation);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load displays');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!previewRef.current) return;

    if (!document.fullscreenElement) {
      previewRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePlay = () => setPlaying(!playing);
  const nextSlide = () => {
    if (selectedDisplay?.playlist?.items?.length) {
      setCurrentIndex(prev => (prev + 1) % selectedDisplay.playlist!.items.length);
    }
  };
  const prevSlide = () => {
    if (selectedDisplay?.playlist?.items?.length) {
      setCurrentIndex(prev => (prev - 1 + selectedDisplay.playlist!.items.length) % selectedDisplay.playlist!.items.length);
    }
  };

  const getCurrentContent = () => {
    if (selectedContent) return selectedContent;
    if (selectedDisplay?.playlist?.items?.[currentIndex]) {
      return selectedDisplay.playlist.items[currentIndex].content;
    }
    return null;
  };

  const getPreviewDimensions = () => {
    const containerWidth = 900;
    const containerHeight = 600;

    let targetWidth = orientation === 'PORTRAIT' ? previewSize.height : previewSize.width;
    let targetHeight = orientation === 'PORTRAIT' ? previewSize.width : previewSize.height;

    const aspectRatio = targetWidth / targetHeight;
    let width, height;

    if (aspectRatio > containerWidth / containerHeight) {
      width = containerWidth;
      height = width / aspectRatio;
    } else {
      height = containerHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  };

  const content = getCurrentContent();
  const dimensions = getPreviewDimensions();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Preview</h1>
          <p className="text-gray-400 mt-1">
            Preview how content looks on different displays
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Preview Panel */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="bg-gray-800 rounded-t-xl p-4 border border-gray-700 border-b-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Display Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDisplayPicker(!showDisplayPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span className="text-white text-sm">
                    {selectedDisplay?.name || 'Select Display'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showDisplayPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-20 py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Your Displays
                    </div>
                    {displayList.length === 0 ? (
                      <div className="px-3 py-4 text-gray-500 text-sm text-center">
                        No displays configured
                      </div>
                    ) : (
                      displayList.map(display => (
                        <button
                          key={display.id}
                          onClick={() => {
                            setSelectedDisplay(display);
                            setSelectedContent(null);
                            setCurrentIndex(0);
                            setShowDisplayPicker(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition text-left',
                            selectedDisplay?.id === display.id && 'bg-gray-700'
                          )}
                        >
                          <Monitor className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-white text-sm">{display.name}</div>
                            <div className="text-gray-500 text-xs">
                              {display.width}x{display.height} • {display.playlist?.name || 'No playlist'}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    <div className="border-t border-gray-700 mt-2 pt-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Standard Sizes
                    </div>
                    {DISPLAY_SIZES.map(size => (
                      <button
                        key={size.name}
                        onClick={() => {
                          setPreviewSize(size);
                          setSelectedDisplay(null);
                          setShowDisplayPicker(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition text-left"
                      >
                        <size.icon className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-white text-sm">{size.name}</div>
                          <div className="text-gray-500 text-xs">{size.width}x{size.height}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Orientation Toggle */}
              <button
                onClick={() => setOrientation(o => o === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE')}
                className={cn(
                  'p-2 rounded-lg transition',
                  orientation === 'PORTRAIT' ? 'bg-brand-500/20 text-brand-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                )}
                title={`Switch to ${orientation === 'LANDSCAPE' ? 'Portrait' : 'Landscape'}`}
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Content Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowContentPicker(!showContentPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white text-sm">
                    {selectedContent?.name || 'Preview Content'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showContentPicker && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-20 max-h-80 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-800 px-3 py-2 border-b border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        Content Library
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setSelectedContent(null);
                          setShowContentPicker(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition text-left"
                      >
                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm">Use Playlist</div>
                          <div className="text-gray-500 text-xs">Play through playlist items</div>
                        </div>
                      </button>
                      {contentList.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedContent(item);
                            setShowContentPicker(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition text-left',
                            selectedContent?.id === item.id && 'bg-gray-700'
                          )}
                        >
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt=""
                            className="w-10 h-10 rounded object-cover bg-gray-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{item.name}</div>
                            <div className="text-gray-500 text-xs">{item.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              {selectedDisplay?.playlist?.items && selectedDisplay.playlist.items.length > 0 && !selectedContent && (
                <>
                  <button
                    onClick={prevSlide}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    <SkipBack className="w-4 h-4 text-gray-300" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className={cn(
                      'p-2 rounded-lg transition',
                      playing ? 'bg-brand-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    )}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    <SkipForward className="w-4 h-4 text-gray-300" />
                  </button>
                  <div className="px-3 text-sm text-gray-400">
                    {currentIndex + 1} / {selectedDisplay!.playlist!.items!.length}
                  </div>
                </>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition ml-2"
                title="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div
            ref={previewRef}
            className="bg-gray-900 rounded-b-xl border border-gray-700 border-t-0 flex items-center justify-center p-8 min-h-[650px]"
            style={{ background: 'repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 20px 20px' }}
          >
            {content ? (
              <div
                className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
                style={{
                  width: dimensions.width,
                  height: dimensions.height,
                }}
              >
                {content.type === 'VIDEO' ? (
                  <video
                    src={content.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={content.url}
                    alt={content.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Content Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="text-white font-medium">{content.name}</div>
                  {selectedDisplay?.playlist && !selectedContent && (
                    <div className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {selectedDisplay.playlist.items[currentIndex]?.duration || 10}s
                    </div>
                  )}
                </div>

                {/* Display Frame */}
                <div className="absolute inset-0 border-4 border-gray-800 rounded-lg pointer-events-none" />
              </div>
            ) : (
              <div className="text-center">
                <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a display or content to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Playlist Items */}
        {selectedDisplay?.playlist?.items && selectedDisplay.playlist.items.length > 0 && (
          <div className="w-72 bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">{selectedDisplay.playlist.name}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {selectedDisplay.playlist.items.length} items
              </p>
            </div>

            <div className="p-2 max-h-[550px] overflow-y-auto space-y-1">
              {selectedDisplay.playlist.items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentIndex(index);
                    setSelectedContent(null);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-lg transition text-left',
                    currentIndex === index && !selectedContent
                      ? 'bg-brand-500/20 border border-brand-500/50'
                      : 'hover:bg-gray-700 border border-transparent'
                  )}
                >
                  <div className="relative">
                    <img
                      src={item.content.thumbnailUrl || item.content.url}
                      alt=""
                      className="w-12 h-12 rounded object-cover bg-gray-700"
                    />
                    {currentIndex === index && !selectedContent && playing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{item.content.name}</div>
                    <div className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}s
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    #{index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Preview Tips</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="text-white font-medium mb-1">Test Different Sizes</h4>
            <p className="text-gray-400">
              Switch between display sizes to see how content adapts to different aspect ratios
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Check Readability</h4>
            <p className="text-gray-400">
              Use fullscreen mode to verify text and images are visible from a distance
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Preview Flow</h4>
            <p className="text-gray-400">
              Play through your playlist to ensure transitions and timing feel right
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
