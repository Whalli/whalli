'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled: boolean;
  /** Afficher en mode compact (bouton circulaire de 32px) au lieu du bouton classique */
  compact?: boolean;
  /** Fonction à appeler pour le bouton send (quand mode compact et input non vide) */
  onSend?: () => void;
  /** Indique si on affiche le bouton send au lieu du micro (mode compact uniquement) */
  showSendButton?: boolean;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  disabled,
  compact = false,
  onSend,
  showSendButton = false
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleClick = () => {
    // Mode compact avec send button activé : appeler onSend
    if (compact && showSendButton && onSend) {
      onSend();
      return;
    }

    // Mode vocal : démarrer/arrêter l'enregistrement
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mode compact (bouton circulaire 32px pour ChatInput)
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-8 h-8 rounded-full transition-all flex items-center justify-center flex-shrink-0
            ${
              showSendButton
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30'
                : isRecording
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }
            disabled:cursor-not-allowed
          `}
          title={
            showSendButton
              ? 'Send message'
              : isRecording
              ? 'Stop recording'
              : 'Start voice recording'
          }
        >
          {showSendButton ? (
            // Icône Send (flèche)
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m-7-7l7 7-7 7"
              />
            </svg>
          ) : isRecording ? (
            // Icône Stop (carré)
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Icône Microphone
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* Recording Timer */}
        {isRecording && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {formatTime(recordingTime)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mode classique (bouton rectangulaire original)
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition
          ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {isRecording ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Recording Timer */}
      {isRecording && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        </div>
      )}
    </div>
  );
}
