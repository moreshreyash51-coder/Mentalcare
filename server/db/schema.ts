import bcrypt from 'bcryptjs';
import mongoose, { Schema, Model } from 'mongoose';

// MongoDB / Mongoose compatible interfaces and schema definitions

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: 'patient' | 'caregiver';
  patientId?: string; // If caregiver, who they care for; if patient, their own id
  avatar?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  language: 'en' | 'es' | 'fr' | 'de';
  accessibilitySettings: {
    fontSize: 'normal' | 'large' | 'extra-large';
    highContrast: boolean;
    voiceAssistance: boolean;
    speechRate: number;
    simpleNavigation: boolean;
  };
  cognitiveDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface IMemory {
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
  updatedAt: string;
}

export interface IGameResult {
  _id: string;
  patientId: string;
  gameType: 'memory-match' | 'picture-recall' | 'number-recall' | 'pattern-recognition';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  accuracy: number; // 0 to 100
  responseTimeMs: number;
  attempts: number;
  mistakes: number;
  completedAt: string;
}

export interface IReminder {
  _id: string;
  patientId: string;
  title: string;
  time: string; // e.g. "08:30"
  category: 'medication' | 'meal' | 'activity' | 'appointment' | 'hydration' | 'task' | 'routine';
  completed: boolean;
  recurrence: string; // "Daily", "Once", "Weekly", "Weekdays"
  date?: string;
  notes?: string;
  description?: string;
  priority?: 'normal' | 'high' | 'urgent';
  soundEnabled?: boolean;
  soundTune?: string;
  createdAt: string;
}

export interface IConversation {
  _id: string;
  patientId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  lastInteraction: string;
}

export interface INotification {
  _id: string;
  patientId: string;
  caregiverId?: string;
  title: string;
  message: string;
  type: 'game_completed' | 'reminder_due' | 'difficulty_adapted' | 'note';
  read: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// Official Mongoose Schemas (MongoDB)
// -------------------------------------------------------------

const UserMongooseSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'caregiver'], default: 'patient' },
    patientId: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    language: { type: String, enum: ['en', 'es', 'fr', 'de'], default: 'en' },
    accessibilitySettings: {
      fontSize: { type: String, enum: ['normal', 'large', 'extra-large'], default: 'large' },
      highContrast: { type: Boolean, default: false },
      voiceAssistance: { type: Boolean, default: true },
      speechRate: { type: Number, default: 0.9 },
      simpleNavigation: { type: Boolean, default: true },
    },
    cognitiveDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

const MemoryMongooseSchema = new Schema<IMemory>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    personName: { type: String },
    relationship: { type: String, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, required: true },
    tags: [{ type: String }],
    dateEra: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

const ReminderMongooseSchema = new Schema<IReminder>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    time: { type: String, required: true },
    category: {
      type: String,
      enum: ['medication', 'meal', 'activity', 'appointment', 'hydration', 'task', 'routine'],
      default: 'task',
    },
    completed: { type: Boolean, default: false },
    recurrence: { type: String, default: 'Daily' },
    date: { type: String },
    notes: { type: String },
    description: { type: String },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    soundEnabled: { type: Boolean, default: true },
    soundTune: { type: String, default: 'soothing-song' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

const GameResultMongooseSchema = new Schema<IGameResult>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    gameType: {
      type: String,
      enum: ['memory-match', 'picture-recall', 'number-recall', 'pattern-recognition'],
      required: true,
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    score: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    attempts: { type: Number, required: true },
    mistakes: { type: Number, required: true },
    completedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

const ConversationMongooseSchema = new Schema<IConversation>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    messages: [
      {
        id: { type: String },
        role: { type: String, enum: ['user', 'assistant'] },
        content: { type: String },
        timestamp: { type: String },
      },
    ],
    lastInteraction: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

const NotificationMongooseSchema = new Schema<INotification>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    caregiverId: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['game_completed', 'reminder_due', 'difficulty_adapted', 'note'], default: 'note' },
    read: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false }
);

// Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserMongooseSchema);
export const MemoryModel = mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemoryMongooseSchema);
export const ReminderModel = mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderMongooseSchema);
export const GameResultModel = mongoose.models.GameResult || mongoose.model<IGameResult>('GameResult', GameResultMongooseSchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationMongooseSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationMongooseSchema);

