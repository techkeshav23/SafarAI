"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string; // Allow custom styling
}

export function VoiceInput({ onTranscription, disabled, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // Use any to avoid TS errors with window.SpeechRecognition

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      if (event.results[0].isFinal) {
        onTranscription(transcript);
        stopListening();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={cn(
        "relative p-2 rounded-full transition-all duration-300 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        isListening 
          ? "bg-red-50 text-red-500 hover:bg-red-100 ring-2 ring-red-500/20" 
          : "hover:bg-slate-200 text-slate-400 hover:text-slate-600",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isListening ? "Stop listening" : "Voice input"}
    >
      {isListening ? (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400/20 duration-1000" />
          <MicOff className="h-5 w-5 relative z-10" />
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}

