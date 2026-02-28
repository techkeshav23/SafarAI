"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceInput } from "@/components/features/VoiceInput";

/* ── Fake canned responses ── */
const BOT_RESPONSES: Record<string, string> = {
  default:
    "Hey! I'm **Safar**, your AI travel buddy ✈️\n\nI can help you plan trips, find flights, discover hotels and more. Try asking me something!",
  flight:
    "Great choice! 🛫 I found **12 flights** for that route.\n\n• **IndiGo 6E-204** — ₹4,299 (Non-stop, 2h 15m)\n• **Air India AI-865** — ₹5,120 (Non-stop, 2h 30m)\n• **Vistara UK-945** — ₹6,480 (Non-stop, 2h 10m)\n\nWant me to filter by price or airline?",
  hotel:
    "Sure thing! 🏨 Here are some top picks:\n\n• **The Oberoi** — ₹12,500/night ⭐ 4.8\n• **Taj Palace** — ₹9,800/night ⭐ 4.6\n• **ITC Grand** — ₹8,200/night ⭐ 4.5\n\nShall I check availability for your dates?",
  trip:
    "I'd love to plan that! 🌍 Here's a quick itinerary:\n\n**Day 1** — Arrive & check-in, explore local markets\n**Day 2** — Sightseeing & cultural tour\n**Day 3** — Adventure activities\n**Day 4** — Relax & departure\n\nWant me to add flights and hotels to this?",
  budget:
    "Smart traveler! 💰 I can find options under your budget.\n\nI'll prioritize value-for-money stays and affordable flights. Just tell me your destination and I'll work my magic!",
  hello:
    "Hey there! 👋 Welcome to **SafarAI**.\n\nI'm Safar — your personal travel AI. Ask me about flights, hotels, trip plans, or just tell me where you want to go!",
};

const QUICK_CHIPS = [
  "Find flights to Goa",
  "Hotels in Mumbai",
  "Plan a Bali trip",
  "Budget trip ideas",
];

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
}

function getTimeString() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function pickResponse(input: string): string {
  const q = input.toLowerCase();
  if (/flight|fly|airport|airline/.test(q)) return BOT_RESPONSES.flight;
  if (/hotel|stay|room|resort|accommodation/.test(q)) return BOT_RESPONSES.hotel;
  if (/trip|itinerary|plan|travel|vacation/.test(q)) return BOT_RESPONSES.trip;
  if (/budget|cheap|affordable|under/.test(q)) return BOT_RESPONSES.budget;
  if (/hi|hello|hey|howdy/.test(q)) return BOT_RESPONSES.hello;
  return BOT_RESPONSES.trip; // default to trip planning
}

export function SafarBot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages, typing]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = (text?: string) => {
    const q = (text || input).trim();
    if (!q || typing) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: q,
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Fake typing delay 0.8–1.5s
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: pickResponse(q),
        time: getTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                width: expanded ? 560 : 370,
                height: expanded ? 640 : 520,
              }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-3"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                    <Image
                      src="/logo.png"
                      alt="Safar"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight leading-none">
                      Safar
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span className="text-[11px] text-white/80 font-medium">
                        AI Travel Assistant
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* ── Messages ── */}
              <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
                <div className="space-y-4">
                  {/* Welcome */}
                  {messages.length === 0 && !typing && (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 flex items-center justify-center shadow-inner">
                        <Image
                          src="/logo.png"
                          alt="Safar"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Hi! I&apos;m Safar 👋
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[240px]">
                          Your AI-powered travel companion. Ask me anything
                          about flights, hotels, or trip planning!
                        </p>
                      </div>

                      {/* Quick Chips */}
                      <div className="flex flex-wrap justify-center gap-2 mt-1">
                        {QUICK_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => send(chip)}
                            className="text-xs px-3.5 py-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50 hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors font-medium"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message bubbles */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex gap-2.5",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "bot" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Image
                            src="/logo.png"
                            alt="Safar"
                            width={18}
                            height={18}
                            className="object-contain"
                          />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                          msg.role === "user"
                            ? "bg-teal-600 text-white rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm border border-border"
                        )}
                      >
                        {/* Simple markdown-ish rendering */}
                        {msg.text.split("\n").map((line, i) => {
                          // Bold
                          const parts = line.split(/(\*\*.*?\*\*)/g).map((seg, j) =>
                            seg.startsWith("**") && seg.endsWith("**") ? (
                              <strong key={j}>{seg.slice(2, -2)}</strong>
                            ) : (
                              <span key={j}>{seg}</span>
                            )
                          );
                          return (
                            <p key={i} className={i > 0 ? "mt-1" : ""}>
                              {parts}
                            </p>
                          );
                        })}
                        <span
                          className={cn(
                            "block text-[10px] mt-1.5 select-none",
                            msg.role === "user"
                              ? "text-white/60 text-right"
                              : "text-muted-foreground"
                          )}
                        >
                          {msg.time}
                        </span>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1 ring-1 ring-border">
                          <img
                            src="https://randomuser.me/api/portraits/men/32.jpg"
                            alt="You"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Image
                          src="/logo.png"
                          alt="Safar"
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 border border-border flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* ── Input ── */}
              <div className="px-4 py-3 border-t border-border bg-background/80">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && send()
                    }
                    placeholder="Ask Safar anything..."
                    className="flex-1 bg-muted/50 hover:bg-muted focus:bg-background border border-transparent focus:border-teal-400/50 rounded-full py-2.5 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                    disabled={typing}
                  />
                  <VoiceInput
                    onTranscription={(text) => {
                      setInput(text);
                      setTimeout(() => send(text), 100);
                    }}
                    disabled={typing}
                    className="shrink-0"
                  />
                  <Button
                    size="icon"
                    onClick={() => send()}
                    disabled={!input.trim() || typing}
                    className="rounded-full w-10 h-10 shrink-0 bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-2 select-none">
                  Powered by SafarAI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Floating Toggle Button ── */}
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setOpen(true)}
              className="relative h-24 w-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-xl shadow-teal-500/25 flex items-center justify-center group"
            >
              {/* Ping ring */}
              <span className="absolute inset-0 rounded-full bg-teal-400/30 animate-ping pointer-events-none" />
              {/* Logo */}
              <Image
                src="/logo.png"
                alt="Safar"
                width={80}
                height={80}
                className="object-contain relative z-10 drop-shadow-sm"
              />
              {/* Online dot */}
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background z-20" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
