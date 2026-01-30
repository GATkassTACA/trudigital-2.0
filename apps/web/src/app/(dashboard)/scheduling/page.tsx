'use client';

import { useState, useEffect } from 'react';
import { schedules, playlists } from '@/lib/api';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Wine,
  Briefcase,
  PartyPopper,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  name: string;
  description?: string;
  type: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek: number[];
  priority: number;
  isActive: boolean;
  playlistItems?: any[];
}

interface SchedulePreset {
  id: string;
  name: string;
  description: string;
  type: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek: number[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const presetIcons: Record<string, any> = {
  'morning': Coffee,
  'lunch': Utensils,
  'happy-hour': Wine,
  'dinner': Utensils,
  'weekend': PartyPopper,
  'weekday': Briefcase,
  'business-hours': Briefcase,
  'late-night': Moon,
};

export default function SchedulingPage() {
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [presets, setPresets] = useState<SchedulePreset[]>([]);
  const [playlistList, setPlaylistList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  type ScheduleType = 'ALWAYS' | 'TIME_RANGE' | 'DATE_RANGE' | 'DAY_OF_WEEK' | 'DATETIME_RANGE';

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: ScheduleType;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
    daysOfWeek: number[];
    priority: number;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    type: 'TIME_RANGE',
    startTime: '09:00',
    endTime: '17:00',
    startDate: '',
    endDate: '',
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
    priority: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesRes, presetsRes, playlistsRes] = await Promise.all([
        schedules.list(),
        schedules.presets(),
        playlists.list(),
      ]);
      setScheduleList(schedulesRes.data.schedules || []);
      setPresets(presetsRes.data.presets || []);
      setPlaylistList(playlistsRes.data.playlists || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromPreset = (preset: SchedulePreset) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      type: preset.type as ScheduleType,
      startTime: preset.startTime || '09:00',
      endTime: preset.endTime || '17:00',
      startDate: '',
      endDate: '',
      daysOfWeek: preset.daysOfWeek,
      priority: 0,
      isActive: true,
    });
    setShowPresets(false);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Schedule name is required');
      return;
    }

    try {
      await schedules.create(formData);
      toast.success('Schedule created');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to create schedule');
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule) return;

    try {
      await schedules.update(editingSchedule.id, formData);
      toast.success('Schedule updated');
      setEditingSchedule(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule? Content using it will revert to "always show".')) return;

    try {
      await schedules.delete(id);
      toast.success('Schedule deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    try {
      await schedules.update(schedule.id, { isActive: !schedule.isActive });
      toast.success(schedule.isActive ? 'Schedule paused' : 'Schedule activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      type: schedule.type as ScheduleType,
      startTime: schedule.startTime || '09:00',
      endTime: schedule.endTime || '17:00',
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      daysOfWeek: schedule.daysOfWeek,
      priority: schedule.priority,
      isActive: schedule.isActive,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'TIME_RANGE' as ScheduleType,
      startTime: '09:00',
      endTime: '17:00',
      startDate: '',
      endDate: '',
      daysOfWeek: [1, 2, 3, 4, 5],
      priority: 0,
      isActive: true,
    });
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const formatTimeRange = (schedule: Schedule) => {
    if (schedule.startTime && schedule.endTime) {
      const format = (time: string) => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
      };
      return `${format(schedule.startTime)} - ${format(schedule.endTime)}`;
    }
    return 'All day';
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => DAYS[d]).join(', ');
  };

  const isCurrentlyActive = (schedule: Schedule): boolean => {
    if (!schedule.isActive) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    if (!schedule.daysOfWeek.includes(currentDay)) return false;

    if (schedule.startTime && schedule.endTime) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes < startMinutes) {
        // Overnight schedule
        return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
      } else {
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }
    }

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Scheduling</h1>
          <p className="text-gray-400 mt-1">
            Schedule content to play at specific times and days
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              <Clock className="w-4 h-4" />
              Quick Presets
              <ChevronDown className={cn('w-4 h-4 transition', showPresets && 'rotate-180')} />
            </button>

