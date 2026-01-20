'use client';

import { useEffect, useState } from 'react';
import {
  Monitor,
  Plus,
  Wifi,
  WifiOff,
  MoreVertical,
  Trash2,
  Settings,
  Copy,
  ExternalLink,
  Link,
  ListVideo
} from 'lucide-react';
import toast from 'react-hot-toast';
import { displays, playlists } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

interface Playlist {
  id: string;
  name: string;
}

interface Display {
  id: string;
  name: string;
  deviceKey: string;
  orientation: string;
  width: number;
  height: number;
  status: string;
  lastSeenAt: string | null;
  location: string | null;
  playlistId: string | null;
  playlist?: { id: string; name: string } | null;
}

export default function DisplaysPage() {
  const [items, setItems] = useState<Display[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDisplay, setNewDisplay] = useState({ name: '', location: '' });
  const [assigningPlaylist, setAssigningPlaylist] = useState<string | null>(null);

  useEffect(() => {
    loadDisplays();
    loadPlaylists();
  }, []);

  const loadDisplays = async () => {
    try {
      const { data } = await displays.list();
      setItems(data.displays || []);
    } catch (error) {
      toast.error('Failed to load displays');
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const { data } = await playlists.list();
      setAllPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists');
    }
  };

  const assignPlaylist = async (displayId: string, playlistId: string | null) => {
    try {
      await displays.update(displayId, { playlistId });
      setItems(items.map(d =>
        d.id === displayId
          ? { ...d, playlistId, playlist: playlistId ? allPlaylists.find(p => p.id === playlistId) || null : null }
          : d
      ));
      setAssigningPlaylist(null);
      toast.success(playlistId ? 'Playlist assigned!' : 'Playlist removed');
    } catch (error) {
      toast.error('Failed to assign playlist');
    }
  };

  const handleAdd = async () => {
    if (!newDisplay.name.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    try {
      const { data } = await displays.create({
        name: newDisplay.name,
        location: newDisplay.location || undefined,
      });
      setItems([...items, data.display]);
      setShowAddModal(false);
      setNewDisplay({ name: '', location: '' });
      toast.success('Display added!');
    } catch (error) {
      toast.error('Failed to add display');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this display?')) return;

    try {
      await displays.delete(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Display deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const copyDeviceKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Device key copied!');
  };

  const getPlayerUrl = (key: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/player/${key}`;
  };

  const copyPlayerUrl = (key: string) => {
    navigator.clipboard.writeText(getPlayerUrl(key));
    toast.success('Player URL copied!');
  };

  const openPlayer = (key: string) => {
    window.open(getPlayerUrl(key), '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Monitor className="w-7 h-7 text-brand-400" />
            Displays
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your digital signage displays
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Display
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading displays...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No displays yet</h3>
          <p className="text-gray-400 mb-6">
            Add your first display to get started
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Display
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((display) => (
            <div
              key={display.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      display.status === 'ONLINE' ? 'bg-green-500/20' : 'bg-gray-700'
                    )}
                  >
                    <Monitor
                      className={cn(
                        'w-5 h-5',
                        display.status === 'ONLINE' ? 'text-green-400' : 'text-gray-500'
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{display.name}</h3>
                    <p className="text-sm text-gray-500">
                      {display.width}×{display.height} • {display.orientation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(display.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      display.status === 'ONLINE' ? 'text-green-400' : 'text-gray-500'
                    )}
                  >
                    {display.status === 'ONLINE' ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                    {display.status}
                  </span>
                </div>

                {display.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Location</span>
                    <span className="text-white">{display.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Playlist</span>
                  {assigningPlaylist === display.id ? (
                    <select
                      value={display.playlistId || ''}
                      onChange={(e) => assignPlaylist(display.id, e.target.value || null)}
                      onBlur={() => setAssigningPlaylist(null)}
                      autoFocus
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-500"
                    >
                      <option value="">No playlist</option>
                      {allPlaylists.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setAssigningPlaylist(display.id)}
                      className="flex items-center gap-1 text-gray-300 hover:text-white transition"
                    >
                      <ListVideo className="w-3 h-3" />
                      {display.playlist?.name || 'Assign playlist'}
                    </button>
                  )}
                </div>

                {display.lastSeenAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last seen</span>
                    <span className="text-gray-500">{formatDate(display.lastSeenAt)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-700 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Player URL</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPlayer(display.deviceKey)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Launch Player
                      </button>
                      <button
                        onClick={() => copyPlayerUrl(display.deviceKey)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition"
                        title="Copy player URL"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-mono truncate flex-1 mr-2">
                      {display.deviceKey}
                    </span>
                    <button
                      onClick={() => copyDeviceKey(display.deviceKey)}
                      className="p-1 text-gray-500 hover:text-white transition"
                      title="Copy device key"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Display</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplay.name}
                  onChange={(e) => setNewDisplay({ ...newDisplay, name: e.target.value })}
                  placeholder="Lobby Display"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={newDisplay.location}
                  onChange={(e) => setNewDisplay({ ...newDisplay, location: e.target.value })}
                  placeholder="Main Lobby"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
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
                Add Display
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
