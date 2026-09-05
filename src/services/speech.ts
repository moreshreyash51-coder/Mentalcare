// Speech service: Text-to-Speech and Speech-to-Text with accessibility tuning for elderly users

export const speech = {
  isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  isTTSSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  },

  // Speak text aloud with warm, calm cadence
  speak(text: string, options: { rate?: number; pitch?: number; language?: string } = {}): void {
    if (!this.isTTSSupported()) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 0.88; // Slightly measured rate for clear auditory processing
      utterance.pitch = options.pitch || 1.0;
      utterance.lang = options.language || 'en-US';

      // Pick warm natural voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith(options.language?.slice(0, 2) || 'en') &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  },

  stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  // Speech Recognition listener
  startListening(callbacks: {
    onResult: (transcript: string) => void;
    onError?: (err: any) => void;
    onEnd?: () => void;
    language?: string;
  }): { stop: () => void } | null {
    if (!this.isSTTSupported()) {
      callbacks.onError?.(new Error('Speech recognition not supported in this browser.'));
      return null;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = callbacks.language || 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        callbacks.onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        callbacks.onError?.(event.error);
      };

      recognition.onend = () => {
        callbacks.onEnd?.();
      };

      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch (_) {}
        },
      };
    } catch (e) {
      callbacks.onError?.(e);
      return null;
    }
  },
};
