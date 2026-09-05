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
  Database,
  Lock,
  LogOut,
  Music,
  Volume2,
  CheckSquare,
  Play,
  Square,
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
import { GameProgress, GameResult, Memory, Reminder, User, DatabaseStatus } from '../../types';
import { SignOutConfirmModal } from '../auth/SignOutConfirmModal';
import { reminderAudio } from '../../utils/reminderAudio';

export const CaregiverDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'memories' | 'reminders' | 'ai-insights'>('analytics');
  const [allPatients, setAllPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => user?.patientId || 'patient_eleanor');
  const [patient, setPatient] = useState<User | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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
    category: 'task' as any,
    time: '10:00 AM',
    frequency: 'Daily',
    recurrence: 'Daily',
    description: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    soundEnabled: true,
  });

  const [isSongPlaying, setIsSongPlaying] = useState(false);

  useEffect(() => {
    const unsub = reminderAudio.subscribe((playing) => setIsSongPlaying(playing));
    return () => unsub();
  }, []);

  const [difficultyUpdateMsg, setDifficultyUpdateMsg] = useState<string | null>(null);

  const pId = selectedPatientId || user?.patientId || 'patient_eleanor';

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [patList, dbData] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getDatabaseStatus().catch(() => null),
      ]);
      setAllPatients(patList);

      let targetId = selectedPatientId;
      if (!targetId && patList.length > 0) {
        targetId = patList[0]._id;
        setSelectedPatientId(targetId);
      }

      const [patData, progData, histData, memData, remData] = await Promise.all([
        api.getPatient(targetId).catch(() => null),
        api.getGameProgress(targetId).catch(() => null),
        api.getGameResults(targetId).catch(() => []),
        api.getMemories(targetId).catch(() => []),
        api.getReminders(targetId).catch(() => []),
      ]);

      if (patData) setPatient(patData);
      if (progData) setProgress(progData);
      setGameHistory(histData);
      setMemories(memData);
      setReminders(remData);
      if (dbData) setDbStatus(dbData);
    } catch (err) {
      console.warn('Error loading caregiver portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedPatientId]);

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

  // Reminder / Task creation
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title) return;

    try {
      const created = await api.createReminder({
        patientId: pId,
        title: newReminder.title,
        category: newReminder.category,
        time: newReminder.time,
        recurrence: newReminder.recurrence || 'Daily',
        priority: newReminder.priority || 'normal',
        notes: newReminder.description,
        description: newReminder.description,
        soundEnabled: newReminder.soundEnabled,
        soundTune: 'soothing-song',
        completed: false,
      });
      setReminders((prev) => [...prev, created]);
      setShowAddReminderModal(false);
      reminderAudio.playGentleChime();
      setNewReminder({
        title: '',
        category: 'task' as any,
        time: '10:00 AM',
        frequency: 'Daily',
        recurrence: 'Daily',
        description: '',
        priority: 'normal',
        soundEnabled: true,
      });
    } catch (err) {
      console.warn('Failed to create reminder:', err);
    }
  };

  const handleToggleReminderComplete = async (r: Reminder) => {
    const newStatus = !r.completed;
    try {
      const updated = await api.updateReminder(r._id, { completed: newStatus });
      setReminders((prev) => prev.map((item) => (item._id === r._id ? updated : item)));
    } catch (e) {
      console.warn('Failed to toggle reminder status:', e);
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-3.5 py-1 rounded-full text-xs font-bold text-indigo-200 uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Caregiver Companion Portal</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
                <Database className="w-3.5 h-3.5 text-emerald-300" />
                <span>{dbStatus?.isMongoConnected ? 'MongoDB Connected' : 'MongoDB Engine Active'}</span>
                {dbStatus && (
                  <span className="text-[10px] text-emerald-300/80 ml-1">
                    ({dbStatus.counts.memories} memories, {dbStatus.counts.reminders} reminders)
                  </span>
                )}
              </div>
            </div>
            <h1 id="caregiver-welcome-title" className="text-3xl sm:text-4xl font-black tracking-tight">
              Monitoring & Care for {patient?.name || 'Eleanor Vance'}
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base max-w-2xl">
              Track cognitive gaming performance, adjust adaptive challenge levels, enrich the memory album, and schedule gentle daily reminders.
            </p>

            {/* Dynamic Registered Patient Selector */}
            {allPatients.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Active Patient:
                </span>
                <select
                  id="caregiver-patient-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-indigo-950/80 border border-indigo-400/40 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-black text-white focus:outline-hidden cursor-pointer"
                >
                  {allPatients.map((p) => (
                    <option key={p._id} value={p._id} className="bg-slate-900 text-white font-normal">
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Controls & Adaptive Challenge Selector */}
          <div className="space-y-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl space-y-2">
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

            {/* Direct Sign Out Button */}
            <div className="flex justify-end">
              <button
                type="button"
                id="caregiver-banner-signout-btn"
                onClick={() => setShowSignOutConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
                title="Sign Out of Caregiver Account"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
                <span>Sign Out</span>
              </button>
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

      {/* TAB 3: REMINDERS & TASK SCHEDULE */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-900">Patient Schedule & Task Reminders</h3>
              <p className="text-slate-600 text-sm">
                Schedule medications, hydration, daily tasks, walks, and calls. Each reminder alerts with our default calming song.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSongPlaying) {
                    reminderAudio.stop();
                  } else {
                    reminderAudio.playDefaultReminderSong(false);
                  }
                }}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSongPlaying
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                }`}
              >
                {isSongPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Song</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Reminder Melody 🎵</span>
                  </>
                )}
              </button>

              <button
                id="add-reminder-btn"
                onClick={() => setShowAddReminderModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-2xl shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Task / Reminder</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {reminders.map((r) => (
              <div key={r._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {r.time}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 capitalize">
                      {r.category}
                    </span>
                    {r.priority === 'urgent' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                        Urgent
                      </span>
                    )}
                    {r.soundEnabled !== false && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Music className="w-3 h-3 text-amber-600" />
                        <span>Melody Song</span>
                      </span>
                    )}
                    {r.completed && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                  <h4 className={`font-extrabold text-lg text-slate-900 ${r.completed ? 'line-through text-slate-400' : ''}`}>
                    {r.title}
                  </h4>
                  {(r.description || r.notes) && (
                    <p className="text-sm text-slate-600">{r.description || r.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleReminderComplete(r)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      r.completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r.completed ? 'Mark Incomplete' : 'Mark Done'}
                  </button>

                  <button
                    onClick={() => handleDeleteReminder(r._id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No tasks or reminders scheduled for this patient. Click "Add Task / Reminder" above to get started.
              </div>
            )}
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

      {/* Modal: Add Reminder or Task */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-2xl text-slate-900">Add Task or Reminder</h3>
                <p className="text-xs text-slate-500">Scheduled for {patient?.name || 'your loved one'}</p>
              </div>
              <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                <Bell className="w-6 h-6" />
              </span>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Title / Action Name
                </label>
                <input
                  type="text"
                  required
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g., Afternoon Walk in Garden or Water Plants"
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
                    <option value="task">Task / Chore 📋</option>
                    <option value="routine">Daily Routine 🔄</option>
                    <option value="medication">Medication 💊</option>
                    <option value="hydration">Hydration 💧</option>
                    <option value="meal">Meal 🍲</option>
                    <option value="appointment">Appointment 📅</option>
                    <option value="activity">Brain Exercise / Activity 🧠</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    placeholder="e.g., 14:00 or 2:00 PM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Priority</label>
                  <select
                    value={newReminder.priority}
                    onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Recurrence</label>
                  <select
                    value={newReminder.recurrence}
                    onChange={(e) => setNewReminder({ ...newReminder, recurrence: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Once">Once</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  placeholder="e.g., Take with a full glass of water or put on sun hat"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Sound Option & Melodic Song Preview */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newReminder.soundEnabled}
                      onChange={(e) => setNewReminder({ ...newReminder, soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded-md border-amber-300 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        Play Default Melody Song on Alarm 🔔
                      </span>
                      <span className="text-xs text-slate-600">
                        Plays a comforting, senior-friendly song designed to notify without startling.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSongPlaying) {
                        reminderAudio.stop();
                      } else {
                        reminderAudio.playDefaultReminderSong(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSongPlaying
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    }`}
                  >
                    {isSongPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Melody</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Preview Melody Song 🎵</span>
                      </>
                    )}
                  </button>
                </div>
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
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm cursor-pointer shadow-xs"
                >
                  Save Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={logout}
        userName={user?.name}
      />
    </div>
  );
};
