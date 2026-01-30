'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wand2,
  FolderOpen,
  Monitor,
  ListVideo,
  Settings,
  LogOut,
  Menu,
  X,
  Cloud,
  Palette,
  Calendar,
  Eye
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'AI Studio', href: '/studio', icon: Wand2 },
  { name: 'Content Library', href: '/content', icon: FolderOpen },
  { name: 'Widgets', href: '/widgets', icon: Cloud },
  { name: 'Displays', href: '/displays', icon: Monitor },
  { name: 'Playlists', href: '/playlists', icon: ListVideo },
  { name: 'Scheduling', href: '/scheduling', icon: Calendar },
  { name: 'Live Preview', href: '/preview', icon: Eye },
  { name: 'Brand Kit', href: '/brand-kit', icon: Palette },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect after zustand has hydrated from localStorage
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 border-r border-gray-700 transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
            <Link href="/studio" className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">tD</span>
              </div>
              <span className="text-lg font-bold">truDigital</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="px-4 py-4 border-t border-gray-700">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.[0] || user?.email?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.organizationName}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/studio" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">tD</span>
            </div>
            <span className="font-bold">truDigital</span>
          </Link>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
