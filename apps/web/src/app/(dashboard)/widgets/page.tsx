'use client';

import { useState } from 'react';
import {
  Cloud,
  Clock,
  Rss,
  Timer,
  QrCode,
  Type,
  Settings,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import { cn } from '@/lib/utils';

const WIDGET_TYPES = [
  { id: 'weather', name: 'Weather', icon: Cloud, available: true },
  { id: 'clock', name: 'Clock', icon: Clock, available: false },
  { id: 'rss', name: 'RSS Feed', icon: Rss, available: false },
  { id: 'countdown', name: 'Countdown', icon: Timer, available: false },
  { id: 'qrcode', name: 'QR Code', icon: QrCode, available: false },
  { id: 'marquee', name: 'Marquee', icon: Type, available: false },
];

export default function WidgetsPage() {
  const [selectedWidget, setSelectedWidget] = useState('weather');
  const [copied, setCopied] = useState(false);

  // Weather widget settings
  const [weatherSettings, setWeatherSettings] = useState({
    location: 'New York',
    units: 'imperial' as 'imperial' | 'metric',
    style: 'full' as 'full' | 'compact' | 'minimal' | 'forecast',
    theme: 'dark' as 'dark' | 'light' | 'glass',
    showForecast: true,
    forecastDays: 5,
  });

  const copyEmbedCode = () => {
    const code = `<WeatherWidget
  location="${weatherSettings.location}"
  units="${weatherSettings.units}"
  style="${weatherSettings.style}"
  theme="${weatherSettings.theme}"
  showForecast={${weatherSettings.showForecast}}
  forecastDays={${weatherSettings.forecastDays}}
/>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Cloud className="w-7 h-7 text-brand-400" />
          Widgets
        </h1>
        <p className="text-gray-400 mt-1">
          Add dynamic content widgets to your displays
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Widget List */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Available Widgets
          </h2>
          <div className="space-y-2">
            {WIDGET_TYPES.map((widget) => (
              <button
                key={widget.id}
                onClick={() => widget.available && setSelectedWidget(widget.id)}
                disabled={!widget.available}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-xl border transition',
                  selectedWidget === widget.id
                    ? 'bg-brand-500/20 border-brand-500 text-white'
                    : widget.available
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-500 cursor-not-allowed'
                )}
              >
                <widget.icon className="w-5 h-5" />
                <span className="font-medium">{widget.name}</span>
                {!widget.available && (
                  <span className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Preview */}
        <div className="lg:col-span-2 space-y-6">
          {selectedWidget === 'weather' && (
            <>
              {/* Settings */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium text-white">Widget Settings</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Location</label>
                    <input
                      type="text"
                      value={weatherSettings.location}
                      onChange={(e) => setWeatherSettings({ ...weatherSettings, location: e.target.value })}
                      placeholder="City name or lat,lon"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Units */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Units</label>
                    <select
                      value={weatherSettings.units}
                      onChange={(e) => setWeatherSettings({ ...weatherSettings, units: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="imperial">Fahrenheit (°F)</option>
                      <option value="metric">Celsius (°C)</option>
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Style</label>
                    <select
                      value={weatherSettings.style}
                      onChange={(e) => setWeatherSettings({ ...weatherSettings, style: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="full">Full</option>
                      <option value="compact">Compact</option>
                      <option value="minimal">Minimal</option>
                      <option value="forecast">Forecast Only</option>
                    </select>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Theme</label>
                    <select
                      value={weatherSettings.theme}
                      onChange={(e) => setWeatherSettings({ ...weatherSettings, theme: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="glass">Glass</option>
                    </select>
                  </div>

                  {/* Forecast Days */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Forecast Days</label>
                    <select
                      value={weatherSettings.forecastDays}
                      onChange={(e) => setWeatherSettings({ ...weatherSettings, forecastDays: parseInt(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value={3}>3 Days</option>
                      <option value={5}>5 Days</option>
                    </select>
                  </div>

                  {/* Show Forecast */}
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weatherSettings.showForecast}
                        onChange={(e) => setWeatherSettings({ ...weatherSettings, showForecast: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-gray-300">Show Forecast</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={copyEmbedCode}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Embed Code'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="font-medium text-white mb-4">Preview</h3>
                <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-8 rounded-xl">
                  <WeatherWidget
                    location={weatherSettings.location}
                    units={weatherSettings.units}
                    style={weatherSettings.style}
                    theme={weatherSettings.theme}
                    showForecast={weatherSettings.showForecast}
                    forecastDays={weatherSettings.forecastDays}
                  />
                </div>
              </div>

              {/* All Styles Preview */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="font-medium text-white mb-4">All Styles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Minimal</p>
                    <WeatherWidget
                      location={weatherSettings.location}
                      units={weatherSettings.units}
                      style="minimal"
                      theme="dark"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Compact</p>
                    <WeatherWidget
                      location={weatherSettings.location}
                      units={weatherSettings.units}
                      style="compact"
                      theme="dark"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Forecast Only</p>
                    <WeatherWidget
                      location={weatherSettings.location}
                      units={weatherSettings.units}
                      style="forecast"
                      theme="dark"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Glass Theme</p>
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-xl">
                      <WeatherWidget
                        location={weatherSettings.location}
                        units={weatherSettings.units}
                        style="compact"
                        theme="glass"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
