import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/schema.js';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_super_secret_jwt_key_2026';

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, patientId, emergencyContact, language } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }

    const existingUser = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === 'caregiver' ? 'caregiver' : 'patient',
      patientId: role === 'caregiver' ? (patientId || 'patient_eleanor') : undefined,
      avatar: role === 'caregiver'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      emergencyContact,
      language: language || 'en',
      accessibilitySettings: {
        fontSize: 'large',
        highContrast: false,
        voiceAssistance: true,
        speechRate: 0.9,
        simpleNavigation: true,
      },
      cognitiveDifficulty: 'easy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // If new user is a patient, set their patientId to their own _id and seed starter user data
    if (newUser.role === 'patient') {
      await db.users.findByIdAndUpdate(newUser._id, { patientId: newUser._id });
      newUser.patientId = newUser._id;

      const now = Date.now();

      // 1. Starter memories
      await Promise.all([
        db.memories.create({
          patientId: newUser._id,
          title: 'Family Garden Afternoon',
          personName: 'Family & Loved Ones',
          relationship: 'Family',
          description: 'A warm and sunny afternoon gathered with loved ones on the back patio, surrounded by fresh flowers and laughter.',
          photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
          tags: ['Family', 'Garden', 'Spring'],
          dateEra: 'Recent Cherished Memory',
          createdAt: new Date(now - 86400000).toISOString(),
          updatedAt: new Date(now - 86400000).toISOString(),
        }),
        db.memories.create({
          patientId: newUser._id,
          title: 'Sunday Morning Tea & Music',
          personName: 'Home & Comfort',
          relationship: 'Cherished Moment',
          description: 'Relaxing by the front window listening to favorite classic records while enjoying a warm cup of herbal tea.',
          photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
          tags: ['Music', 'Tea', 'Comfort'],
          dateEra: 'Favorite Routine',
          createdAt: new Date(now - 2 * 86400000).toISOString(),
          updatedAt: new Date(now - 2 * 86400000).toISOString(),
        }),
        db.memories.create({
          patientId: newUser._id,
          title: 'Peaceful Ocean Walk',
          personName: 'Nature',
          relationship: 'Scenic Memory',
          description: 'Walking gently along the coast, feeling the fresh ocean breeze, hearing waves lap against the shore, and watching gulls.',
          photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
          tags: ['Nature', 'Beach', 'Calm'],
          dateEra: 'Summer Memories',
          createdAt: new Date(now - 3 * 86400000).toISOString(),
          updatedAt: new Date(now - 3 * 86400000).toISOString(),
        }),
      ]);

      // 2. Starter daily reminders
      await Promise.all([
        db.reminders.create({
          patientId: newUser._id,
          title: 'Morning Water & Vitamin',
          time: '08:30 AM',
          category: 'medication',
          completed: false,
          recurrence: 'Daily',
          notes: 'Take with a full glass of lukewarm water after breakfast.',
          createdAt: new Date().toISOString(),
        }),
        db.reminders.create({
          patientId: newUser._id,
          title: 'Gentle Afternoon Stroll or Stretch',
          time: '02:00 PM',
          category: 'activity',
          completed: false,
          recurrence: 'Daily',
          notes: 'Enjoy 15 minutes of light movement or sit in the fresh air.',
          createdAt: new Date().toISOString(),
        }),
        db.reminders.create({
          patientId: newUser._id,
          title: 'Evening Memory Game & Relaxation',
          time: '07:30 PM',
          category: 'activity',
          completed: false,
          recurrence: 'Daily',
          notes: 'Play a card match game to keep the mind sharp and relaxed.',
          createdAt: new Date().toISOString(),
        }),
      ]);

      // 3. Starter AI conversation
      await db.conversations.create({
        patientId: newUser._id,
        messages: [
          {
            id: 'msg_init_' + Date.now(),
            role: 'assistant',
            content: `Hello ${newUser.name}! I am your MindCare memory companion. I am here to help you remember your favorite memories, people, and daily schedule. What would you like to talk about today?`,
            timestamp: new Date().toISOString(),
          },
        ],
        lastInteraction: new Date().toISOString(),
      });

      // 4. Starter notification
      await db.notifications.create({
        patientId: newUser._id,
        title: 'Welcome to MindCare!',
        message: `Welcome ${newUser.name}. Your personal memory book, cognitive brain games, and daily reminders are ready and saved in your secure database.`,
        type: 'note',
        read: false,
        createdAt: new Date().toISOString(),
      });

      // 5. Initial baseline game score
      await db.gameResults.create({
        patientId: newUser._id,
        gameType: 'memory-match',
        difficulty: 'easy',
        score: 92,
        accuracy: 90,
        responseTimeMs: 3500,
        attempts: 5,
        mistakes: 1,
        completedAt: new Date(now - 3600000).toISOString(),
      });
    }

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role, patientId: newUser.patientId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, patientId: user.patientId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Login successful',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.users.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe });
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
});
