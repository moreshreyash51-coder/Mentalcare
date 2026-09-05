import { GameProgress, GameResult, Memory, Reminder, User, ChatMessage, AppNotification } from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mindcare_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sign in');
    }
    return res.json();
  },

  async register(data: Partial<User> & { password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  // Patients
  async getPatients(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/patients`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatient(id: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/patients/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
  },

  async updatePatient(id: string, updates: Partial<User>): Promise<{ patient: User }> {
    const res = await fetch(`${BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },

  // Memories
  async getMemories(patientId: string): Promise<Memory[]> {
    const res = await fetch(`${BASE_URL}/memories/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async createMemory(memory: Omit<Memory, '_id' | 'createdAt'>): Promise<Memory> {
    const res = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(memory),
    });
    if (!res.ok) throw new Error('Failed to save memory');
    return res.json();
  },

  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`${BASE_URL}/memories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  // Games
  async recordGameResult(data: {
    patientId: string;
    gameType: string;
    difficulty: string;
    score: number;
    accuracy: number;
    responseTimeMs: number;
    attempts: number;
    mistakes: number;
  }): Promise<{ result: GameResult; adaptiveDifficulty: { current: 'easy' | 'medium' | 'hard'; changed: boolean } }> {
    const res = await fetch(`${BASE_URL}/games/result`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record game outcome');
    return res.json();
  },

  async getGameResults(patientId: string): Promise<GameResult[]> {
    const res = await fetch(`${BASE_URL}/games/results/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch game results');
    return res.json();
  },

  async getGameProgress(patientId: string): Promise<GameProgress> {
    const res = await fetch(`${BASE_URL}/games/progress/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch progress');
    return res.json();
  },

  // Reminders
  async getReminders(patientId: string): Promise<Reminder[]> {
    const res = await fetch(`${BASE_URL}/reminders/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },

  async createReminder(reminder: Omit<Reminder, '_id' | 'createdAt'>): Promise<Reminder> {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminder),
    });
    if (!res.ok) throw new Error('Failed to save reminder');
    return res.json();
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update reminder');
    return res.json();
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove reminder');
  },

  // AI Memory Assistant
  async sendAIChat(
    patientId: string,
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ reply: string; timestamp: string }> {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patientId, message, conversationHistory }),
    });
    if (!res.ok) throw new Error('AI Assistant temporary error');
    return res.json();
  },

  async getAIHistory(patientId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${BASE_URL}/ai/history/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // Notifications
  async getNotifications(patientId: string): Promise<AppNotification[]> {
    const res = await fetch(`${BASE_URL}/notifications/${patientId}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
  },
};