// Initial Seed Data
const defaultPasswordHash = bcrypt.hashSync('password123', 8);

const initialUsers: IUser[] = [
  {
    _id: 'patient_eleanor',
    name: 'Eleanor Vance',
    email: 'eleanor@example.com',
    password: defaultPasswordHash,
    role: 'patient',
    patientId: 'patient_eleanor',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '1952-04-12',
    emergencyContact: {
      name: 'Sarah Vance',
      phone: '(555) 234-5678',
      relation: 'Daughter',
    },
    language: 'en',
    accessibilitySettings: {
      fontSize: 'large',
      highContrast: false,
      voiceAssistance: true,
      speechRate: 0.9,
      simpleNavigation: true,
    },
    cognitiveDifficulty: 'easy',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'caregiver_sarah',
    name: 'Sarah Vance',
    email: 'sarah@example.com',
    password: defaultPasswordHash,
    role: 'caregiver',
    patientId: 'patient_eleanor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    emergencyContact: {
      name: 'Dr. Robert Miller',
      phone: '(555) 987-6543',
      relation: 'Family Physician',
    },
    language: 'en',
    accessibilitySettings: {
      fontSize: 'normal',
      highContrast: false,
      voiceAssistance: false,
      speechRate: 1.0,
      simpleNavigation: false,
    },
    cognitiveDifficulty: 'medium',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialMemories: IMemory[] = [
  {
    _id: 'mem_1',
    patientId: 'patient_eleanor',
    title: 'My Loving Daughter, Sarah',
    personName: 'Sarah Vance',
    relationship: 'Daughter & Primary Caregiver',
    description: 'Sarah is my wonderful daughter. She was born on a sunny Tuesday in October. She loves making chamomile tea for us, brings fresh yellow sunflowers, and visits every Sunday afternoon.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    tags: ['Family', 'Daughter', 'Sunday Visits'],
    dateEra: 'Always Close',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'mem_2',
    patientId: 'patient_eleanor',
    title: 'Grandson Leo at the Park',
    personName: 'Leo',
    relationship: 'Grandson',
    description: 'Leo is 8 years old. He loves dinosaurs, playing checkers, and drawing colorful birds for my refrigerator. His laugh lights up the whole room.',
    photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=80',
    tags: ['Family', 'Grandson', 'Park'],
    dateEra: 'Recent Years',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'mem_3',
    patientId: 'patient_eleanor',
    title: 'Blue Ridge Mountain Cabin',
    personName: 'The Family Cabin',
    relationship: 'Favorite Peaceful Place',
    description: 'Our wooden cabin surrounded by tall pine trees and crisp morning air. We sat on the porch rocking chairs listening to bluebirds and sipping warm cider.',
    photoUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&auto=format&fit=crop&q=80',
    tags: ['Cabin', 'Nature', 'Peaceful'],
    dateEra: 'Summer Vacations',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'mem_4',
    patientId: 'patient_eleanor',
    title: 'Sunny the Golden Retriever',
    personName: 'Sunny',
    relationship: 'Beloved Pet',
    description: 'Sunny had the softest golden fur and loved greeting everyone at the front gate with his tail wagging like clockwork. Always loyal and gentle.',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    tags: ['Pets', 'Golden Retriever', 'Comfort'],
    dateEra: 'Cherished Years',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialReminders: IReminder[] = [
  {
    _id: 'rem_1',
    patientId: 'patient_eleanor',
    title: 'Morning Blood Pressure Medication',
    time: '08:30',
    category: 'medication',
    completed: true,
    recurrence: 'Daily',
    notes: 'Take with a glass of water after toast.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem_2',
    patientId: 'patient_eleanor',
    title: 'Hydration - Drink Fresh Water',
    time: '10:30',
    category: 'hydration',
    completed: true,
    recurrence: 'Daily',
    notes: 'Keep the cozy blue mug filled.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem_3',
    patientId: 'patient_eleanor',
    title: 'Hearty Soup & Bread Lunch',
    time: '12:30',
    category: 'meal',
    completed: false,
    recurrence: 'Daily',
    notes: 'Warm tomato vegetable soup in the pantry.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem_4',
    patientId: 'patient_eleanor',
    title: 'Garden Walk with Sarah',
    time: '15:30',
    category: 'activity',
    completed: false,
    recurrence: 'Daily',
    notes: 'Smell the fresh lavender and check on the roses.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem_5',
    patientId: 'patient_eleanor',
    title: 'Evening Vitamin D & Calcium',
    time: '19:00',
    category: 'medication',
    completed: false,
    recurrence: 'Daily',
    notes: 'With warm chamomile tea.',
    createdAt: new Date().toISOString(),
  },
];

const now = Date.now();
const dayMs = 86400000;

const initialGameResults: IGameResult[] = [
  {
    _id: 'gr_1',
    patientId: 'patient_eleanor',
    gameType: 'memory-match',
    difficulty: 'easy',
    score: 95,
    accuracy: 92,
    responseTimeMs: 3400,
    attempts: 6,
    mistakes: 1,
    completedAt: new Date(now - 6 * dayMs).toISOString(),
  },
  {
    _id: 'gr_2',
    patientId: 'patient_eleanor',
    gameType: 'picture-recall',
    difficulty: 'easy',
    score: 90,
    accuracy: 88,
    responseTimeMs: 4100,
    attempts: 5,
    mistakes: 1,
    completedAt: new Date(now - 5 * dayMs).toISOString(),
  },
  {
    _id: 'gr_3',
    patientId: 'patient_eleanor',
    gameType: 'number-recall',
    difficulty: 'easy',
    score: 85,
    accuracy: 84,
    responseTimeMs: 4500,
    attempts: 5,
    mistakes: 2,
    completedAt: new Date(now - 4 * dayMs).toISOString(),
  },
  {
    _id: 'gr_4',
    patientId: 'patient_eleanor',
    gameType: 'pattern-recognition',
    difficulty: 'easy',
    score: 92,
    accuracy: 90,
    responseTimeMs: 3800,
    attempts: 5,
    mistakes: 1,
    completedAt: new Date(now - 3 * dayMs).toISOString(),
  },
  {
    _id: 'gr_5',
    patientId: 'patient_eleanor',
    gameType: 'memory-match',
    difficulty: 'easy',
    score: 98,
    accuracy: 96,
    responseTimeMs: 2900,
    attempts: 6,
    mistakes: 0,
    completedAt: new Date(now - 2 * dayMs).toISOString(),
  },
  {
    _id: 'gr_6',
    patientId: 'patient_eleanor',
    gameType: 'picture-recall',
    difficulty: 'easy',
    score: 94,
    accuracy: 92,
    responseTimeMs: 3200,
    attempts: 6,
    mistakes: 1,
    completedAt: new Date(now - 1 * dayMs).toISOString(),
  },
  {
    _id: 'gr_7',
    patientId: 'patient_eleanor',
    gameType: 'pattern-recognition',
    difficulty: 'easy',
    score: 96,
    accuracy: 94,
    responseTimeMs: 3100,
    attempts: 5,
    mistakes: 0,
    completedAt: new Date(now - 4 * 3600000).toISOString(),
  },
];

const initialConversations: IConversation[] = [
  {
    _id: 'conv_eleanor',
    patientId: 'patient_eleanor',
    messages: [
      {
        id: 'msg_1',
        role: 'assistant',
        content: 'Hello Eleanor! I am your MindCare memory companion. I am here to help you remember your favorite memories, people, and daily schedule. What would you like to talk about today?',
        timestamp: new Date(now - 2 * 3600000).toISOString(),
      },
    ],
    lastInteraction: new Date(now - 2 * 3600000).toISOString(),
  },
];

const initialNotifications: INotification[] = [
  {
    _id: 'notif_1',
    patientId: 'patient_eleanor',
    caregiverId: 'caregiver_sarah',
    title: 'Activity Completed',
    message: 'Eleanor completed the Memory Match game with 96% accuracy!',
    type: 'game_completed',
    read: false,
    createdAt: new Date(now - 3 * 3600000).toISOString(),
  },
  {
    _id: 'notif_2',
    patientId: 'patient_eleanor',
    caregiverId: 'caregiver_sarah',
    title: 'Reminder Checked',
    message: 'Morning Blood Pressure Medication marked as completed at 8:32 AM.',
    type: 'reminder_due',
    read: true,
    createdAt: new Date(now - 6 * 3600000).toISOString(),
  },
];

/**
 * Robust in-memory & fallback MongoDB collection
 * Used when MongoDB is offline or in container preview without external connection string.
 */
class MemoryMongoCollection<T extends { _id: string }> {
  private items: Map<string, T> = new Map();

  constructor(initialData: T[] = []) {
    initialData.forEach((item) => this.items.set(item._id, { ...item }));
  }

  async find(query: Partial<Record<keyof T, any>> = {}): Promise<T[]> {
    const list = Array.from(this.items.values());
    return list.filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key as keyof T] !== val) return false;
      }
      return true;
    });
  }

  async findById(id: string): Promise<T | null> {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  async findOne(query: Partial<Record<keyof T, any>>): Promise<T | null> {
    const results = await this.find(query);
    return results[0] || null;
  }

  async create(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const _id = doc._id || 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const full = { ...doc, _id } as T;
    this.items.set(_id, full);
    return { ...full };
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options?: { new?: boolean }): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.items.set(id, updated);
    return { ...updated };
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    this.items.delete(id);
    return existing;
  }

  async countDocuments(query: Partial<Record<keyof T, any>> = {}): Promise<number> {
    const res = await this.find(query);
    return res.length;
  }
}

