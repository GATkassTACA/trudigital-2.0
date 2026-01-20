'use client';

import { useState } from 'react';
import { Palette, ExternalLink, X, Upload } from 'lucide-react';

interface CanvaIntegrationProps {
  onDesignComplete: (imageUrl: string) => void;
  width?: number;
  height?: number;
}

// Canva integration - opens Canva directly, no API key needed
export default function CanvaIntegration({ onDesignComplete, width = 1344, height = 768 }: CanvaIntegrationProps) {
  const [showImport, setShowImport] = useState(false);

  // Canva homepage - user creates design there
  const canvaUrl = 'https://www.canva.com/';

  // Handle import from downloaded Canva design
  const handleCanvaImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onDesignComplete(dataUrl);
      setShowImport(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Direct link to Canva - won't be blocked */}
      <a
        href={canvaUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setShowImport(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition"
      >
        <Palette className="w-5 h-5" />
        Edit in Canva
      </a>

      {/* Import button - always visible */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleCanvaImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition">
          <Upload className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Import Modal - shows after clicking Canva link */}
      {showImport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Import from Canva
              </h2>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 mb-4">
              <p className="text-purple-300 text-sm font-medium">
                Recommended size: {width} x {height} px
              </p>
            </div>

            <ol className="text-gray-300 text-sm space-y-2 mb-6">
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                Click "Create a design" → "Custom size"
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                Enter {width} x {height} pixels
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                Design your signage
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">4.</span>
                Click "Share" → "Download" → PNG
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">5.</span>
                Import below
              </li>
            </ol>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleCanvaImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
                <Upload className="w-5 h-5" />
                Import Downloaded Design
              </button>
            </div>

            <a
              href="https://www.canva.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Canva
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
