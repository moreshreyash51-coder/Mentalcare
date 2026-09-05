import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Circle,
  Volume2,
  Clock,
  Pill,
  Droplets,
  Utensils,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { api } from '../../services/api';
import { Reminder } from '../../types';

interface RemindersViewProps {
  onBack: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { speakText, fontSize } = useAccessibility();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'medication' | 'hydration' | 'activity'>('all');

  const fetchReminders = async () => {
    try {
      const data = await api.getReminders(user?._id || 'patient_eleanor');
      setReminders(data);
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const handleToggleComplete = async (reminder: Reminder) => {
    const newStatus = !reminder.completed;
    try {
      const updated = await api.updateReminder(reminder._id, { completed: newStatus });
      setReminders((prev) => prev.map((r) => (r._id === reminder._id ? updated : r)));

      if (newStatus) {
        speakText(`Splendid! You marked ${reminder.title} as completed.`);
      }
    } catch (e) {
      console.warn('Failed to toggle reminder status:', e);
    }
  };

  const handleReadSchedule = () => {
    const pending = reminders.filter((r) => !r.completed);
    if (pending.length === 0) {
      speakText('All your scheduled activities and reminders for today are completed! Great work.');
      return;
    }
    const text = `You have ${pending.length} pending reminder${pending.length === 1 ? '' : 's'}: ` +
      pending.map((r) => `${r.title} at ${r.time}`).join('. ');
    speakText(text);
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true;
    return r.category === filter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-5 h-5 text-rose-600" />;
      case 'hydration':
        return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'meal':
        return <Utensils className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div id="reminders-view" className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          id="reminders-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          id="read-schedule-btn"
          onClick={handleReadSchedule}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-bold cursor-pointer transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          <span>Read Today's Schedule</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-600/30 px-3.5 py-1 rounded-full text-xs font-bold text-amber-200 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Routine</span>
          </div>
          <h1
            id="reminders-title"
            className={`font-black tracking-tight ${
              fontSize === 'extra-large' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            My Reminders & Care Schedule
          </h1>
          <p className="text-amber-200 text-base max-w-xl">
            Keep track of gentle daily routines, hydration, medication, and appointments planned with your family.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'medication', label: 'Medications' },
          { id: 'hydration', label: 'Hydration' },
          { id: 'activity', label: 'Activities & Walks' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`filter-tab-${tab.id}`}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.map((reminder) => (
          <div
            key={reminder._id}
            id={`reminder-item-${reminder._id}`}
            className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              reminder.completed
                ? 'border-emerald-200 bg-emerald-50/30 opacity-80'
                : 'border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getCategoryIcon(reminder.category)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {reminder.time}
                  </span>
                  {reminder.completed && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  )}
                </div>

                <h3
                  className={`font-extrabold text-xl text-slate-900 ${
                    reminder.completed ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {reminder.title}
                </h3>
                {reminder.description && (
                  <p className="text-slate-600 text-sm">{reminder.description}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <button
                onClick={() => speakText(`${reminder.title} scheduled for ${reminder.time}. ${reminder.description || ''}`)}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Read reminder aloud"
                aria-label={`Read ${reminder.title} aloud`}
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                id={`toggle-complete-${reminder._id}`}
                onClick={() => handleToggleComplete(reminder)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm shadow-xs transition-all cursor-pointer ${
                  reminder.completed
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:scale-[1.02]'
                }`}
              >
                {reminder.completed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5" />
                    <span>Mark as Done</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {filteredReminders.length === 0 && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-lg text-slate-800">No items found in this section</h4>
            <p className="text-slate-500 text-sm">You have completed or cleared this category for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};