            {showPresets && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-10 py-2">
                {presets.map(preset => {
                  const Icon = presetIcons[preset.id] || Clock;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleCreateFromPreset(preset)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition text-left"
                    >
                      <Icon className="w-5 h-5 text-brand-400" />
                      <div>
                        <div className="text-white font-medium">{preset.name}</div>
                        <div className="text-gray-400 text-sm">{preset.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Current Time Indicator */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-5 h-5" />
            <span>Current Time:</span>
          </div>
          <div className="text-white font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-gray-500">•</div>
          <div className="text-gray-400">
            {DAYS_FULL[new Date().getDay()]}
          </div>
        </div>
      </div>

      {/* Schedules List */}
      {scheduleList.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Schedules Yet</h3>
          <p className="text-gray-400 mb-6">
            Create schedules to control when content appears on your displays
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {scheduleList.map(schedule => {
            const active = isCurrentlyActive(schedule);
            return (
              <div
                key={schedule.id}
                className={cn(
                  'bg-gray-800 rounded-xl p-6 border transition',
                  active ? 'border-green-500/50' : 'border-gray-700',
                  !schedule.isActive && 'opacity-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{schedule.name}</h3>
                      {active && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Active Now
                        </span>
                      )}
                      {!schedule.isActive && (
                        <span className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded-full">
                          Paused
                        </span>
                      )}
                    </div>
                    {schedule.description && (
                      <p className="text-gray-400 mt-1">{schedule.description}</p>
                    )}

                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatTimeRange(schedule)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDays(schedule.daysOfWeek)}</span>
                      </div>
                    </div>

                    {/* Items using this schedule */}
                    {schedule.playlistItems && schedule.playlistItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-500 mb-2">
                          Used by {schedule.playlistItems.length} content item(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.playlistItems.slice(0, 5).map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded text-sm"
                            >
                              {item.content?.thumbnailUrl && (
                                <img
                                  src={item.content.thumbnailUrl}
                                  alt=""
                                  className="w-6 h-6 rounded object-cover"
                                />
                              )}
                              <span className="text-gray-300">{item.content?.name}</span>
                            </div>
                          ))}
                          {schedule.playlistItems.length > 5 && (
                            <span className="px-2 py-1 text-gray-500 text-sm">
                              +{schedule.playlistItems.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(schedule)}
                      className={cn(
                        'p-2 rounded-lg transition',
                        schedule.isActive
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      )}
                      title={schedule.isActive ? 'Pause schedule' : 'Activate schedule'}
                    >
                      {schedule.isActive ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 bg-gray-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning Menu"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Show breakfast items during morning hours"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Range
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Days Active
                </label>
                <div className="flex gap-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium rounded-lg transition',
                        formData.daysOfWeek.includes(index)
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, daysOfWeek: [1, 2, 3, 4, 5] }))}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    Weekdays
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, daysOfWeek: [0, 6] }))}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    Weekends
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }))}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    Every day
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority (higher = takes precedence)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  min={0}
                  max={100}
                  className="w-24 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={editingSchedule ? handleUpdate : handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
              >
                <Save className="w-4 h-4" />
                {editingSchedule ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Use */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">How Smart Scheduling Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-400 font-bold">1</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Create Schedules</h4>
              <p className="text-gray-400 text-sm mt-1">
                Define time windows like "Morning (6am-11am)" or "Happy Hour (4pm-7pm)"
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-400 font-bold">2</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Assign to Content</h4>
              <p className="text-gray-400 text-sm mt-1">
                Go to Playlists and assign schedules to individual content items
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-400 font-bold">3</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Auto-Play</h4>
              <p className="text-gray-400 text-sm mt-1">
                Content automatically shows/hides based on the current time and day
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
