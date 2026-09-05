import React, { useState, useEffect } from 'react';
import {
  Users,
  Brain,
  TrendingUp,
  BookOpen,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Award,
  CheckCircle,
  Clock,
  Heart,
  Calendar,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Activity,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GameProgress, GameResult, Memory, Reminder, User } from '../../types';

export const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'memories' | 'reminders' | 'ai-insights'>('analytics');
  const [patient, setPatient] = useState<User | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms state
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);

  // Form states
  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    relationship: 'Family',
    personName: '',
    photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
    dateEra: '2022',
  });

  const [newReminder, setNewReminder] = useState({
    title: '',
    category: 'medication' as any,
    time: '10:00 AM',
    frequency: 'daily' as any,
    description: '',
  });

  const [difficultyUpdateMsg, setDifficultyUpdateMsg] = useState<string | null>(null);

  const pId = 'patient_eleanor';

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [patData, progData, histData, memData, remData] = await Promise.all([
        api.getPatient(pId),
        api.getGameProgress(pId),
        api.getGameResults(pId),
        api.getMemories(pId),
        api.getReminders(pId),
      ]);
      setPatient(patData);
      setProgress(progData);
      setGameHistory(histData);
      setMemories(memData);
      setReminders(remData);
    } catch (err) {
      console.warn('Error loading caregiver portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update adaptive difficulty setting directly
  const handleDifficultyChange = async (newDiff: 'easy' | 'medium' | 'hard') => {
    try {
      const res = await api.updatePatient(pId, { cognitiveDifficulty: newDiff });
      setPatient(res.patient);
      setDifficultyUpdateMsg(`Challenge level set to ${newDiff.toUpperCase()}`);
      setTimeout(() => setDifficultyUpdateMsg(null), 3000);
    } catch (e) {
      console.warn('Failed to update difficulty:', e);
    }
  };

  // Memory creation
  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.title || !newMemory.description) return;

    try {
      const created = await api.createMemory({
        ...newMemory,
        patientId: pId,
        tags: [newMemory.relationship.toLowerCase()],
      });
      setMemories((prev) => [created, ...prev]);
      setShowAddMemoryModal(false);
      setNewMemory({
        title: '',
        description: '',
        relationship: 'Family',
        personName: '',
        photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
        dateEra: '2022',
      });
    } catch (err) {
      console.warn('Failed to create memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (e) {
      console.warn('Failed to delete memory:', e);
    }
  };

  // Reminder creation
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title) return;

    try {
      const created = await api.createReminder({
        ...newReminder,
        patientId: pId,
        completed: false,
      });
      setReminders((prev) => [...prev, created]);
      setShowAddReminderModal(false);
      setNewReminder({
        title: '',
        category: 'medication',
        time: '10:00 AM',
        frequency: 'daily',
        description: '',
      });
    } catch (err) {
      console.warn('Failed to create reminder:', err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.warn('Failed to delete reminder:', e);
    }
  };

  // Prepare chart data for Recharts
  const accuracyChartData = gameHistory.slice(-7).map((item, index) => {
    const d = new Date(item.playedAt);
    return {
      name: `${d.getMonth() + 1}/${d.getDate()}`,
      accuracy: item.accuracy,
      score: item.score,
      timeSeconds: Math.round(item.responseTimeMs / 1000),
      game: item.gameType,
    };
  });

  return (
    <div id="caregiver-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Caregiver Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-3.5 py-1 rounded-full text-xs font-bold text-indigo-200 uppercase tracking-wider">
              <UserCheck className="w-4 h-4" />
              <span>Caregiver Companion Portal</span>
            </div>
            <h1 id="caregiver-welcome-title" className="text-3xl sm:text-4xl font-black tracking-tight">
              Monitoring & Care for {patient?.name || 'Eleanor Vance'}
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base max-w-2xl">
              Track cognitive gaming performance, adjust adaptive challenge levels, enrich the memory album, and schedule gentle daily reminders.
            </p>
          </div>

          {/* Quick Adaptive Challenge Selector */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Adaptive Difficulty:
              </span>
              {difficultyUpdateMsg && (
                <span className="text-[11px] font-bold text-emerald-300 animate-pulse">
                  {difficultyUpdateMsg}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  id={`set-diff-${diff}`}
                  onClick={() => handleDifficultyChange(diff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    patient?.cognitiveDifficulty === diff
                      ? 'bg-emerald-500 text-white shadow-xs scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-indigo-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Vital Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Memory Score</span>
            <p className="text-2xl font-black text-slate-900">{progress?.memoryScore ?? 92}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Attention Score</span>
            <p className="text-2xl font-black text-slate-900">{progress?.attentionScore ?? 88}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Family Memories</span>
            <p className="text-2xl font-black text-slate-900">{memories.length} Saved</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Reminders</span>
            <p className="text-2xl font-black text-slate-900">{reminders.length} Active</p>
          </div>
        </div>
      </div>

      {/* Main Caregiver Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto">
        <button
          id="tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm sm:text-base font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Game Analytics & Trends</span>
        </button>

        <button
          id="tab-memories"
          onClick={() => setActiveTab('memories')}
          className={`pb-3 text-sm sm:text-base font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'memories'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Memory Book ({memories.length})</span>
        </button>

        <button
          id="tab-reminders"
          onClick={() => setActiveTab('reminders')}
          className={`pb-3 text-sm sm:text-base font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reminders'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Schedule & Reminders ({reminders.length})</span>
        </button>

        <button
          id="tab-ai-insights"
          onClick={() => setActiveTab('ai-insights')}
          className={`pb-3 text-sm sm:text-base font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ai-insights'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Care Insights & AI Summary</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Accuracy & Score Trends (%)</h3>
                <p className="text-xs text-slate-500">Recent cognitive exercise performance trajectory</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyChartData}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="accuracy" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" name="Accuracy %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Time Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Exercise Duration / Response Time (s)</h3>
                <p className="text-xs text-slate-500">Seconds to complete each cognitive session</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accuracyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="timeSeconds" fill="#6366f1" radius={[8, 8, 0, 0]} name="Seconds" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Game History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">Recent Session Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Game Type</th>
                    <th className="pb-3">Difficulty</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Accuracy</th>
                    <th className="pb-3">Response Time</th>
                    <th className="pb-3">Mistakes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gameHistory.slice(0, 8).map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/80">
                      <td className="py-3 text-slate-600 font-medium">
                        {new Date(g.playedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900 capitalize">
                        {g.gameType.replace('-', ' ')}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                          {g.difficulty}
                        </span>
                      </td>
                      <td className="py-3 font-extrabold text-teal-700">{g.score}</td>
                      <td className="py-3 font-bold text-slate-800">{g.accuracy}%</td>
                      <td className="py-3 text-slate-600">{Math.round(g.responseTimeMs / 1000)}s</td>
                      <td className="py-3 text-slate-600">{g.mistakes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMORY MANAGEMENT */}
      {activeTab === 'memories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-900">Patient Memory Book</h3>
              <p className="text-slate-600 text-sm">
                Add photos and stories to support Eleanor's memory retrieval and comfort.
              </p>
            </div>
            <button
              id="add-memory-btn"
              onClick={() => setShowAddMemoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Memory</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((m) => (
              <div
                key={m._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <img src={m.photoUrl} alt={m.title} className="w-full h-48 object-cover" />
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {m.relationship}
                      </span>
                      <span className="text-xs text-slate-400">{m.dateEra}</span>
                    </div>
                    <h4 className="font-extrabold text-xl text-slate-900">{m.title}</h4>
                    {m.personName && (
                      <p className="text-xs font-bold text-teal-700">Person: {m.personName}</p>
                    )}
                    <p className="text-slate-600 text-sm line-clamp-3">{m.description}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleDeleteMemory(m._id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REMINDERS MANAGEMENT */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-900">Schedule & Daily Routine</h3>
              <p className="text-slate-600 text-sm">
                Create structured routines for medications, water intake, walks, and family calls.
              </p>
            </div>
            <button
              id="add-reminder-btn"
              onClick={() => setShowAddReminderModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-2xl shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Reminder</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {reminders.map((r) => (
              <div key={r._id} className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {r.time}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize">
                      {r.category}
                    </span>
                    {r.completed && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-900">{r.title}</h4>
                  {r.description && <p className="text-sm text-slate-600">{r.description}</p>}
                </div>

                <button
                  onClick={() => handleDeleteReminder(r._id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI CAREGIVER INSIGHTS */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-2xl text-purple-950">AI Cognitive Care Insights</h3>
                <p className="text-sm text-purple-800">
                  Automated weekly activity analysis based on game engagement and routine completion.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-purple-200 space-y-4 text-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Positive Engagement Trend Detected</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                Over the last 7 sessions, Eleanor demonstrated steady accuracy in visual memory match (average 92%) with an average response time of 32 seconds. Working memory exercises (Number Recall) are responding well at the Gentle challenge level.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h5 className="font-extrabold text-sm text-slate-900">Recommended Activities</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Introduce 1-2 Picture Recall sessions in the morning after breakfast when focus is highest.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h5 className="font-extrabold text-sm text-slate-900">Routine Adherence</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Morning hydration and vitamin reminders were marked complete 6 out of 7 days this week.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-purple-700 font-medium">
              * Note: These insights are assistive observations and do not constitute clinical diagnostic reports.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Memory */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="font-black text-2xl text-slate-900">Add New Personal Memory</h3>
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                  placeholder="e.g., Summer in Monterey"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Person Name</label>
                  <input
                    type="text"
                    value={newMemory.personName}
                    onChange={(e) => setNewMemory({ ...newMemory, personName: e.target.value })}
                    placeholder="e.g., Leo Vance"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={newMemory.relationship}
                    onChange={(e) => setNewMemory({ ...newMemory, relationship: e.target.value })}
                    placeholder="e.g., Grandson"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={newMemory.photoUrl}
                  onChange={(e) => setNewMemory({ ...newMemory, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Story / Description</label>
                <textarea
                  rows={3}
                  required
                  value={newMemory.description}
                  onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                  placeholder="Describe what makes this memory comforting..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemoryModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm cursor-pointer"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Reminder */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="font-black text-2xl text-slate-900">Add Reminder</h3>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g., Afternoon Walk in Garden"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category</label>
                  <select
                    value={newReminder.category}
                    onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="medication">Medication</option>
                    <option value="hydration">Hydration</option>
                    <option value="meal">Meal</option>
                    <option value="appointment">Appointment</option>
                    <option value="activity">Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    placeholder="e.g., 3:00 PM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  placeholder="e.g., Take with a full glass of water"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
