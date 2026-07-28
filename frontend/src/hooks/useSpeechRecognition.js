import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for Arabic speech recognition using the Web Speech API.
 * Set language to ar-SA (Saudi Arabic) for Quranic recitation.
 *
 * Returns: { isListening, transcript, error, startListening, stopListening, isSupported }
 */
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const mountedRef = useRef(true);

  // Check if the browser supports SpeechRecognition
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome on desktop or Android.');
      return;
    }

    // Abort any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();

    // Configure for Arabic
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5; // Get multiple alternatives for fuzzy matching

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;

      // Get the latest result
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];

      if (result.isFinal) {
        // Use the best confidence result
        const bestTranscript = result[0].transcript;
        setTranscript(bestTranscript);
      } else {
        // Interim result (still listening)
        const interimTranscript = result[0].transcript;
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;

      let errorMsg;
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No speech detected. Please speak clearly.';
          break;
        case 'audio-capture':
          errorMsg = 'No microphone found. Please check your audio input.';
          break;
        case 'not-allowed':
          errorMsg = 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'network':
          errorMsg = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          // User aborted — no error
          return;
        default:
          errorMsg = `Speech recognition error: ${event.error}`;
      }
      setError(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      setTranscript('');
    } catch (err) {
      setError('Failed to start speech recognition.');
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported,
  };
};

export default useSpeechRecognition;