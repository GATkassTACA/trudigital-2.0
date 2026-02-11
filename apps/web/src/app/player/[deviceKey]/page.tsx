'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface PlaylistItem {
  id: string;
  duration: number;
  transition: string;
  order: number;
  content: ContentItem;
}

interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
}

interface DisplayData {
  id: string;
  name: string;
  orientation: string;
  width: number;
  height: number;
  playlist: Playlist | null;
}

export default function PlayerPage() {
  const params = useParams();
  const deviceKey = params.deviceKey as string;

  const [display, setDisplay] = useState<DisplayData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch display data
  const fetchDisplay = useCallback(async () => {
    try {
      const url = `${API_URL}/api/displays/player/${deviceKey}`;
      console.log('[Player] Fetching:', url);

      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setError(`Display not found for key "${deviceKey}". Create a display in the dashboard first.`);
        } else {
          setError(`Server error (${res.status}): ${data.error || 'Unknown error'}`);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setDisplay(data.display);
      setError(null);
      setRetryCount(0);
      setLoading(false);
    } catch (err: any) {
      console.error('[Player] Fetch failed:', err.message);
      // Network error — API unreachable
      const apiUrl = API_URL;
      setError(
        `Cannot reach API at ${apiUrl}. ` +
        (apiUrl.includes('localhost')
          ? 'Make sure the API server is running (npm run dev in apps/api).'
          : 'Check that NEXT_PUBLIC_API_URL is configured correctly.')
      );
      setLoading(false);

      // Auto-retry with backoff
      const delay = Math.min(5000 * Math.pow(1.5, retryCount), 30000);
      setRetryCount((prev) => prev + 1);
      retryRef.current = setTimeout(fetchDisplay, delay);
    }
  }, [deviceKey, retryCount]);

  // Initial fetch and polling
  useEffect(() => {
    fetchDisplay();

    // Poll for playlist updates every 30 seconds (only if connected)
    const pollInterval = setInterval(() => {
      if (!error) fetchDisplay();
    }, 30000);

    // Heartbeat every 60 seconds
    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch(`${API_URL}/api/displays/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceKey })
        });
      } catch (err) {
        // Silent — heartbeat failure is non-critical
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [deviceKey, fetchDisplay, error]);

  // Auto-advance slides
  useEffect(() => {
    if (!display?.playlist?.items?.length) return;

    const items = display.playlist.items;
    const currentItem = items[currentIndex];

    if (!currentItem) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setTransitioning(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTransitioning(false);
      }, 500);
    }, currentItem.duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [display, currentIndex]);

  // Fullscreen on click
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(0);
    fetchDisplay();
  };

  // Get full URL for content
  const getContentUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `${API_URL}${url}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Connecting to display...</p>
          <p className="text-gray-500 mt-2 font-mono text-sm">{deviceKey}</p>
          <p className="text-gray-700 mt-1 text-xs">{API_URL}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-lg px-8">
          {error.includes('Cannot reach') ? (
            <WifiOff className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <p className="text-white text-xl mb-3">
            {error.includes('Cannot reach') ? 'Connection Failed' : 'Display Error'}
          </p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Now
          </button>
          {retryCount > 0 && (
            <p className="text-gray-600 text-xs mt-3">
              Auto-retrying... (attempt {retryCount})
            </p>
          )}
          <p className="text-gray-700 mt-6 font-mono text-xs">Key: {deviceKey}</p>
        </div>
      </div>
    );
  }

  // No playlist assigned
  if (!display?.playlist || !display.playlist.items.length) {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center cursor-pointer"
        onClick={handleFullscreen}
      >
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">{display?.name || 'Display'}</h1>
          <p className="text-gray-400 text-lg">No playlist assigned</p>
          <p className="text-gray-600 mt-4 text-sm">Assign a playlist in the dashboard to start displaying content</p>
          <p className="text-gray-700 mt-8 font-mono text-xs">{deviceKey}</p>
        </div>
      </div>
    );
  }

  const items = display.playlist.items;
  const currentItem = items[currentIndex];
  const contentUrl = getContentUrl(currentItem.content.url);

  return (
    <div
      className="fixed inset-0 bg-black cursor-pointer overflow-hidden"
      onClick={handleFullscreen}
    >
      {/* Current slide */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentItem.content.type === 'IMAGE' ? (
          <img
            src={contentUrl}
            alt={currentItem.content.name}
            className="w-full h-full object-contain"
          />
        ) : currentItem.content.type === 'VIDEO' ? (
          <video
            src={contentUrl}
            autoPlay
            muted
            loop={items.length === 1}
            className="w-full h-full object-contain"
            onEnded={() => {
              if (items.length > 1) {
                setCurrentIndex((prev) => (prev + 1) % items.length);
              }
            }}
          />
        ) : (
          <iframe
            src={contentUrl}
            className="w-full h-full border-0"
            title={currentItem.content.name}
          />
        )}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div
          className="h-full bg-white/30 transition-all"
          style={{
            width: `${((currentIndex + 1) / items.length) * 100}%`
          }}
        />
      </div>

      {/* Debug overlay */}
      <div className="absolute top-4 right-4 text-white/20 text-xs font-mono opacity-0 hover:opacity-100 transition-opacity">
        <p>{display.name}</p>
        <p>{currentIndex + 1} / {items.length}</p>
        <p>{currentItem.duration}s</p>
      </div>
    </div>
  );
}
