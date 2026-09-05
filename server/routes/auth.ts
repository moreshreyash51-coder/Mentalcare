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

    // If new user is a patient, set their patientId to their own _id
    if (newUser.role === 'patient') {
      await db.users.findByIdAndUpdate(newUser._id, { patientId: newUser._id });
      newUser.patientId = newUser._id;
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
