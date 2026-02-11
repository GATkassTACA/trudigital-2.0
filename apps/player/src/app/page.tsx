'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const DEFAULT_DURATION = 10; // 10 seconds per slide if not specified

interface TransitionData {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration?: number;
  easing?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface ContentItem {
  id: string;
  duration: number;
  order: number;
  transition?: string;
  transitionData?: TransitionData;
  content: {
    id: string;
    name: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
  };
}

interface PlaylistData {
  id: string;
  name: string;
  items: ContentItem[];
}

interface DisplayData {
  id: string;
  name: string;
  playlist?: PlaylistData;
}

// Parse legacy transition string into structured data
function parseTransition(item: ContentItem): TransitionData {
  if (item.transitionData) return item.transitionData;

  // Backward compat: parse the old string field
  const t = item.transition || 'fade';
  switch (t) {
    case 'fade': return { type: 'fade', duration: 800, easing: 'power2.inOut' };
    case 'slide': case 'slide-left': return { type: 'slide', direction: 'left', duration: 800, easing: 'power2.inOut' };
    case 'slide-right': return { type: 'slide', direction: 'right', duration: 800, easing: 'power2.inOut' };
    case 'slide-up': return { type: 'slide', direction: 'up', duration: 800, easing: 'power2.inOut' };
    case 'slide-down': return { type: 'slide', direction: 'down', duration: 800, easing: 'power2.inOut' };
    case 'zoom': return { type: 'zoom', duration: 800, easing: 'power2.inOut' };
    case 'none': return { type: 'none', duration: 0 };
    default: return { type: 'fade', duration: 800, easing: 'power2.inOut' };
  }
}

function SlideContent({ item }: { item: ContentItem }) {
  if (item.content.type === 'VIDEO') {
    return (
      <video
        src={item.content.url}
        className="w-full h-full object-contain"
        autoPlay
        muted
        loop
      />
    );
  }

  return (
    <Image
      src={item.content.url}
      alt={item.content.name}
      fill
      className="object-contain"
      priority
    />
  );
}

export default function PlayerPage() {
  const [deviceKey, setDeviceKey] = useState<string | null>(null);
  const [display, setDisplay] = useState<DisplayData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSlideRef = useRef<HTMLDivElement>(null);
  const nextSlideRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);

  // Get device key from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (key) {
      setDeviceKey(key);
    } else {
      setError('No device key provided. Add ?key=YOUR_DEVICE_KEY to the URL');
      setLoading(false);
    }
  }, []);

  // Fetch display data
  const fetchDisplay = useCallback(async () => {
    if (!deviceKey) return;

    try {
      const response = await fetch(`${API_URL}/api/displays/player/${deviceKey}`);
      if (!response.ok) {
        throw new Error('Display not found or not authorized');
      }
      const data = await response.json();
      setDisplay(data.display);
      setIsOnline(true);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch display:', err);
      setIsOnline(false);
      if (!display) {
        setError('Failed to connect to server. Check your device key.');
      }
    } finally {
      setLoading(false);
    }
  }, [deviceKey, display]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!deviceKey) return;

    try {
      await fetch(`${API_URL}/api/displays/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceKey }),
      });
      setIsOnline(true);
    } catch (err) {
      console.error('Heartbeat failed:', err);
      setIsOnline(false);
    }
  }, [deviceKey]);

  // Initial fetch and heartbeat setup
  useEffect(() => {
    if (!deviceKey) return;

    fetchDisplay();
    sendHeartbeat();

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    const refreshInterval = setInterval(fetchDisplay, 300000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      clearInterval(refreshInterval);
    };
  }, [deviceKey, fetchDisplay, sendHeartbeat]);

  // GSAP transition function
  const performTransition = useCallback((items: ContentItem[]) => {
    if (isTransitioning.current || !currentSlideRef.current || !nextSlideRef.current) return;
    isTransitioning.current = true;

    const current = currentSlideRef.current;
    const next = nextSlideRef.current;

    // Get transition config from the NEXT item (the one we're transitioning TO)
    const nextItem = items[nextIndex];
    const config = parseTransition(nextItem);
    const durationSec = (config.duration || 800) / 1000;
    const ease = config.easing || 'power2.inOut';

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % items.length);
        gsap.set(current, { clearProps: 'all', opacity: 1 });
        gsap.set(next, { clearProps: 'all', opacity: 0 });
        isTransitioning.current = false;
      }
    });

    switch (config.type) {
      case 'fade':
        tl.to(current, { opacity: 0, duration: durationSec, ease })
          .fromTo(next, { opacity: 0 }, { opacity: 1, duration: durationSec, ease }, 0);
        break;

      case 'slide': {
        const dir = config.direction || 'left';
        const xOut = dir === 'left' ? '-100%' : dir === 'right' ? '100%' : '0';
        const yOut = dir === 'up' ? '-100%' : dir === 'down' ? '100%' : '0';
        const xIn = dir === 'left' ? '100%' : dir === 'right' ? '-100%' : '0';
        const yIn = dir === 'up' ? '100%' : dir === 'down' ? '-100%' : '0';
        tl.set(next, { opacity: 1 })
          .to(current, { x: xOut, y: yOut, duration: durationSec, ease })
          .fromTo(next, { x: xIn, y: yIn }, { x: '0', y: '0', duration: durationSec, ease }, 0);
        break;
      }

      case 'zoom':
        tl.to(current, { scale: 0.8, opacity: 0, duration: durationSec, ease })
          .fromTo(next, { scale: 1.2, opacity: 0 }, { scale: 1, opacity: 1, duration: durationSec, ease }, 0);
        break;

      default: // 'none' or unknown
        tl.set(current, { opacity: 0 }).set(next, { opacity: 1 });
    }
  }, [nextIndex]);

  // Content rotation with GSAP transitions
  useEffect(() => {
    const items = display?.playlist?.items;
    if (!items?.length || items.length < 2) return;

    const currentItem = items[currentIndex];
    const duration = (currentItem?.duration || DEFAULT_DURATION) * 1000;

    slideTimerRef.current = setTimeout(() => {
      performTransition(items);
    }, duration);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [currentIndex, display, performTransition]);

  // Single item — no transitions needed, just display it
  useEffect(() => {
    const items = display?.playlist?.items;
    if (!items?.length || items.length !== 1) return;
    // Nothing to rotate, single item stays on screen
  }, [display]);

  // Loading state
  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Connecting...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // No playlist assigned
  if (!display?.playlist?.items?.length) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">{display?.name || 'Display'}</h1>
          <p className="text-gray-400 text-lg">No playlist assigned</p>
          <p className="text-gray-500 text-sm mt-4">
            Assign a playlist to this display in the dashboard
          </p>
          {!isOnline && (
            <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Offline Mode
            </div>
          )}
        </div>
      </div>
    );
  }

  // Display content with GSAP transitions
  const items = display.playlist.items;

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      {/* Status indicator */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
      </div>

      {/* Current slide */}
      <div ref={currentSlideRef} className="absolute inset-0">
        {items[currentIndex] && <SlideContent item={items[currentIndex]} />}
      </div>

      {/* Next slide (hidden, used for transitions) */}
      {items.length > 1 && (
        <div ref={nextSlideRef} className="absolute inset-0 opacity-0">
          {items[nextIndex] && <SlideContent item={items[nextIndex]} />}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-blue-500 transition-all ease-linear"
          style={{
            width: `${((currentIndex + 1) / items.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
