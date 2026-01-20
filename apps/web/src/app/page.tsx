'use client';

import Link from 'next/link';
import { Sparkles, Monitor, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-brand-400" />
          <span className="text-xl font-bold">TruDigital AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white transition">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Create Stunning Signage with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-400">
              AI
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Generate custom images for your digital displays in seconds.
            No design skills needed. Just describe what you want.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-brand-500 hover:bg-brand-600 px-8 py-4 rounded-lg font-medium text-lg transition flex items-center gap-2"
            >
              Start Creating <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-lg font-medium text-lg transition"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Demo Image */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10" />
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-gray-400 font-mono text-sm">
                <span className="text-brand-400">prompt:</span> "Summer sale promotion with beach theme, palm trees, sunset colors"
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-400">
              Describe what you want in plain English. Our AI generates professional
              images tailored for your displays.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Monitor className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Signage-Ready</h3>
            <p className="text-gray-400">
              Images are generated at the right sizes for your displays.
              Landscape, portrait, ultra-wide - we've got you covered.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Deploy</h3>
            <p className="text-gray-400">
              Push content directly to your displays with one click.
              Schedule playlists and manage everything from one dashboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500">
        <p>&copy; 2024 TruDigital AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
