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
  Camera,
  CameraOff,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Pill,
  Coffee,
  X,
  RefreshCw,
  Bell,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { api } from '../../services/api';
import { speech } from '../../services/speech';
import { ChatMessage, Reminder } from '../../types';

interface AIAssistantViewProps {
  onBack: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { speakText, fontSize, highContrast } = useAccessibility();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActiveObj, setSpeechActiveObj] = useState<{ stop: () => void } | null>(null);

  // Camera & Image State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Patient Reminders Cache for quick reference & interactive actions
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-set quick suggestions for reminders and memory recall
  const reminderQuestions = [
    '🔔 What are my reminders today?',
    '💊 Did I take my morning pills?',
    '✅ I took my morning medicine',
    '💧 I just drank a glass of water',
  ];

  const cameraQuickQuestions = [
    '💊 What medicine is this pill bottle and when do I take it?',
    '⏰ What time does this clock show?',
    '🥛 Is this glass of water for hydration?',
    '🖼️ Who is in this photograph?',
    '📝 Please read this note for me',
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      const patientId = user?._id || 'patient_eleanor';
      try {
        const [history, remList] = await Promise.all([
          api.getAIHistory(patientId),
          api.getReminders(patientId),
        ]);
        setActiveReminders(remList);

        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              id: 'init_1',
              role: 'assistant',
              content: `Hello ${user?.name || 'Eleanor'}! I am your MindCare Voice, Camera & Reminder Companion. I can help you recall family memories, check your medications, remember what time it is, or look at items through your camera. How can I assist you right now?`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (_) {
        setMessages([
          {
            id: 'init_1',
            role: 'assistant',
            content: `Hello ${user?.name || 'Eleanor'}! I am here to help you with your memories, reminders, or identify items via your camera.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };
    loadInitialData();

    return () => {
      stopCamera();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Camera initialization
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Could not start camera. You can also upload a photo using the photo button.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedImage(dataUrl);
      stopCamera();
      speakText('Photo captured! Now ask me what you would like to know about this item.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          speakText('Photo attached. Ask me about this item or pill container.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Send Message Handler (Supports Text, Voice, and Camera Snapshot)
  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputText).trim();
    if ((!query && !capturedImage) || isLoading) return;

    const patientId = user?._id || 'patient_eleanor';
    const messageText = query || 'Please look at what I am showing you in my camera.';
    const imageToSend = capturedImage;

    // Clear input & image preview immediately
    setInputText('');
    setCapturedImage(null);

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      imagePreview: imageToSend || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendAIChat(
        patientId,
        messageText,
        messages.map((m) => ({ role: m.role, content: m.content })),
        imageToSend || undefined,
        imageToSend ? 'image/jpeg' : undefined
      );

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
        actionTaken: response.actionTaken,
        affectedReminder: response.affectedReminder,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If a reminder was checked off, refresh reminders list
      if (response.actionTaken === 'reminder_completed' || response.actionTaken === 'reminder_created') {
        const freshReminders = await api.getReminders(patientId);
        setActiveReminders(freshReminders);
      }

      // Read aloud for elder accessibility
      speakText(response.reply);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `I am right here with you. Sarah is your daughter, your doctor and caregiver are available, and your next reminder is for your health.`,
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

  // Mark reminder done from chat card
  const handleMarkReminderDone = async (reminderId: string) => {
    try {
      const updated = await api.updateReminder(reminderId, { completed: true });
      setActiveReminders((prev) => prev.map((r) => (r._id === reminderId ? updated : r)));
      speakText(`Marked ${updated.title} as completed!`);
      // Add companion feedback
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_rem_done_' + Date.now(),
          role: 'assistant',
          content: `Great job, ${user?.name || 'Eleanor'}! I have marked "${updated.title}" as completed for today.`,
          timestamp: new Date().toISOString(),
          actionTaken: 'reminder_completed',
          affectedReminder: updated,
        },
      ]);
    } catch (e) {
      console.warn('Could not update reminder:', e);
    }
  };

  return (
    <div id="ai-assistant-view" className="max-w-4xl mx-auto space-y-5 py-3">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="ai-back-btn"
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-900 border border-purple-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Voice & Camera Assistance</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-bold">
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reminder Companion</span>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[680px] overflow-hidden">
        {/* Assistant Top Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/30 flex items-center justify-center text-white border border-purple-400/40">
              <Bot className="w-7 h-7 text-purple-200" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl leading-tight flex items-center gap-2">
                <span>MindCare Memory & Camera Assistant</span>
              </h2>
              <p className="text-purple-200 text-xs">
                Ask with your voice, type, or show pill bottles and items to your camera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => speech.stopSpeaking()}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Stop Speech Output"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Camera Viewfinder Modal / Overlay */}
        {isCameraOpen && (
          <div className="bg-slate-950 p-4 border-b border-purple-300/30 relative flex flex-col items-center">
            <div className="relative max-w-sm w-full bg-black rounded-2xl overflow-hidden border-2 border-purple-400 shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-56 object-cover bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder crosshairs / focus frame */}
              <div className="absolute inset-4 border border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-bold bg-black/60 text-white px-2 py-1 rounded-md">
                  Point at pill container, clock, drink, or photo
                </span>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs text-white mb-3">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
                  >
                    Select Photo from Device
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex items-center gap-3 mt-3">
              <button
                id="camera-snap-btn"
                onClick={captureSnapshot}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Take Snapshot & Ask</span>
              </button>

              <button
                id="camera-close-btn"
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close Camera</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
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
                  className={`p-4 sm:p-5 rounded-3xl shadow-xs space-y-3 ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {/* If user attached a photo */}
                  {msg.imagePreview && (
                    <div className="rounded-2xl overflow-hidden border-2 border-teal-500/50 max-w-xs shadow-xs">
                      <img
                        src={msg.imagePreview}
                        alt="Patient camera snapshot"
                        className="w-full h-44 object-cover"
                      />
                      <div className="bg-teal-800/80 px-2.5 py-1 text-[11px] font-bold text-teal-100 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera Snapshot</span>
                      </div>
                    </div>
                  )}

                  <p
                    className={`leading-relaxed whitespace-pre-wrap ${
                      fontSize === 'extra-large' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {msg.content}
                  </p>

                  {/* If assistant performed a reminder action */}
                  {msg.actionTaken === 'reminder_completed' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        Reminder Completed: {msg.affectedReminder?.title || 'Daily scheduled task'}
                      </span>
                    </div>
                  )}

                  {msg.actionTaken === 'reminder_created' && msg.affectedReminder && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs text-purple-900 font-bold">
                      <Bell className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>
                        New Reminder Added: {msg.affectedReminder.title} at {msg.affectedReminder.time}
                      </span>
                    </div>
                  )}

                  {/* Speech playback option for assistant responses */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">MindCare Companion</span>
                      <button
                        onClick={() => speakText(msg.content)}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 hover:text-purple-900 cursor-pointer"
                        title="Read message aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen Aloud</span>
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
              <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-tl-none flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-extrabold text-purple-800 ml-1">Thinking with care...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Captured Photo Preview Bar (before sending) */}
        {capturedImage && (
          <div className="px-5 py-3 bg-purple-50 border-t border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-purple-400"
                />
                <button
                  onClick={() => setCapturedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                  title="Remove Photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div>
                <span className="text-xs font-bold text-purple-950 block">Photo Attached</span>
                <span className="text-[11px] text-purple-700">Ready to analyze pill bottles, objects, or photos</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startCamera()}
                className="text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-100 cursor-pointer"
              >
                Retake
              </button>
              <button
                onClick={() => handleSendMessage()}
                className="text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
              >
                Ask AI Now
              </button>
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips (Adaptive to Image vs Reminders) */}
        <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex-shrink-0">
            {capturedImage ? 'Photo Ask:' : 'Quick Reminders:'}
          </span>
          {(capturedImage ? cameraQuickQuestions : reminderQuestions).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q.replace(/^[^\w\s]+\s*/, ''))}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 hover:text-purple-900 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bottom Input Area with Large Accessible Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2 sm:gap-3">
          {/* Camera Button */}
          <button
            id="ai-camera-btn"
            type="button"
            onClick={() => (isCameraOpen ? stopCamera() : startCamera())}
            className={`p-3.5 sm:p-4 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              isCameraOpen || capturedImage
                ? 'bg-purple-700 text-white shadow-md ring-2 ring-purple-300'
                : 'bg-slate-100 hover:bg-purple-100 text-purple-900 border border-slate-200'
            }`}
            title="Open Camera to show pills, clocks, or items"
            aria-label="Open Camera"
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Hidden File Input for Device Photo Alternative */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            id="ai-upload-photo-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 sm:p-4 rounded-2xl font-bold flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Upload an image from device"
            aria-label="Upload image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Microphone Speech-to-Text Button */}
          <button
            id="ai-mic-btn"
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-3.5 sm:p-4 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-4 ring-rose-200'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200'
            }`}
            title={isListening ? 'Listening... Tap to Stop' : 'Tap to Speak (Voice Input)'}
            aria-label="Voice input microphone"
          >
            {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
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
              placeholder={
                isListening
                  ? 'Listening to your voice now...'
                  : capturedImage
                  ? 'Ask about this photo, pill container, or item...'
                  : 'Ask about reminders, pills, family, or schedule...'
              }
              className="w-full bg-slate-100 border border-slate-300 rounded-2xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Send Button */}
          <button
            id="ai-send-btn"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputText.trim() && !capturedImage) || isLoading}
            className={`p-3.5 sm:p-4 rounded-2xl font-bold flex items-center justify-center shadow-xs transition-all ${
              (inputText.trim() || capturedImage) && !isLoading
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
