export type UserRole = 'patient' | 'caregiver';

export interface UserAccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  voiceAssistance: boolean;
  speechRate: number;
  simpleNavigation: boolean;
}

export type LanguageOption =
  | 'en'
  | 'as' // Assamese (অসমীয়া) - Assam
  | 'bn' // Bengali (বাংলা) - Tripura & Assam
  | 'mni' // Manipuri / Meitei (মৈতৈলোন্) - Manipur
  | 'brx' // Bodo (बर') - Bodoland, Assam
  | 'lus' // Mizo (Mizo ṭawng) - Mizoram
  | 'kha' // Khasi (Ka Ktien Khasi) - Meghalaya
  | 'grt' // Garo (A·chik) - Meghalaya
  | 'ne'  // Nepali (नेपाली) - Sikkim & North East
  | 'ao'  // Ao / Nagamese - Nagaland
  | 'trp' // Kokborok - Tripura
  | 'hi'  // Hindi (हिन्दी)
  | 'es'  // Spanish (Español)
  | 'fr'  // French (Français)
  | 'de'; // German (Deutsch)

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other';
  patientId?: string;
  avatar?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  language: LanguageOption;
  accessibilitySettings: UserAccessibilitySettings;
  cognitiveDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt?: string;
}

export interface ImageAnalysisResult {
  category: 'medication' | 'clock' | 'family_photo' | 'document' | 'hydration' | 'general';
  title: string;
  confidence: 'high' | 'medium' | 'moderate';
  ocrText?: string;
  scheduleMatch?: string;
  safetyNotice?: string;
  actionableAdvice: string;
  reply: string;
  timestamp: string;
}

export interface AudioAnalysisResult {
  transcription: string;
  sentiment: 'peaceful' | 'happy' | 'mildly_anxious' | 'confused' | 'tired' | 'seeking_comfort';
  sentimentLabel: string;
  cognitiveClarity: 'alert' | 'moderate_hesitation' | 'disoriented';
  emotionalDistressLevel: number; // 0 to 10
  keyNeeds: string[];
  supportiveReply: string;
  caregiverAlert: string | null;
  timestamp: string;
}

export interface TextAnalysisResult {
  intent: 'question' | 'memory_lookup' | 'reminder_inquiry' | 'disoriented_grounding' | 'gratitude' | 'general';
  isDisoriented: boolean;
  groundingMessage?: string;
  reply: string;
  detectedLanguage: string;
  actionTaken?: 'reminder_completed' | 'reminder_created' | 'grounding_provided' | 'camera_analyzed';
  affectedReminder?: Reminder;
  timestamp: string;
}

export interface ReminderTune {
  id: string;
  name: string;
  description: string;
  mood: string;
  icon: string;
}

export const REMINDER_TUNES: ReminderTune[] = [
  {
    id: 'morning-bells',
    name: 'Morning Bells Lullaby',
    description: 'Gentle, comforting chime melody in C-major. Ideal for daily medications and wake-up.',
    mood: 'Soothing & Gentle',
    icon: '🔔',
  },
  {
    id: 'calm-forest',
    name: 'Calm Forest Melody',
    description: 'Serene pentatonic acoustic melody evoking morning breeze and quiet nature.',
    mood: 'Peaceful & Grounding',
    icon: '🌲',
  },
  {
    id: 'sunshine-tune',
    name: 'Sunshine Garden Melody',
    description: 'Warm, cheerful uplifting chime in G-major for daytime walks and lunch.',
    mood: 'Joyful & Encouraging',
    icon: '☀️',
  },
  {
    id: 'temple-chimes',
    name: 'Serene Temple Singing Chimes',
    description: 'Deep resonant, meditative acoustic chimes inspired by Himalayan bells.',
    mood: 'Centering & Meditative',
    icon: '🪷',
  },
  {
    id: 'gentle-harmony',
    name: 'Pastoral Afternoon Harmony',
    description: 'Warm classical chord progression with long soothing decay for evening unwind.',
    mood: 'Relaxing & Restful',
    icon: '🎵',
  },
];

export const DEFAULT_FEMALE_PATIENT_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80';
export const DEFAULT_MALE_PATIENT_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80';
export const DEFAULT_FEMALE_CAREGIVER_AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80';
export const DEFAULT_MALE_CAREGIVER_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80';

export interface AvatarPreset {
  id: string;
  name: string;
  label: string;
  gender: 'male' | 'female';
  role: 'patient' | 'caregiver';
  url: string;
}

const patientMaleAvatars: AvatarPreset[] = [
  {
    id: 'pm1',
    name: 'Arthur (Warm & Distinguished)',
    label: 'Arthur (Warm & Distinguished)',
    gender: 'male',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pm2',
    name: 'George (Friendly & Cheerful)',
    label: 'George (Friendly & Cheerful)',
    gender: 'male',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pm3',
    name: 'Robert (Gentle & Serene)',
    label: 'Robert (Gentle & Serene)',
    gender: 'male',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pm4',
    name: 'Thomas (Kind & Smiling)',
    label: 'Thomas (Kind & Smiling)',
    gender: 'male',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
  },
];

