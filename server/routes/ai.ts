import express, { Request, Response } from 'express';
import { db } from '../db/schema.js';
import { askMemoryAssistant } from '../services/aiService.js';

export const aiRouter = express.Router();

// POST /api/ai/chat
aiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, message, conversationHistory } = req.body;

    if (!patientId || !message) {
      res.status(400).json({ error: 'patientId and message are required.' });
      return;
    }

    const patient = await db.users.findById(patientId);
    if (!patient) {
      res.status(404).json({ error: 'Authorized patient record not found.' });
      return;
    }

    // Only fetch authorized patient memories and reminders
    const memories = await db.memories.find({ patientId });
    const reminders = await db.reminders.find({ patientId });

    const reply = await askMemoryAssistant({
      patient,
      memories,
      reminders,
      userMessage: message,
      conversationHistory: conversationHistory || [],
    });

    // Save to conversation collection
    let conversation = await db.conversations.findOne({ patientId });
    const userMsgObj = {
      id: 'msg_u_' + Date.now(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    const assistantMsgObj = {
      id: 'msg_a_' + Date.now(),
      role: 'assistant' as const,
      content: reply,
      timestamp: new Date().toISOString(),
    };

    if (conversation) {
      const updatedMessages = [...(conversation.messages || []), userMsgObj, assistantMsgObj].slice(-30);
      await db.conversations.findByIdAndUpdate(conversation._id, {
        messages: updatedMessages,
        lastInteraction: new Date().toISOString(),
      });
    } else {
      conversation = await db.conversations.create({
        patientId,
        messages: [userMsgObj, assistantMsgObj],
        lastInteraction: new Date().toISOString(),
      });
    }

    res.json({
      reply,
      timestamp: new Date().toISOString(),
      conversationId: conversation._id,
    });
  } catch (err: any) {
    console.error('AI chat route error:', err);
    res.status(500).json({
      error: 'AI assistant encountered an issue',
      reply: 'I am here with you. Please give me just a moment or ask me about your family or today\'s reminders.',
    });
  }
});

// GET /api/ai/history/:patientId
aiRouter.get('/history/:patientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const conversation = await db.conversations.findOne({ patientId });
    res.json(conversation ? conversation.messages : []);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});