// In-memory instances
const memoryStore = {
  users: new MemoryMongoCollection<IUser>(initialUsers),
  memories: new MemoryMongoCollection<IMemory>(initialMemories),
  gameResults: new MemoryMongoCollection<IGameResult>(initialGameResults),
  reminders: new MemoryMongoCollection<IReminder>(initialReminders),
  conversations: new MemoryMongoCollection<IConversation>(initialConversations),
  notifications: new MemoryMongoCollection<INotification>(initialNotifications),
};

// Database Connection Manager
let isMongoConnected = false;
let mongoConnectionError: string | null = null;

export async function initDatabase(): Promise<{ isConnected: boolean; message: string }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('ℹ️ MONGODB_URI not set. Using built-in resilient in-memory MongoDB driver with full schema support.');
    return {
      isConnected: false,
      message: 'Operating with built-in resilient in-memory MongoDB datastore',
    };
  }

  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    mongoConnectionError = null;
    console.log('✅ Successfully connected to MongoDB instance:', mongoose.connection.name);

    // Auto-seed initial data if collections are empty
    await seedMongoIfEmpty();

    return {
      isConnected: true,
      message: `Connected to MongoDB database "${mongoose.connection.name}"`,
    };
  } catch (err: any) {
    isMongoConnected = false;
    mongoConnectionError = err.message || 'Connection failed';
    console.warn('⚠️ MongoDB connection attempt failed. Seamlessly running with built-in resilient in-memory datastore:', err.message);
    return {
      isConnected: false,
      message: `MongoDB connection failed: ${err.message}. Using built-in fallback.`,
    };
  }
}

