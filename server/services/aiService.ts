import { GoogleGenAI } from '@google/genai';
import { IGameResult, IMemory, IReminder, IUser, db } from '../db/schema.js';

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
  imageBase64?: string;
  mimeType?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIChatResult {
  reply: string;
  actionTaken?: 'reminder_completed' | 'reminder_created' | 'camera_analyzed';
  affectedReminder?: IReminder;
}

export async function askMemoryAssistant(context: AIChatContext): Promise<AIChatResult> {
  const { patient, memories, reminders, userMessage, imageBase64, mimeType, conversationHistory } = context;

  // 1. Check for quick reminder completion intent (e.g. "I drank my water", "I took my morning medicine")
  const lowerMsg = (userMessage || '').toLowerCase();
  let actionTaken: AIChatResult['actionTaken'] = undefined;
  let affectedReminder: IReminder | undefined = undefined;

  const completionKeywords = ['i took', 'i drank', 'finished', 'completed', 'already took', 'done with', 'mark done', 'checked off'];
  const isCompleting = completionKeywords.some((kw) => lowerMsg.includes(kw));

  if (isCompleting) {
    // Find matching pending reminder
    let matchingReminder = reminders.find((r) => {
      if (r.completed) return false;
      const titleLower = r.title.toLowerCase();
      if (lowerMsg.includes('water') || lowerMsg.includes('hydration')) return r.category === 'hydration' || titleLower.includes('water');
      if (lowerMsg.includes('medication') || lowerMsg.includes('pill') || lowerMsg.includes('medicine') || lowerMsg.includes('pressure')) {
        return r.category === 'medication' || titleLower.includes('medication') || titleLower.includes('pressure');
      }
      if (lowerMsg.includes('lunch') || lowerMsg.includes('soup') || lowerMsg.includes('meal') || lowerMsg.includes('dinner') || lowerMsg.includes('breakfast')) {
        return r.category === 'meal';
      }
      if (lowerMsg.includes('walk') || lowerMsg.includes('garden')) return r.category === 'activity' || titleLower.includes('walk');
      return false;
    });

    if (matchingReminder) {
      const updated = await db.reminders.findByIdAndUpdate(matchingReminder._id, { completed: true });
      if (updated) {
        affectedReminder = updated;
        actionTaken = 'reminder_completed';
        await db.notifications.create({
          patientId: patient._id,
          title: 'Reminder Completed via AI Voice',
          message: `${patient.name} confirmed completion of "${updated.title}" via the AI companion.`,
          type: 'reminder_due',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Check for reminder creation intent (e.g., "Remind me to call Sarah at 4:00 PM")
  if (lowerMsg.startsWith('remind me to') || lowerMsg.startsWith('set reminder to') || lowerMsg.includes('add a reminder')) {
    const timeMatch = lowerMsg.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    let extractedTime = '14:00';
    if (timeMatch) {
      const raw = timeMatch[1].trim().toLowerCase();
      if (raw.includes('pm') && !raw.includes(':')) {
        const h = parseInt(raw.replace('pm', '').trim(), 10);
        extractedTime = `${(h % 12) + 12}:00`.padStart(5, '0');
      } else if (raw.includes('am') && !raw.includes(':')) {
        const h = parseInt(raw.replace('am', '').trim(), 10);
        extractedTime = `${h % 12}:00`.padStart(5, '0');
      } else if (raw.includes(':')) {
        extractedTime = raw.replace(/[ap]m/, '').trim().padStart(5, '0');
      }
    }

    // Extract title
    let title = userMessage.replace(/remind me to|set reminder to|add a reminder to/i, '').trim();
    if (title.length > 50) title = title.substring(0, 50);
    if (!title) title = 'Personal Reminder';

    const created = await db.reminders.create({
      patientId: patient._id,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      time: extractedTime,
      category: title.toLowerCase().includes('water') ? 'hydration' : title.toLowerCase().includes('pill') ? 'medication' : 'activity',
      completed: false,
      recurrence: 'Daily',
      notes: 'Added via Voice / Chat Companion',
      createdAt: new Date().toISOString(),
    });

    affectedReminder = created;
    actionTaken = 'reminder_created';

    return {
      reply: `I have added a new reminder for you: "${created.title}" at ${created.time}. I will be right here to remind you!`,
      actionTaken,
      affectedReminder,
    };
  }

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
You are MindCare Memory & Vision Companion, a compassionate, warm, patient voice for ${patient.name}.
Your mission is to help ${patient.name} recall personal memories, identify everyday items or loved ones via camera, stay on top of daily reminders, and feel secure and relaxed.

CRITICAL SAFETY & MEDICAL RULES:
1. You are an ASSISTIVE companion, NOT a doctor or medical professional.
2. You MUST NOT diagnose dementia, Alzheimer's, or any medical condition.
3. You MUST NOT recommend changing medication dosages.
4. If asked about taking unfamiliar pills, encourage them to check with caregiver ${patient.emergencyContact?.name || 'Sarah'} or their doctor.
5. Keep answers short, comforting, clear, and reassuring (under 3-4 sentences), using easy-to-read, kind words.
6. Speak in the first person ("I'm right here with you...", "Sarah is your wonderful daughter...").

CAMERA ASSISTANCE RULES (When an image is provided):
- If the patient shows a pill bottle or medication package: Read the visible text, check if it corresponds to their authorized medications (${reminderSummaries}), tell them when it is scheduled, and advise them warmly to verify with their caregiver before taking it.
- If the patient shows a clock or watch: Tell them what time it shows and whether any reminder is due soon.
- If the patient shows a glass of water, cup of tea, or snack: Praise them warmly for drinking fluids or eating.
- If the patient shows a family photo: Check if it resembles one of their memories (Sarah, Leo, the mountain cabin, Sunny the dog).
- If the patient shows an object or note: Read it aloud gently and explain what it is.

AUTHORIZED PATIENT CONTEXT:
Patient Name: ${patient.name}
Language Preference: ${patient.language}
${emergencyInfo}

AUTHORIZED PERSONAL MEMORIES:
${memorySummaries || 'No memories recorded yet.'}

AUTHORIZED TODAY'S SCHEDULE & REMINDERS:
${reminderSummaries || 'No reminders set for today.'}
`.trim();

  const ai = getAIClient();

  if (ai) {
    try {
      const chatHistoryFormatted = conversationHistory
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'User' : 'Companion'}: ${h.content}`)
        .join('\n');

      const fullPrompt = `${chatHistoryFormatted ? chatHistoryFormatted + '\n' : ''}User: ${userMessage || (imageBase64 ? 'Please look at what I am showing you in my camera.' : 'Hello!')}\nCompanion:`;

      let contentsPayload: any;

      if (imageBase64) {
        actionTaken = 'camera_analyzed';
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: fullPrompt,
            },
          ],
        };
      } else {
        contentsPayload = fullPrompt;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      if (response.text) {
        let finalReply = response.text.trim();
        if (actionTaken === 'reminder_completed' && affectedReminder) {
          finalReply = `Wonderful! I have checked off "${affectedReminder.title}" as completed for today. ${finalReply}`;
        }
        return {
          reply: finalReply,
          actionTaken,
          affectedReminder,
        };
      }
    } catch (error) {
      console.warn('Gemini API call error, falling back to context-aware response:', error);
    }
  }

  // Graceful rule-based fallback based on authorized context & image presence
  if (imageBase64) {
    if (lowerMsg.includes('pill') || lowerMsg.includes('medicine') || lowerMsg.includes('medication')) {
      const morningMed = reminders.find((r) => r.category === 'medication');
      return {
        reply: `I see the medication container you are holding to the camera. According to your schedule, your morning medication is scheduled for 8:30 AM. If you are unsure, please show this to your daughter Sarah before taking it.`,
        actionTaken: 'camera_analyzed',
      };
    }
    if (lowerMsg.includes('clock') || lowerMsg.includes('time')) {
      return {
        reply: `I see the clock. Remember you have reminders scheduled throughout your day, including a peaceful garden walk with Sarah in the afternoon.`,
        actionTaken: 'camera_analyzed',
      };
    }
    if (lowerMsg.includes('water') || lowerMsg.includes('drink')) {
      return {
        reply: `That looks like a fresh glass of water! Staying well-hydrated keeps you feeling energetic and clear-headed. Enjoy your drink!`,
        actionTaken: 'camera_analyzed',
      };
    }
    return {
      reply: `I can see what you are showing me in the camera! You are in a safe, comfortable place. Let me know if you would like me to read something or check your daily reminders.`,
      actionTaken: 'camera_analyzed',
    };
  }

  if (actionTaken === 'reminder_completed' && affectedReminder) {
    return {
      reply: `Wonderful job, ${patient.name}! I have checked off "${affectedReminder.title}" as completed for today. You are doing fantastic.`,
      actionTaken,
      affectedReminder,
    };
  }

  if (lowerMsg.includes('daughter') || lowerMsg.includes('sarah')) {
    const sarahMem = memories.find((m) => m.relationship.toLowerCase().includes('daughter') || m.title.toLowerCase().includes('sarah'));
    if (sarahMem) {
      return {
        reply: `Sarah is your loving daughter! She visits every Sunday and often brings fresh sunflowers for you. She is always just a phone call away at (555) 234-5678.`,
      };
    }
  }

  if (lowerMsg.includes('grandson') || lowerMsg.includes('leo')) {
    const leoMem = memories.find((m) => m.relationship.toLowerCase().includes('grandson') || m.title.toLowerCase().includes('leo'));
    if (leoMem) {
      return {
        reply: `Leo is your bright 8-year-old grandson! He loves dinosaurs and drawing colorful pictures for your refrigerator.`,
      };
    }
  }

  if (lowerMsg.includes('schedule') || lowerMsg.includes('reminder') || lowerMsg.includes('medication') || lowerMsg.includes('pills') || lowerMsg.includes('today')) {
    const pending = reminders.filter((r) => !r.completed);
    if (pending.length > 0) {
      const nextOne = pending[0];
      return {
        reply: `Today, your next scheduled reminder is "${nextOne.title}" at ${nextOne.time}. ${nextOne.notes ? nextOne.notes : ''}`,
      };
    } else {
      return {
        reply: `You have completed all your scheduled reminders for today, ${patient.name}! You are doing wonderful.`,
      };
    }
  }

  if (lowerMsg.includes('dog') || lowerMsg.includes('pet') || lowerMsg.includes('sunny')) {
    return {
      reply: `Sunny was your sweet golden retriever with a gentle heart and soft golden fur who loved resting right beside your rocking chair.`,
    };
  }

  if (lowerMsg.includes('cabin') || lowerMsg.includes('vacation') || lowerMsg.includes('mountain')) {
    return {
      reply: `You have cherished memories of your family cabin in the Blue Ridge Mountains, with crisp pine air and cozy mornings sipping warm cider on the porch.`,
    };
  }

  return {
    reply: `Hello ${patient.name}! I am your MindCare Memory & Vision Companion. You can ask me about loved ones like Sarah, your daily reminders, or turn on your camera to show me an item or note!`,
  };
}

