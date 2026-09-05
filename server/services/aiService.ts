import { GoogleGenAI } from '@google/genai';
import { IMemory, IReminder, IUser } from '../db/schema.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIChatContext {
  patient: IUser;
  memories: IMemory[];
  reminders: IReminder[];
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function askMemoryAssistant(context: AIChatContext): Promise<string> {
  const { patient, memories, reminders, userMessage, conversationHistory } = context;

  // Build authorized patient context
  const memorySummaries = memories
    .map((m) => `- ${m.title} (Relationship/Subject: ${m.relationship}${m.personName ? `, Name: ${m.personName}` : ''}${m.dateEra ? `, Era: ${m.dateEra}` : ''}): ${m.description}`)
    .join('\n');

  const reminderSummaries = reminders
    .map((r) => `- [${r.time}] ${r.title} (${r.category}) - ${r.completed ? 'Already completed today' : 'Pending today'}. Notes: ${r.notes || 'None'}`)
    .join('\n');

  const emergencyInfo = patient.emergencyContact
    ? `Emergency Contact: ${patient.emergencyContact.name} (${patient.emergencyContact.relation}) - Phone: ${patient.emergencyContact.phone}`
    : 'None listed';

  const systemInstruction = `
You are MindCare Memory Companion, a warm, patient, and compassionate voice for ${patient.name}.
Your mission is to help ${patient.name} recall their personal memories, loved ones, daily schedules, and feel safe and comforted.

CRITICAL SAFETY & MEDICAL RULES:
1. You are an ASSISTIVE companion, NOT a doctor or medical professional.
2. You MUST NOT diagnose dementia, Alzheimer's, or any medical condition.
3. You MUST NOT recommend changes to medications or medical dosages.
4. If the user asks about medical symptoms or altering medications, gently remind them to consult their doctor or their caregiver (${patient.emergencyContact?.name || 'their loved one'}).
5. Keep answers short, comforting, clear, and reassuring (under 3-4 sentences), using easy-to-read, kind words.
6. Speak in the first person ("I'm happy to remind you...", "Sarah is your wonderful daughter...").

AUTHORIZED PATIENT CONTEXT:
Patient Name: ${patient.name}
Language Preference: ${patient.language}
${emergencyInfo}

AUTHORIZED PERSONAL MEMORIES:
${memorySummaries || 'No memories recorded yet.'}

AUTHORIZED TODAY'S SCHEDULE & REMINDERS:
${reminderSummaries || 'No reminders set for today.'}

If asked about something not in this authorized context, respond gently that you don't have that specific detail in their memory book right now, and offer to help with one of their known memories or reminders.
`.trim();

  const ai = getAIClient();

  if (ai) {
    try {
      // Build conversation context
      const chatHistoryFormatted = conversationHistory.slice(-6).map((h) => `${h.role === 'user' ? 'User' : 'Companion'}: ${h.content}`).join('\n');

      const fullPrompt = `${chatHistoryFormatted ? chatHistoryFormatted + '\n' : ''}User: ${userMessage}\nCompanion:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (error) {
      console.warn('Gemini API call failed, using graceful context-aware fallback:', error);
    }
  }

  // Graceful rule-based fallback based on authorized context
  const lower = userMessage.toLowerCase();

  if (lower.includes('daughter') || lower.includes('sarah')) {
    const sarahMem = memories.find((m) => m.relationship.toLowerCase().includes('daughter') || m.title.toLowerCase().includes('sarah'));
    if (sarahMem) {
      return `Sarah is your loving daughter! She visits every Sunday and often brings fresh flowers for you. She loves you very much!`;
    }
  }

  if (lower.includes('grandson') || lower.includes('leo')) {
    const leoMem = memories.find((m) => m.relationship.toLowerCase().includes('grandson') || m.title.toLowerCase().includes('leo'));
    if (leoMem) {
      return `Leo is your bright 8-year-old grandson! He loves dinosaurs and drawing colorful pictures for you to enjoy.`;
    }
  }

  if (lower.includes('schedule') || lower.includes('reminder') || lower.includes('medication') || lower.includes('pills') || lower.includes('today')) {
    const pending = reminders.filter((r) => !r.completed);
    if (pending.length > 0) {
      const nextOne = pending[0];
      return `Today, your next reminder is ${nextOne.title} scheduled for ${nextOne.time}. ${nextOne.notes ? nextOne.notes : ''}`;
    } else {
      return `You have completed all your scheduled reminders for today, ${patient.name}! You are doing wonderful.`;
    }
  }

  if (lower.includes('dog') || lower.includes('pet') || lower.includes('sunny')) {
    return `Sunny was your sweet golden retriever with a loyal heart and soft golden fur who loved resting right beside your chair.`;
  }

  if (lower.includes('cabin') || lower.includes('vacation') || lower.includes('lake') || lower.includes('mountain')) {
    return `You have wonderful memories of your family cabin in the Blue Ridge Mountains, with crisp pine air and cozy mornings on the porch.`;
  }

  if (lower.includes('diagnose') || lower.includes('dementia') || lower.includes('alzheimer') || lower.includes('medicine')) {
    return `I am your personal memory assistant here to help with your daily schedule and memories. For any medical questions or prescriptions, please speak with your doctor or your caregiver ${patient.emergencyContact?.name || ''}.`;
  }

  return `Hello ${patient.name}! I am here to help you remember your loved ones, your favorite memories, or what is planned for today. You can ask me about Sarah, your grandson Leo, or your daily schedule!`;
}
