import React, { useState } from 'react';
import { HeartHandshake, User, Users, Volume2, VolumeX, Eye, Globe, ChevronDown, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility, FontSizeOption, LanguageOption } from '../../context/AccessibilityContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, switchDemoUser, logout } = useAuth();
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    voiceAssistance,
    setVoiceAssistance,
    language,
    setLanguage,
    t,
  } = useAccessibility();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);

  const languages: { code: LanguageOption; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <header id="main-header" className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 block leading-tight">
                Mind<span className="text-teal-600">Care</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
                Memory & Cognitive Companion
              </span>
            </div>
          </button>

          {/* Center Role Badge & Mode Switcher */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
            <button
              id="switch-patient-btn"
              onClick={() => {
                switchDemoUser('patient');
                onNavigate('dashboard');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                user?.role === 'patient'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('patientDashboard')}</span>
              {user?.role === 'patient' && (
                <span className="bg-teal-800 text-teal-100 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </button>

            <button
              id="switch-caregiver-btn"
              onClick={() => {
                switchDemoUser('caregiver');
                onNavigate('dashboard');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                user?.role === 'caregiver'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('caregiverDashboard')}</span>
              {user?.role === 'caregiver' && (
                <span className="bg-indigo-800 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Right Action Tools & Accessibility Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Font Size Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200" title="Text Size">
              <button
                id="font-size-normal-btn"
                onClick={() => setFontSize('normal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  fontSize === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Normal text size"
              >
                A
              </button>
              <button
                id="font-size-large-btn"
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  fontSize === 'large' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Large text size"
              >
                A+
              </button>
              <button
                id="font-size-xl-btn"
                onClick={() => setFontSize('extra-large')}
                className={`px-2.5 py-1 text-base font-extrabold rounded-lg transition-colors cursor-pointer ${
                  fontSize === 'extra-large' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Extra large text size"
              >
                A++
              </button>
            </div>

            {/* Voice Assistance Button */}
            <button
              id="voice-assistance-toggle"
              onClick={() => setVoiceAssistance(!voiceAssistance)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                voiceAssistance
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={voiceAssistance ? 'Voice Assistance is ON' : 'Voice Assistance is OFF'}
              aria-label="Toggle voice guidance"
            >
              {voiceAssistance ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* High Contrast Toggle */}
            <button
              id="high-contrast-toggle"
              onClick={() => setHighContrast(!highContrast)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                highContrast
                  ? 'bg-slate-900 border-slate-900 text-yellow-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle high readability contrast"
              aria-label="Toggle high contrast"
            >
              <Eye className="w-5 h-5" />
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                id="language-menu-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                aria-label="Select language"
              >
                <Globe className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs font-bold">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Pill & Role Switch on Mobile */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
                  <p className="text-[10px] font-medium text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Mobile Role Switch Button */}
              <button
                id="mobile-switch-role-btn"
                onClick={() => {
                  switchDemoUser(user?.role === 'patient' ? 'caregiver' : 'patient');
                  onNavigate('dashboard');
                }}
                className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                title="Switch Role"
              >
                {user?.role === 'patient' ? 'Caregiver' : 'Patient'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
