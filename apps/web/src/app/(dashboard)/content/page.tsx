'use client';

import { useEffect, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  MoreVertical,
  Search,
  Grid,
  List,
  Sparkles,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { content } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import FileUpload from '@/components/FileUpload';

interface ContentItem {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl: string;
  isGenerated: boolean;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data } = await content.list();
      setItems(data.content || []);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?')) return;

    try {
      await content.delete(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Content deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-brand-400" />
            Content Library
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your images and media
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          <Upload className="w-5 h-5" />
          Upload
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUpload(false)} />
          <div className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Upload Files</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-1 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FileUpload
              onUploadComplete={(result) => {
                setItems([result.content, ...items]);
                setShowUpload(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'p-2 rounded-md transition',
              view === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'p-2 rounded-md transition',
              view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading content...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No content yet</h3>
          <p className="text-gray-400 mb-6">
            Generate images in the AI Studio to see them here
          </p>
          <a
            href="/studio"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            <Sparkles className="w-5 h-5" />
            Go to AI Studio
          </a>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition"
            >
              <div className="aspect-video relative bg-gray-900">
                <img
                  src={getImageUrl(item.thumbnailUrl || item.url)}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {item.isGenerated && (
                  <div className="absolute top-2 left-2 bg-brand-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Name</th>
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Type</th>
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Created</th>
                <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded overflow-hidden bg-gray-900 relative">
                        <img
                          src={getImageUrl(item.thumbnailUrl || item.url)}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      {item.isGenerated && <Sparkles className="w-4 h-4 text-brand-400" />}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">{formatDate(item.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
