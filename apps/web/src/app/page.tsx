'use client';

import Link from 'next/link';
import { Monitor, Zap, ArrowRight, Layers, Wand2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">tD</span>
          </div>
          <span className="text-xl font-bold">truDigital</span>
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
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 mb-6">
            <Wand2 className="w-4 h-4 text-brand-400" />
            <span className="text-brand-400 text-sm font-medium">AI-Powered Digital Signage</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Digital Signage{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">
              For All
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Create stunning content for your displays in seconds with AI.
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
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-brand-500/50 transition">
            <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center mb-4">
              <Wand2 className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Creation</h3>
            <p className="text-gray-400">
              Describe what you want in plain English. Our AI generates professional
              images and designs tailored for your displays.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-brand-500/50 transition">
            <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center mb-4">
              <Monitor className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Location Ready</h3>
            <p className="text-gray-400">
              Manage displays across all your locations from one dashboard.
              Landscape, portrait, ultra-wide - any screen, anywhere.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-brand-500/50 transition">
            <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-gray-400">
              Schedule content for specific times and days. Morning menu,
              happy hour specials, weekend promos - all automated.
            </p>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-24 text-center">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-6">Trusted by businesses everywhere</p>
          <div className="flex items-center justify-center gap-12 opacity-50">
            <div className="text-2xl font-bold text-gray-600">Restaurant</div>
            <div className="text-2xl font-bold text-gray-600">Retail</div>
            <div className="text-2xl font-bold text-gray-600">Corporate</div>
            <div className="text-2xl font-bold text-gray-600">Healthcare</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">tD</span>
            </div>
            <span className="text-gray-400 font-medium">truDigital</span>
          </div>
          <p className="text-gray-500">&copy; 2024 truDigital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
