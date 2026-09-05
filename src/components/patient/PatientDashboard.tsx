import React, { useEffect, useState } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  Bell,
  Volume2,
  TrendingUp,
  Heart,
  Calendar,
  CheckCircle2,
  PhoneCall,
  Flame,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { api } from '../../services/api';
import { GameProgress, Reminder } from '../../types';

interface PatientDashboardProps {
  onNavigate: (view: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, speakText, fontSize, highContrast } = useAccessibility();

  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  const patientName = user?.name || 'Eleanor';
  const greetingText = `${getGreeting()}, ${patientName}!`;

  useEffect(() => {
    const loadData = async () => {
      const pId = user?._id || 'patient_eleanor';
      try {
        const [progData, remData] = await Promise.all([
          api.getGameProgress(pId),
          api.getReminders(pId),
        ]);
        setProgress(progData);
        setReminders(remData);
      } catch (err) {
        console.warn('Failed to fetch patient dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Read aloud welcome summary
  const handleReadWelcome = () => {
    const mem = progress ? progress.memoryScore : 92;
    const pendingReminders = reminders.filter((r) => !r.completed);
    const summary = `${greetingText}. Welcome to your MindCare dashboard. Today, your cognitive memory progress is ${mem} percent. You have ${pendingReminders.length} reminder${pendingReminders.length === 1 ? '' : 's'} scheduled. What activity would you like to enjoy right now?`;
    speakText(summary);
  };

  const completedRemindersCount = reminders.filter((r) => r.completed).length;

  return (
    <div id="patient-dashboard" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Reassuring Greeting Card with Large Audio Read Button */}
      <section
        id="patient-greeting-card"
        className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-3xl text-white p-6 sm:p-9 shadow-md relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Heart className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-teal-600/60 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-teal-100 border border-teal-500/30">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1
              id="patient-greeting-title"
              className={`font-black tracking-tight leading-tight ${
                fontSize === 'extra-large' ? 'text-4xl sm:text-5xl' : fontSize === 'large' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              {greetingText}
            </h1>
            <p className="text-teal-100 text-base sm:text-lg max-w-xl">
              Welcome back to your comfort space. Take a gentle breath, explore your memories, or stimulate your brain with a relaxing game.
            </p>
          </div>

          <button
            id="read-welcome-btn"
            onClick={handleReadWelcome}
            className="flex items-center gap-3 bg-white hover:bg-teal-50 text-teal-900 px-5 py-3.5 rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
            aria-label="Read greeting aloud"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider text-teal-700 font-extrabold">Audio Help</span>
              <span className="block text-sm font-bold leading-tight">{t('readAloud')}</span>
            </div>
          </button>
        </div>
      </section>

      {/* TODAY'S ACTIVITIES - Primary Action Cards (Oversized, High Readability) */}
      <section id="todays-activities-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="todays-activities-heading"
            className={`font-black text-slate-900 flex items-center gap-2.5 ${
              fontSize === 'extra-large' ? 'text-3xl' : fontSize === 'large' ? 'text-2xl' : 'text-xl'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-teal-500 inline-block" />
            {t('todaysActivities')}
          </h2>
          <span className="text-sm font-semibold text-slate-500 hidden sm:inline">Tap any card to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Play Memory Game */}
          <button
            id="act-play-game-btn"
            onClick={() => onNavigate('games')}
            className={`group bg-white rounded-3xl p-6 border-2 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[220px] ${
              highContrast
                ? 'border-slate-900 hover:border-black'
                : 'border-emerald-100 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/40'
            }`}
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                {t('playMemoryGame')}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Enjoy soothing puzzles designed to keep your mind vibrant and sharp at your own pace.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold text-sm">
              <span>Start Game</span>
              <span className="text-lg">→</span>
            </div>
          </button>

          {/* 2. My Memories */}
          <button
            id="act-my-memories-btn"
            onClick={() => onNavigate('memories')}
            className={`group bg-white rounded-3xl p-6 border-2 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[220px] ${
              highContrast
                ? 'border-slate-900 hover:border-black'
                : 'border-blue-100 hover:border-blue-400 bg-gradient-to-b from-white to-blue-50/40'
            }`}
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                {t('myMemories')}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Flip through photos of your daughter Sarah, grandson Leo, family trips, and dear memories.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-blue-700 font-bold text-sm">
              <span>Open Photo Book</span>
              <span className="text-lg">→</span>
            </div>
          </button>

          {/* 3. Ask AI */}
          <button
            id="act-ask-ai-btn"
            onClick={() => onNavigate('ai')}
            className={`group bg-white rounded-3xl p-6 border-2 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[220px] ${
              highContrast
                ? 'border-slate-900 hover:border-black'
                : 'border-purple-100 hover:border-purple-400 bg-gradient-to-b from-white to-purple-50/40'
            }`}
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                {t('askAI')}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Speak or type to ask friendly questions about your schedule, loved ones, or memories.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-purple-700 font-bold text-sm">
              <span>Talk with Companion</span>
              <span className="text-lg">→</span>
            </div>
          </button>

          {/* 4. My Reminders */}
          <button
            id="act-my-reminders-btn"
            onClick={() => onNavigate('reminders')}
            className={`group bg-white rounded-3xl p-6 border-2 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[220px] ${
              highContrast
                ? 'border-slate-900 hover:border-black'
                : 'border-amber-100 hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/40'
            }`}
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs relative">
                <Bell className="w-8 h-8" />
                {reminders.filter((r) => !r.completed).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {reminders.filter((r) => !r.completed).length}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                {t('myReminders')}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Check medications, meal times, hydration glasses, and gentle walks planned for today.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-amber-800 font-bold text-sm">
              <span>View Schedule</span>
              <span className="text-lg">→</span>
            </div>
          </button>
        </div>
      </section>

      {/* TODAY'S PROGRESS - Metrics Section */}
      <section id="todays-progress-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="todays-progress-heading"
              className={`font-black text-slate-900 flex items-center gap-2.5 ${
                fontSize === 'extra-large' ? 'text-3xl' : fontSize === 'large' ? 'text-2xl' : 'text-xl'
              }`}
            >
              <TrendingUp className="w-6 h-6 text-teal-600" />
              {t('todaysProgress')}
            </h2>
            <p className="text-slate-600 text-sm mt-0.5">
              Reflects your recent cognitive engagement and exercise performance.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 px-4 py-2 rounded-2xl">
            <Award className="w-5 h-5 text-teal-700" />
            <div className="text-left">
              <span className="block text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                {t('adaptiveLevel')}
              </span>
              <span className="block text-sm font-extrabold text-teal-900 capitalize">
                {progress?.currentDifficulty === 'hard'
                  ? t('hard')
                  : progress?.currentDifficulty === 'medium'
                  ? t('medium')
                  : t('easy')}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Main Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Memory: XX% */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-700">{t('memory')}</span>
              <span className="text-2xl font-black text-teal-700">
                {progress?.memoryScore ?? 92}%
              </span>
            </div>
            {/* Accessible Large Bar */}
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-700"
                style={{ width: `${progress?.memoryScore ?? 92}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">Memory match and recall visual exercises</p>
          </div>

          {/* Attention: XX% */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-700">{t('attention')}</span>
              <span className="text-2xl font-black text-indigo-700">
                {progress?.attentionScore ?? 88}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${progress?.attentionScore ?? 88}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">Pattern recognition and focus rhythm</p>
          </div>

          {/* Recall: XX% */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-700">{t('recall')}</span>
              <span className="text-2xl font-black text-emerald-700">
                {progress?.recallScore ?? 90}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${progress?.recallScore ?? 90}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">Picture item recognition & number memory</p>
          </div>
        </div>
      </section>

      {/* Emergency & Family Support Contact Footer */}
      <section
        id="family-support-card"
        className="bg-teal-50/70 border border-teal-200/70 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
              Primary Loved One Contact
            </h4>
            <p className="text-slate-600 text-sm">
              {user?.emergencyContact?.name || 'Sarah Vance'} ({user?.emergencyContact?.relation || 'Daughter'}):{' '}
              <span className="font-bold text-teal-800">{user?.emergencyContact?.phone || '(555) 234-5678'}</span>
            </p>
          </div>
        </div>

        <button
          id="contact-caregiver-btn"
          onClick={() =>
            speakText(
              `Your primary contact is your daughter ${user?.emergencyContact?.name || 'Sarah Vance'}, telephone number ${
                user?.emergencyContact?.phone || '555 234 5678'
              }.`
            )
          }
          className="inline-flex items-center gap-2 bg-white hover:bg-teal-100 text-teal-900 px-4 py-2.5 rounded-xl font-bold border border-teal-300 text-sm transition-colors cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-teal-700" />
          <span>Speak Phone Info</span>
        </button>
      </section>
    </div>
  );
};