const patientFemaleAvatars: AvatarPreset[] = [
  {
    id: 'pf1',
    name: 'Eleanor (Kind & Caring)',
    label: 'Eleanor (Kind & Caring)',
    gender: 'female',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pf2',
    name: 'Martha (Gentle & Warm)',
    label: 'Martha (Gentle & Warm)',
    gender: 'female',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pf3',
    name: 'Clara (Radiant & Serene)',
    label: 'Clara (Radiant & Serene)',
    gender: 'female',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'pf4',
    name: 'Rose (Cheerful & Thoughtful)',
    label: 'Rose (Cheerful & Thoughtful)',
    gender: 'female',
    role: 'patient',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=250&auto=format&fit=crop&q=80',
  },
];

const caregiverMaleAvatars: AvatarPreset[] = [
  {
    id: 'cm1',
    name: 'David (Caring Son & Companion)',
    label: 'David (Caring Son & Companion)',
    gender: 'male',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cm2',
    name: 'Michael (Compassionate Nurse)',
    label: 'Michael (Compassionate Nurse)',
    gender: 'male',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cm3',
    name: 'James (Attentive Family Member)',
    label: 'James (Attentive Family Member)',
    gender: 'male',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cm4',
    name: 'Daniel (Patient Care Specialist)',
    label: 'Daniel (Patient Care Specialist)',
    gender: 'male',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80',
  },
];

const caregiverFemaleAvatars: AvatarPreset[] = [
  {
    id: 'cf1',
    name: 'Sarah (Devoted Daughter)',
    label: 'Sarah (Devoted Daughter)',
    gender: 'female',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cf2',
    name: 'Emily (Professional Healthcare Nurse)',
    label: 'Emily (Professional Healthcare Nurse)',
    gender: 'female',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1594824813580-ff6714c77eb7?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cf3',
    name: 'Anna (Kind Care Assistant)',
    label: 'Anna (Kind Care Assistant)',
    gender: 'female',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cf4',
    name: 'Grace (Family Care Coordinator)',
    label: 'Grace (Family Care Coordinator)',
    gender: 'female',
    role: 'caregiver',
    url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=250&auto=format&fit=crop&q=80',
  },
];

const allPresetsList: AvatarPreset[] = [
  ...patientFemaleAvatars,
  ...patientMaleAvatars,
  ...caregiverFemaleAvatars,
  ...caregiverMaleAvatars,
];

export const AVATAR_PRESETS = Object.assign(allPresetsList, {
  patient: {
    male: patientMaleAvatars,
    female: patientFemaleAvatars,
  },
  caregiver: {
    male: caregiverMaleAvatars,
    female: caregiverFemaleAvatars,
  },
});

export interface Memory {
  _id: string;
  patientId: string;
  title: string;
  personName?: string;
  relationship: string;
  description: string;
  photoUrl: string;
  tags?: string[];
  dateEra?: string;
  createdAt: string;
}

export interface Reminder {
  _id: string;
  patientId: string;
  title: string;
  time: string;
  category: 'medication' | 'meal' | 'activity' | 'appointment' | 'hydration' | 'task' | 'routine';
  completed: boolean;
  recurrence: string;
  date?: string;
  notes?: string;
  description?: string;
  priority?: 'normal' | 'high' | 'urgent';
  soundEnabled?: boolean;
  soundTune?: string;
  createdAt: string;
}

export interface GameResult {
  _id: string;
  patientId: string;
  gameType: 'memory-match' | 'picture-recall' | 'number-recall' | 'pattern-recognition';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  accuracy: number;
  responseTimeMs: number;
  attempts: number;
  mistakes: number;
  completedAt: string;
}

export interface GameProgress {
  memoryScore: number;
  attentionScore: number;
  recallScore: number;
  overallScore: number;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  totalGamesPlayed: number;
  completedToday: number;
  trendData: Array<{
    date: string;
    timestamp?: string;
    accuracy: number;
    responseTime: number;
    score?: number;
    gameType?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imagePreview?: string;
  actionTaken?: 'reminder_completed' | 'reminder_created' | 'camera_analyzed';
  affectedReminder?: Reminder;
}

export interface DatabaseStatus {
  isMongoConnected: boolean;
  mongoConnectionError: string | null;
  engine: string;
  databaseName: string;
  uriConfigured: boolean;
  counts: {
    users: number;
    memories: number;
    reminders: number;
    gameResults: number;
  };
}

export interface AppNotification {
  _id: string;
  patientId: string;
  caregiverId?: string;
  title: string;
  message: string;
  type: 'game_completed' | 'reminder_due' | 'difficulty_adapted' | 'note';
  read: boolean;
  createdAt: string;
}

export interface CognitivePerformanceReport {
  patientId: string;
  patientName: string;
  overallCognitiveIndex: number;
  stabilityStatus: 'improving' | 'stable' | 'needs_attention';
  retentionRate: number;
  averageResponseTimeSec: number;
  mistakeFrequency: number;
  routineAdherencePercent: number;
  totalSessionsPlayed: number;
  cognitiveDomainBreakdown: {
    visualMemory: number;
    workingMemory: number;
    executiveFunction: number;
    processingSpeed: number;
  };
  strengths: string[];
  areasToSupport: string[];
  recommendations: string[];
  summary: string;
  generatedAt: string;
}

export interface CaregiverObservation {
  id: string;
  date: string;
  mood: 'cheerful' | 'calm' | 'thoughtful' | 'restless' | 'fatigued';
  sleepQuality: 'peaceful' | 'average' | 'interrupted';
  waterIntakeGlasses: number;
  notes: string;
  recordedBy: string;
  createdAt: string;
}
