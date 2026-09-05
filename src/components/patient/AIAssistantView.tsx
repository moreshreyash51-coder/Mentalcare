import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Bot,
  User as UserIcon,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { api } from '../../services/api';
import { speech } from '../../services/speech';
import { ChatMessage } from '../../types';

interface AIAssistantViewProps {
  onBack: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { speakText, fontSize } = useAccessibility();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActiveObj, setSpeechActiveObj] = useState<{ stop: () => void } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Who is Sarah?',
    'What reminders do I have today?',
    'Tell me about grandson Leo',
    'Tell me about our mountain cabin',
  ];

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await api.getAIHistory(user?._id || 'patient_eleanor');
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Default initial friendly greeting
          setMessages([
            {
              id: 'init_1',
              role: 'assistant',
              content: `Hello ${user?.name || 'Eleanor'}! I am your MindCare Memory Companion. I'm here to help you recall loved ones, your family photo album, and your schedule for today. How can I help you right now?`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (_) {
        setMessages([
          {
            id: 'init_1',
            role: 'assistant',
            content: `Hello ${user?.name || 'Eleanor'}! I am your MindCare Memory Companion. How can I assist you with your memories or reminders today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendAIChat(
        user?._id || 'patient_eleanor',
        query,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Auto speak aloud reply for elder accessibility
      speakText(response.reply);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `I am right here with you. Sarah is your daughter, Leo is your grandson, and your doctor and caregiver are available whenever you need them.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Speech-to-Text Microphone
  const toggleSpeechRecognition = () => {
    if (isListening) {
      speechActiveObj?.stop();
      setIsListening(false);
      return;
    }

    if (!speech.isSTTSupported()) {
      alert('Speech recognition is not supported on this browser. You can type your message in the box below.');
      return;
    }

    setIsListening(true);
    const recognition = speech.startListening({
      onResult: (transcript) => {
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    setSpeechActiveObj(recognition);
  };

  return (
    <div id="ai-assistant-view" className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          id="ai-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-900 border border-purple-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Secure Authorized Context Only</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Assistant Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/30 flex items-center justify-center text-white border border-purple-400/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl leading-tight">MindCare Memory Assistant</h2>
              <p className="text-purple-200 text-xs">
                Compassionate assistance with authorized personal memories and schedules
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              speech.stopSpeaking();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Stop Speech"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-xs ${
                    isUser ? 'bg-teal-700' : 'bg-purple-700'
                  }`}
                >
                  {isUser ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div
                  className={`p-4 sm:p-5 rounded-3xl shadow-xs space-y-2 ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p
                    className={`leading-relaxed ${
                      fontSize === 'extra-large' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {msg.content}
                  </p>

                  {!isUser && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => speakText(msg.content)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                        title="Read message aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-10 h-10 rounded-2xl bg-purple-700 flex items-center justify-center text-white flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-bold text-purple-800 ml-1">Thinking kindly...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Suggestions */}
        <div className="px-5 py-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 flex-shrink-0 uppercase tracking-wider">
            Quick Ask:
          </span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 hover:text-purple-900 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bottom Input Area with Large Microphone and Accessible Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          {/* Microphone Speech-to-Text Button */}
          <button
            id="ai-mic-btn"
            onClick={toggleSpeechRecognition}
            className={`p-4 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-4 ring-rose-200'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-900'
            }`}
            title={isListening ? 'Listening... Tap to Stop' : 'Tap to Speak (Voice Input)'}
            aria-label="Voice input microphone"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              id="ai-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={isListening ? 'Listening to your voice now...' : 'Type or use microphone to ask...'}
              className="w-full bg-slate-100 border border-slate-300 rounded-2xl px-4 py-3.5 text-base font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Send Button */}
          <button
            id="ai-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`p-4 rounded-2xl font-bold flex items-center justify-center shadow-xs transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