async function seedMongoIfEmpty() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial MongoDB users...');
      await UserModel.insertMany(initialUsers);
    }

    const memoryCount = await MemoryModel.countDocuments();
    if (memoryCount === 0) {
      console.log('Seeding initial MongoDB memories...');
      await MemoryModel.insertMany(initialMemories);
    }

    const reminderCount = await ReminderModel.countDocuments();
    if (reminderCount === 0) {
      console.log('Seeding initial MongoDB reminders...');
      await ReminderModel.insertMany(initialReminders);
    }

    const gameCount = await GameResultModel.countDocuments();
    if (gameCount === 0) {
      console.log('Seeding initial MongoDB game history...');
      await GameResultModel.insertMany(initialGameResults);
    }

    const convCount = await ConversationModel.countDocuments();
    if (convCount === 0) {
      await ConversationModel.insertMany(initialConversations);
    }

    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      await NotificationModel.insertMany(initialNotifications);
    }
  } catch (e) {
    console.warn('Seed error on MongoDB:', e);
  }
}

// Unified Database Adapter: Delegates to Mongoose Model when connected, or memoryStore as fallback
function createCollectionAdapter<T extends { _id: string }>(
  model: Model<any>,
  memoryCol: MemoryMongoCollection<T>,
  seedData: T[]
) {
  return {
    async find(query: any = {}): Promise<T[]> {
      if (isMongoConnected) {
        try {
          const docs = await model.find(query).lean().exec();
          return docs as T[];
        } catch (e) {
          console.warn('MongoDB find error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.find(query);
    },

    async findById(id: string): Promise<T | null> {
      if (isMongoConnected) {
        try {
          const doc = await model.findById(id).lean().exec();
          return (doc as T) || null;
        } catch (e) {
          console.warn('MongoDB findById error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.findById(id);
    },

    async findOne(query: any): Promise<T | null> {
      if (isMongoConnected) {
        try {
          const doc = await model.findOne(query).lean().exec();
          return (doc as T) || null;
        } catch (e) {
          console.warn('MongoDB findOne error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.findOne(query);
    },

    async create(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
      const _id = doc._id || 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const full = { ...doc, _id } as T;

      if (isMongoConnected) {
        try {
          await model.create(full);
        } catch (e) {
          console.warn('MongoDB create error, saving to memoryStore:', e);
        }
      }
      return memoryCol.create(full);
    },

    async findByIdAndUpdate(id: string, update: Partial<T>, options?: { new?: boolean }): Promise<T | null> {
      if (isMongoConnected) {
        try {
          const updated = await model.findByIdAndUpdate(id, update, { new: true }).lean().exec();
          if (updated) {
            await memoryCol.findByIdAndUpdate(id, update);
            return updated as T;
          }
        } catch (e) {
          console.warn('MongoDB findByIdAndUpdate error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.findByIdAndUpdate(id, update);
    },

    async findByIdAndDelete(id: string): Promise<T | null> {
      if (isMongoConnected) {
        try {
          const deleted = await model.findByIdAndDelete(id).lean().exec();
          await memoryCol.findByIdAndDelete(id);
          return (deleted as T) || null;
        } catch (e) {
          console.warn('MongoDB findByIdAndDelete error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.findByIdAndDelete(id);
    },

    async countDocuments(query: any = {}): Promise<number> {
      if (isMongoConnected) {
        try {
          return await model.countDocuments(query).exec();
        } catch (e) {
          console.warn('MongoDB countDocuments error, falling back to memoryStore:', e);
        }
      }
      return memoryCol.countDocuments(query);
    },
  };
}

// Exported db interface compatible with all routes
export const db = {
  users: createCollectionAdapter<IUser>(UserModel, memoryStore.users, initialUsers),
  memories: createCollectionAdapter<IMemory>(MemoryModel, memoryStore.memories, initialMemories),
  gameResults: createCollectionAdapter<IGameResult>(GameResultModel, memoryStore.gameResults, initialGameResults),
  reminders: createCollectionAdapter<IReminder>(ReminderModel, memoryStore.reminders, initialReminders),
  conversations: createCollectionAdapter<IConversation>(ConversationModel, memoryStore.conversations, initialConversations),
  notifications: createCollectionAdapter<INotification>(NotificationModel, memoryStore.notifications, initialNotifications),
};

export async function getDatabaseStatus() {
  const [userCount, memoryCount, reminderCount, gameCount] = await Promise.all([
    db.users.countDocuments(),
    db.memories.countDocuments(),
    db.reminders.countDocuments(),
    db.gameResults.countDocuments(),
  ]);

  return {
    isMongoConnected,
    mongoConnectionError,
    engine: isMongoConnected ? 'MongoDB (Mongoose ODM)' : 'In-Memory MongoDB Driver (Resilient)',
    databaseName: isMongoConnected ? mongoose.connection.name : 'mindcare_local',
    uriConfigured: Boolean(process.env.MONGODB_URI),
    counts: {
      users: userCount,
      memories: memoryCount,
      reminders: reminderCount,
      gameResults: gameCount,
    },
  };
}
