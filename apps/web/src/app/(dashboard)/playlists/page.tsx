'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ListVideo,
  Plus,
  Trash2,
  Play,
  Monitor,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { playlists } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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

              {playlist.items.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {playlist.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-24 group relative"
                    >
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 relative">
                        <Image
                          src={item.content.thumbnailUrl || item.content.url}
                          alt={item.content.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
                          {item.duration}s
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.content.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">
                  No content in this playlist yet. Add content from the Content Library.
                </p>
              )}
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
    </div>
  );
}