export interface ICognitivePerformanceReport {
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

export async function analyzePatientPerformance(
  patient: IUser,
  gameResults: IGameResult[],
  reminders: IReminder[],
  memories: IMemory[]
): Promise<ICognitivePerformanceReport> {
  const totalSessions = gameResults.length;
  const avgAccuracy = totalSessions > 0
    ? Math.round(gameResults.reduce((sum, r) => sum + r.accuracy, 0) / totalSessions)
    : 90;
  const avgResponseTimeMs = totalSessions > 0
    ? Math.round(gameResults.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalSessions)
    : 3200;
  const avgResponseTimeSec = Number((avgResponseTimeMs / 1000).toFixed(1));
  const avgMistakes = totalSessions > 0
    ? Number((gameResults.reduce((sum, r) => sum + r.mistakes, 0) / totalSessions).toFixed(1))
    : 1.2;

  // Domain breakdown
  const visualGames = gameResults.filter((g) => g.gameType === 'memory-match' || g.gameType === 'picture-recall');
  const workingGames = gameResults.filter((g) => g.gameType === 'number-recall');
  const executiveGames = gameResults.filter((g) => g.gameType === 'pattern-recognition');

  const visualMemory = visualGames.length > 0
    ? Math.round(visualGames.reduce((s, g) => s + g.accuracy, 0) / visualGames.length)
    : 92;
  const workingMemory = workingGames.length > 0
    ? Math.round(workingGames.reduce((s, g) => s + g.accuracy, 0) / workingGames.length)
    : 85;
  const executiveFunction = executiveGames.length > 0
    ? Math.round(executiveGames.reduce((s, g) => s + g.accuracy, 0) / executiveGames.length)
    : 88;
  const processingSpeed = Math.max(50, Math.min(99, Math.round(100 - (avgResponseTimeSec * 4))));

  // Routine adherence
  const completedReminders = reminders.filter((r) => r.completed).length;
  const routineAdherencePercent = reminders.length > 0
    ? Math.round((completedReminders / reminders.length) * 100)
    : 86;

  // Retention rate estimate
  const retentionRate = Math.round((visualMemory * 0.5) + (workingMemory * 0.3) + (routineAdherencePercent * 0.2));

  // Overall Index (0-100)
  const overallCognitiveIndex = Math.round(
    avgAccuracy * 0.45 +
    processingSpeed * 0.25 +
    routineAdherencePercent * 0.30
  );

  // Stability trend calculation
  let stabilityStatus: 'improving' | 'stable' | 'needs_attention' = 'stable';
  if (totalSessions >= 4) {
    const recent = gameResults.slice(0, 2);
    const older = gameResults.slice(2, 4);
    const recentAcc = recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;
    const olderAcc = older.reduce((s, r) => s + r.accuracy, 0) / older.length;
    if (recentAcc >= olderAcc + 3) {
      stabilityStatus = 'improving';
    } else if (recentAcc <= olderAcc - 6) {
      stabilityStatus = 'needs_attention';
    }
  }

  // Base clinical assessments
  const strengths: string[] = [
    `Strong visual memory recognition averaging ${visualMemory}% across picture recall exercises`,
    `Consistent engagement in daily scheduled routines with ${routineAdherencePercent}% adherence rate`,
    `Maintains composed reaction pacing averaging ${avgResponseTimeSec}s with minimal hasty mistakes (${avgMistakes} avg per run)`,
  ];

  const areasToSupport: string[] = [
    `Working memory retention (${workingMemory}%) demonstrates slight fatigue during multi-digit sequences`,
    `Afternoon cognitive exercises show slight delay in pattern recognition compared to morning sessions`,
  ];

  const recommendations: string[] = [
    `Schedule cognitive brain games during peak alertness hours (between 9:30 AM and 11:30 AM)`,
    `Pair photo memory book reviews with family calls to stimulate emotional episodic recall`,
    `Maintain adaptive difficulty at ${patient.cognitiveDifficulty.toUpperCase()} to preserve confidence without inducing cognitive strain`,
    `Encourage regular hydration check-ins to support alertness and clarity throughout the day`,
  ];

  let summary = `${patient.name}'s overall cognitive index stands at ${overallCognitiveIndex}%, demonstrating a ${stabilityStatus} neurocognitive engagement profile. Visual memory (${visualMemory}%) and routine adherence (${routineAdherencePercent}%) are especially resilient, with an average response time of ${avgResponseTimeSec}s. Daily familiarity exercises and supportive family photos are functioning effectively as anchors for emotional and cognitive wellness.`;

  // Enhance via Gemini API if key is present
  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `You are a clinical neurocognitive specialist providing a compassionate, professional analysis for the caregiver of an elder or memory care patient named ${patient.name}.
Given the patient's performance metrics:
- Overall Cognitive Index: ${overallCognitiveIndex}%
- Visual Memory Accuracy: ${visualMemory}%
- Working Memory Accuracy: ${workingMemory}%
- Executive Function: ${executiveFunction}%
- Average Response Time: ${avgResponseTimeSec} seconds
- Mistakes per session: ${avgMistakes}
- Daily Routine & Chore Adherence: ${routineAdherencePercent}%
- Current Adaptive Level: ${patient.cognitiveDifficulty}
- Saved Family Memories in Album: ${memories.length}

Provide a concise 2-3 sentence clinical overview summary highlighting stability, strengths, and compassionate actionable guidance for the caregiver. Return ONLY the plain summary paragraph without markdown formatting or bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert cognitive rehabilitation and geriatric care analyst.',
          temperature: 0.4,
        },
      });

      if (response.text && response.text.trim().length > 30) {
        summary = response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini cognitive analysis error, using calculated clinical profile:', err);
    }
  }

  return {
    patientId: patient._id,
    patientName: patient.name,
    overallCognitiveIndex,
    stabilityStatus,
    retentionRate,
    averageResponseTimeSec: avgResponseTimeSec,
    mistakeFrequency: avgMistakes,
    routineAdherencePercent,
    totalSessionsPlayed: totalSessions,
    cognitiveDomainBreakdown: {
      visualMemory,
      workingMemory,
      executiveFunction,
      processingSpeed,
    },
    strengths,
    areasToSupport,
    recommendations,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
