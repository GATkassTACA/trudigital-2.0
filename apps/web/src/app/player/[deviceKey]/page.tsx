'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, WifiOff, AlertCircle } from 'lucide-react';

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
  const [offline, setOffline] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch display data
  const fetchDisplay = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/displays/player/${deviceKey}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError('Display not found. Check the device key.');
        } else {
          setError('Failed to connect to server');
        }
        return;
      }

      const data = await res.json();
      setDisplay(data.display);
      setError(null);
      setOffline(false);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setOffline(true);
      setLoading(false);
    }
  }, [deviceKey]);

  // Initial fetch and polling
  useEffect(() => {
    fetchDisplay();

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(fetchDisplay, 30000);

    // Heartbeat every 60 seconds
    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch(`${API_URL}/api/displays/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceKey })
        });
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [deviceKey, fetchDisplay]);

  // Auto-advance slides
  useEffect(() => {
    if (!display?.playlist?.items?.length) return;

    const items = display.playlist.items;
    const currentItem = items[currentIndex];

    if (!currentItem) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set timer for next slide
    timerRef.current = setTimeout(() => {
      setTransitioning(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTransitioning(false);
      }, 500); // Transition duration
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
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Display Error</p>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-600 mt-4 font-mono text-sm">{deviceKey}</p>
        </div>
      </div>
    );
  }

  // Offline state
  if (offline) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Connection Lost</p>
          <p className="text-gray-400">Attempting to reconnect...</p>
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

      {/* Progress indicator (subtle) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div
          className="h-full bg-white/30 transition-all"
          style={{
            width: `${((currentIndex + 1) / items.length) * 100}%`
          }}
        />
      </div>

      {/* Debug overlay (hidden in production, show on triple-click) */}
      <div className="absolute top-4 right-4 text-white/20 text-xs font-mono opacity-0 hover:opacity-100 transition-opacity">
        <p>{display.name}</p>
        <p>{currentIndex + 1} / {items.length}</p>
        <p>{currentItem.duration}s</p>
      </div>
    </div>
  );
}
