import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { authRouter } from './server/routes/auth.js';
import { patientsRouter } from './server/routes/patients.js';
import { memoriesRouter } from './server/routes/memories.js';
import { gamesRouter } from './server/routes/games.js';
import { remindersRouter } from './server/routes/reminders.js';
import { aiRouter } from './server/routes/ai.js';
import { notificationsRouter } from './server/routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MindCare API',
      timestamp: new Date().toISOString(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Register API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/memories', memoriesRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/notifications', notificationsRouter);

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindCare full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MindCare server:', err);
  process.exit(1);
});
