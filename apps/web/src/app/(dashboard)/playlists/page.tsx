'use client';

import { useEffect, useState } from 'react';
import {
  ListVideo,
  Plus,
  Trash2,
  Play,
  Monitor,
  Clock,
  ImageIcon,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { playlists, content } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ContentItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  type: string;
}

interface PlaylistItem {
  id: string;
  duration: number;
  order: number;
  content: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
  };
}

interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  _count?: { displays: number };
  createdAt: string;
}

export default function PlaylistsPage() {
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState('');
  const [showContentModal, setShowContentModal] = useState<string | null>(null);
  const [contentLibrary, setContentLibrary] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data } = await playlists.list();
      setItems(data.playlists || []);
    } catch (error) {
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const loadContentLibrary = async () => {
    setLoadingContent(true);
    try {
      const { data } = await content.list();
      setContentLibrary(data.content || []);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoadingContent(false);
    }
  };

  const openContentModal = (playlistId: string) => {
    setShowContentModal(playlistId);
    loadContentLibrary();
  };

  const addContentToPlaylist = async (playlistId: string, contentId: string) => {
    try {
      await playlists.addItem(playlistId, contentId, 10); // 10 second default duration
      toast.success('Content added to playlist!');
      setShowContentModal(null);
      loadPlaylists(); // Refresh to show new item
    } catch (error) {
      toast.error('Failed to add content');
    }
  };

  const removeItemFromPlaylist = async (playlistId: string, itemId: string) => {
    try {
      await playlists.removeItem(playlistId, itemId);
      toast.success('Item removed');
      loadPlaylists();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  const handleAdd = async () => {
    if (!newPlaylist.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    try {
      const { data } = await playlists.create(newPlaylist);
      setItems([...items, { ...data.playlist, items: [], _count: { displays: 0 } }]);
      setShowAddModal(false);
      setNewPlaylist('');
      toast.success('Playlist created!');
    } catch (error) {
      toast.error('Failed to create playlist');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this playlist?')) return;

    try {
      await playlists.delete(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Playlist deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getTotalDuration = (playlist: Playlist) => {
    const seconds = playlist.items.reduce((acc, item) => acc + item.duration, 0);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ListVideo className="w-7 h-7 text-brand-400" />
            Playlists
          </h1>
          <p className="text-gray-400 mt-1">
            Organize content into playlists for your displays
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Playlist
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading playlists...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <ListVideo className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No playlists yet</h3>
          <p className="text-gray-400 mb-6">
            Create a playlist to organize your content
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Playlist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{playlist.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {playlist.items.length} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTotalDuration(playlist)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Monitor className="w-4 h-4" />
                      {playlist._count?.displays || 0} displays
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(playlist.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {playlist.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-24 group relative"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 relative">
                      <img
                        src={getImageUrl(item.content.thumbnailUrl || item.content.url)}
                        alt={item.content.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
                        {item.duration}s
                      </div>
                      <button
                        onClick={() => removeItemFromPlaylist(playlist.id, item.id)}
                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {item.content.name}
                    </p>
                  </div>
                ))}

                {/* Add Content Button */}
                <button
                  onClick={() => openContentModal(playlist.id)}
                  className="flex-shrink-0 w-24 aspect-video rounded-lg border-2 border-dashed border-gray-600 hover:border-brand-500 flex items-center justify-center transition group"
                >
                  <Plus className="w-6 h-6 text-gray-500 group-hover:text-brand-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">New Playlist</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name
              </label>
              <input
                type="text"
                value={newPlaylist}
                onChange={(e) => setNewPlaylist(e.target.value)}
                placeholder="Main Lobby Playlist"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-3 rounded-lg transition"
              >
                Create Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Content to Playlist</h2>
              <button
                onClick={() => setShowContentModal(null)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingContent ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading content...</p>
                </div>
              ) : contentLibrary.length === 0 ? (
                <div className="text-center py-10">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No content in your library</p>
                  <p className="text-gray-500 text-sm mt-2">Generate images in the AI Studio first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {contentLibrary.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addContentToPlaylist(showContentModal, item.id)}
                      className="aspect-video rounded-lg overflow-hidden bg-gray-900 relative group hover:ring-2 hover:ring-brand-500 transition"
                    >
                      <img
                        src={getImageUrl(item.thumbnailUrl || item.url)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{item.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
