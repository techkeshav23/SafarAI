"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchTravel } from "@/lib/api";
import { TripPlan, ChatMessage, AgentStep } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Plane,
  MessageCircle,
  ChevronRight,
  Bot,
  User,
  MapPin,
  Calendar,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Search,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoiceInput } from "./VoiceInput";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  'Find flights from Delhi to Paris',
  'Romantic trip to Bali',
  'Budget hotels in Dubai',
  'Adventure in Switzerland',
];

const LOADING_STEP_TEXTS = [
  "Understanding your travel request...",
  "Searching for the best hotels...",
  "Finding available flights...",
  "Discovering experiences...",
  "Comparing prices and ratings...",
  "Preparing your personalized results...",
];

interface ChatAssistantProps {
  onSearchResults: (plan: TripPlan | null) => void;
  onLoadingChange: (loading: boolean) => void;
  isLoading: boolean;
  onSearch?: (query: string, history?: Array<{role: string; content: string}>) => Promise<TripPlan>;
}

export function ChatAssistant({ onSearchResults, onLoadingChange, isLoading, onSearch }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, chatLoading, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Animated loading steps — advance through steps while waiting
  useEffect(() => {
    if (chatLoading) {
      setActiveStepIndex(0);
      let step = 0;
      const advance = () => {
        step++;
        if (step < LOADING_STEP_TEXTS.length) {
          setActiveStepIndex(step);
          stepTimerRef.current = setTimeout(advance, 1400 + Math.random() * 600);
        }
      };
      stepTimerRef.current = setTimeout(advance, 1500);
      return () => {
        if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      };
    } else {
      setActiveStepIndex(0);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    }
  }, [chatLoading]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || chatLoading) return;

    // Build conversation history for context awareness
    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);
    onLoadingChange(true);

    try {
      // Use provided onSearch handler (e.g. for parallel flights), or fallback to direct API
      const result = onSearch 
        ? await onSearch(query, history)
        : await searchTravel(query, undefined, history); 
      
      onSearchResults(result);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.summary || "I found some great options for your trip! Check out the map and details.",
        tripPlan: result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
        
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        width: isExpanded ? "600px" : "380px",
                        height: isExpanded ? "700px" : "550px"
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 mr-0"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">SafarAI Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-muted-foreground">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {/* Welcome Message */}
                            {messages.length === 0 && (
                                <div className="flex flex-col gap-4 text-center py-8">
                                    <div className="bg-muted/50 rounded-2xl p-6 mx-4">
                                        <Bot className="w-8 h-8 text-primary mx-auto mb-3" />
                                        <p className="text-sm text-foreground font-medium">
                                            Hi there! I&apos;m your AI travel companion.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            I can help you find flights, hotels, and plan entire trips.  
                                            Try asking something specific!
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2 px-2">
                                        {QUICK_PROMPTS.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(prompt)}
                                                className="text-xs text-left px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-colors border border-border/50 truncate"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                                            <AvatarImage src="/bot-avatar.png" />
                                        </Avatar>
                                    )}
                                    
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none border border-border"
                                        )}
                                    >
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>

                                        {msg.tripPlan && (
                                            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
                                                {/* Agent reasoning steps */}
                                                {msg.tripPlan.steps && msg.tripPlan.steps.length > 0 && (
                                                    <div className="space-y-1 mb-2">
                                                        {msg.tripPlan.steps.filter(s => s.type !== "done").map((step, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                                                <span>{step.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {msg.tripPlan.destination && (
                                                    <div className="flex items-center gap-2 text-xs opacity-90">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>Destination: {msg.tripPlan.destination}</span>
                                                    </div>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="w-full h-7 text-xs mt-1 bg-background/50 hover:bg-background"
                                                    onClick={() => onSearchResults(msg.tripPlan!)}
                                                >
                                                    View Details <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === "user" && (
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarFallback className="bg-secondary">ME</AvatarFallback>
                                        </Avatar>
                                    )}
                                </motion.div>
                            ))}
                            
                            {chatLoading && (
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8 border border-border">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <BrainCircuit className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 border border-border min-w-[220px] space-y-2">
                                        {LOADING_STEP_TEXTS.slice(0, activeStepIndex + 1).map((stepText, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                {i < activeStepIndex ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                ) : (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                                                )}
                                                <span className={cn(
                                                    i < activeStepIndex ? "text-muted-foreground" : "text-foreground font-medium"
                                                )}>
                                                    {stepText}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border bg-background">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                    placeholder="Type a message..."
                                    className="w-full bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary/50 transition-all rounded-full py-2.5 pl-4 pr-10 text-sm outline-none border"
                                    disabled={chatLoading}
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                    <VoiceInput onTranscription={(text) => setInput(text)} />
                                </div>
                            </div>
                            <Button 
                                size="icon" 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || chatLoading}
                                className="rounded-full w-10 h-10 shrink-0 shadow-sm"
                            >
                                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Toggle Button */}
        <AnimatePresence>
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center relative group"
                >
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <MessageCircle className="w-8 h-8 relative z-10" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background" />
                </motion.button>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
