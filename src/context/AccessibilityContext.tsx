import React, { createContext, useContext, useState, useEffect } from 'react';
import { speech } from '../services/speech';

export type FontSizeOption = 'normal' | 'large' | 'extra-large';
export type LanguageOption = 'en' | 'es' | 'fr' | 'de';

interface AccessibilityContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  voiceAssistance: boolean;
  setVoiceAssistance: (val: boolean) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  simpleNavigation: boolean;
  setSimpleNavigation: (val: boolean) => void;
  speakText: (text: string) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageOption, Record<string, string>> = {
  en: {
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    todaysActivities: "Today's Activities",
    playMemoryGame: 'Play Memory Game',
    myMemories: 'My Memories',
    askAI: 'Ask AI Companion',
    myReminders: 'My Reminders',
    todaysProgress: "Today's Progress",
    memory: 'Memory',
    attention: 'Attention',
    recall: 'Recall',
    overallHealth: 'Cognitive Score',
    adaptiveLevel: 'Challenge Level',
    easy: 'Gentle (Easy)',
    medium: 'Balanced (Medium)',
    hard: 'Advanced (Hard)',
    voiceActive: 'Voice Help Active',
    readAloud: 'Read Aloud',
    listening: 'Listening...',
    tapToSpeak: 'Tap to Speak',
    disclaimer: 'MindCare is an assistive memory and cognitive training platform. It is not intended to diagnose dementia or replace professional medical care.',
    patientOverview: 'Patient Overview',
    gamePerformance: 'Game Performance',
    progressTrends: 'Progress Trends',
    memoryBook: 'Memory Book',
    reminders: 'Reminders',
    addMemory: 'Add New Memory',
    createReminder: 'Create Reminder',
    caregiverDashboard: 'Caregiver Dashboard',
    patientDashboard: 'Patient Dashboard',
  },
  es: {
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    todaysActivities: 'Actividades de Hoy',
    playMemoryGame: 'Jugar Juegos de Memoria',
    myMemories: 'Mis Recuerdos',
    askAI: 'Preguntar al Asistente IA',
    myReminders: 'Mis Recordatorios',
    todaysProgress: 'Progreso de Hoy',
    memory: 'Memoria',
    attention: 'Atención',
    recall: 'Retención',
    overallHealth: 'Puntuación Cognitiva',
    adaptiveLevel: 'Nivel Adaptativo',
    easy: 'Suave (Fácil)',
    medium: 'Equilibrado (Medio)',
    hard: 'Avanzado (Difícil)',
    voiceActive: 'Ayuda por Voz Activa',
    readAloud: 'Leer en voz alta',
    listening: 'Escuchando...',
    tapToSpeak: 'Tocar para Hablar',
    disclaimer: 'MindCare es una plataforma de apoyo y estimulación cognitiva. No diagnostica demencia ni reemplaza la atención médica profesional.',
    patientOverview: 'Visión del Paciente',
    gamePerformance: 'Rendimiento en Juegos',
    progressTrends: 'Tendencias de Progreso',
    memoryBook: 'Libro de Recuerdos',
    reminders: 'Recordatorios',
    addMemory: 'Añadir Recuerdo',
    createReminder: 'Crear Recordatorio',
    caregiverDashboard: 'Panel de Cuidador',
    patientDashboard: 'Panel de Paciente',
  },
  fr: {
    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    todaysActivities: "Activités d'Aujourd'hui",
    playMemoryGame: 'Jouer aux Jeux de Mémoire',
    myMemories: 'Mes Souvenirs',
    askAI: 'Assistant IA Personnel',
    myReminders: 'Mes Rappels',
    todaysProgress: "Progrès d'Aujourd'hui",
    memory: 'Mémoire',
    attention: 'Attention',
    recall: 'Rappel',
    overallHealth: 'Score Cognitif',
    adaptiveLevel: 'Niveau Adaptatif',
    easy: 'Doux (Facile)',
    medium: 'Équilibré (Moyen)',
    hard: 'Avancé (Difficile)',
    voiceActive: 'Assistance Vocale Active',
    readAloud: 'Lire à voix haute',
    listening: 'À votre écoute...',
    tapToSpeak: 'Appuyer pour Parler',
    disclaimer: "MindCare est une plateforme d'assistance et d'entraînement cognitif. Elle ne diagnostique pas la démence et ne remplace pas un médecin.",
    patientOverview: 'Aperçu du Patient',
    gamePerformance: 'Performances aux Jeux',
    progressTrends: 'Tendances et Progrès',
    memoryBook: 'Livre de Souvenirs',
    reminders: 'Rappels',
    addMemory: 'Ajouter un Souvenir',
    createReminder: 'Créer un Rappel',
    caregiverDashboard: 'Tableau de Bord Aidant',
    patientDashboard: 'Tableau de Bord Patient',
  },
  de: {
    goodMorning: 'Guten Morgen',
    goodAfternoon: 'Guten Tag',
    goodEvening: 'Guten Abend',
    todaysActivities: 'Heutige Aktivitäten',
    playMemoryGame: 'Gedächtnisspiel Spielen',
    myMemories: 'Meine Erinnerungen',
    askAI: 'KI-Begleiter Fragen',
    myReminders: 'Meine Erinnerungen & Termine',
    todaysProgress: 'Heutiger Fortschritt',
    memory: 'Gedächtnis',
    attention: 'Aufmerksamkeit',
    recall: 'Abruf',
    overallHealth: 'Kognitiver Punktestand',
    adaptiveLevel: 'Schwierigkeitsstufe',
    easy: 'Sanft (Leicht)',
    medium: 'Ausgewogen (Mittel)',
    hard: 'Fortgeschritten (Schwer)',
    voiceActive: 'Sprachhilfe Aktiv',
    readAloud: 'Vorlesen',
    listening: 'Höre zu...',
    tapToSpeak: 'Tippen zum Sprechen',
    disclaimer: 'MindCare ist eine unterstützende Plattform für Gedächtnistraining. Sie diagnostiziert keine Demenz und ersetzt keine ärztliche Betreuung.',
    patientOverview: 'Patientenübersicht',
    gamePerformance: 'Spielergebnisse',
    progressTrends: 'Fortschrittstrends',
    memoryBook: 'Erinnerungsbuch',
    reminders: 'Erinnerungen',
    addMemory: 'Erinnerung Hinzufügen',
    createReminder: 'Erinnerung Erstellen',
    caregiverDashboard: 'Betreuer-Dashboard',
    patientDashboard: 'Patienten-Dashboard',
  },
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<FontSizeOption>('large');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [voiceAssistance, setVoiceAssistance] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(0.88);
  const [language, setLanguage] = useState<LanguageOption>('en');
  const [simpleNavigation, setSimpleNavigation] = useState<boolean>(true);

  // Sync high contrast and font scaling class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
  }, [highContrast]);

  const speakText = (text: string) => {
    if (!voiceAssistance) return;
    speech.speak(text, { rate: speechRate, language: language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : 'en-US' });
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        voiceAssistance,
        setVoiceAssistance,
        speechRate,
        setSpeechRate,
        language,
        setLanguage,
        simpleNavigation,
        setSimpleNavigation,
        speakText,
        t,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};
