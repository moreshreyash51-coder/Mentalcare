export type UserRole = 'patient' | 'caregiver';

export interface UserAccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  voiceAssistance: boolean;
  speechRate: number;
  simpleNavigation: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  patientId?: string;
  avatar?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  language: 'en' | 'es' | 'fr' | 'de';
  accessibilitySettings: UserAccessibilitySettings;
  cognitiveDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt?: string;
}

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
  category: 'medication' | 'meal' | 'activity' | 'appointment' | 'hydration';
  completed: boolean;
  recurrence: string;
  date?: string;
  notes?: string;
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
