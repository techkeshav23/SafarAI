"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Wallet,
} from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



/* ── Trending Cards ── */
const TRENDING_CARDS = [
  {
    id: 1,
    title: "Eco-Luxury in Bali",
    subtitle: "Sustainable stays & hidden temples",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    tag: "Trending",
  },
  {
    id: 2,
    title: "Parisian Romance",
    subtitle: "Seine cruise & Eiffel views",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80",
    tag: "Best Value",
  },
  {
    id: 3,
    title: "Swiss Alps Adventure",
    subtitle: "Skiing, hiking & scenic trains",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    tag: "Adventure",
  },
  {
    id: 4,
    title: "Tokyo Neon Nights",
    subtitle: "Street food & tech culture",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    tag: "Urban",
  },
];

interface HeroLandingProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function HeroLanding({ onSearch, isLoading }: HeroLandingProps) {
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Structured search state
  const [location, setLocation] = useState("");
  const [origin, setOrigin] = useState("");
  // Default to tomorrow's date
  const [dates, setDates] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [guests, setGuests] = useState("1 Guest");
  const [budget, setBudget] = useState("");

  // Handle scroll for navbar transparency effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    } else if (location || origin) {
        const parts = [];
        if (location) parts.push(`Trip to ${location}`);
        if (origin) parts.push(`from ${origin}`);
        if (dates) parts.push(`on ${dates}`);
        if (guests) parts.push(`for ${guests}`);
        if (budget) parts.push(`budget ${budget}`);
        onSearch(parts.join(" "));
    }
  };

  const handleVoiceResult = (text: string) => {
    setQuery(text);
    onSearch(text);
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* ── Background & Hero Section ── */}
      <div className="relative w-full h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Abstract/Image Background */}
        <div className="absolute inset-0 z-0 select-none">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background z-10" />
            <Image
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
                alt="Travel Background"
                fill
                className="object-cover transition-transform duration-[20s] hover:scale-105 select-none pointer-events-none"
                priority
            />
        </div>

        {/* ── Main Content ── */}
        <div className="relative z-20 w-full max-w-5xl px-4 flex flex-col items-center text-center space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-xl">
              Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-400">Unseen</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light drop-shadow-md leading-relaxed">
              Discover flights, hotels, and experiences with a single thought. Just ask, upload, or dream.
            </p>
          </motion.div>

          {/* ── Unified Search Bar ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-3xl"
          >
            <div className="relative group/search mb-6">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400/50 to-blue-500/50 rounded-2xl blur-lg opacity-30 group-hover/search:opacity-60 transition duration-500"></div>
              
              <form onSubmit={handleSearchSubmit} className="relative bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center p-2 border border-white/20 ring-1 ring-white/20">
                
                <div className="pl-4 pr-3">
                   <Search className="w-6 h-6 text-muted-foreground/60" /> 
                </div>
                
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your dream trip... (e.g. 'Romantic getaway to Paris under $2000')"
                  className="flex-1 border-none outline-none bg-transparent py-4 text-lg text-foreground placeholder:text-muted-foreground/60 w-full"
                />

                <div className="flex items-center gap-1.5 pr-1.5">
                    {/* Voice Search */}
                    <div className="hover:bg-muted/50 rounded-lg transition-colors p-1">
                         <VoiceInput onTranscription={handleVoiceResult} />
                    </div>

                    <div className="h-8 w-[1px] bg-border mx-1" />
                    
                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        size="icon" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-12 h-12 shadow-lg transition-all hover:scale-105 active:scale-95"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowRight className="w-6 h-6" />
                        )}
                    </Button>
                </div>
              </form>
            </div>

            {/* ── Structured Search Inputs ── */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 md:p-3 border border-white/20 shadow-xl grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 items-center">
                
                {/* Destination */}
                <div className="col-span-2 md:col-span-1 relative px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                    <label className="text-[10px] uppercase font-bold text-teal-200 tracking-wider mb-0.5 block flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Where to?
                    </label>
                    <input 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Destination"
                        className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 font-medium text-sm"
                    />
                </div>

                {/* Origin */}
                <div className="col-span-2 md:col-span-1 relative px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                    <label className="text-[10px] uppercase font-bold text-teal-200 tracking-wider mb-0.5 block flex items-center gap-1">
                         From?
                    </label>
                    <input 
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Origin City"
                        className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 font-medium text-sm"
                    />
                </div>

                        {/* Date (Switchable) */}
                <div className="col-span-1 relative px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                    <label className="text-[10px] uppercase font-bold text-teal-200 tracking-wider mb-0.5 block flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                    </label>
                    <input 
                        type="date"
                        value={dates}
                        onChange={(e) => setDates(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 font-medium text-sm [color-scheme:dark]"
                    />
                </div>

                {/* Guests */}
                <div className="col-span-1 relative px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                    <label className="text-[10px] uppercase font-bold text-teal-200 tracking-wider mb-0.5 block flex items-center gap-1">
                        <Users className="w-3 h-3" /> Guests
                    </label>
                    <select 
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-white font-medium text-sm appearance-none cursor-pointer [&>option]:text-black"
                    >
                        <option>1 Guest</option>
                        <option>2 Guests</option>
                        <option>3 Guests</option>
                        <option>4+ Guests</option>
                    </select>
                </div>

                 {/* Budget */}
                 <div className="col-span-2 md:col-span-1 relative px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                    <label className="text-[10px] uppercase font-bold text-teal-200 tracking-wider mb-0.5 block flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Budget
                    </label>
                    <input 
                         value={budget}
                         onChange={(e) => setBudget(e.target.value)}
                         placeholder="$ Any"
                         className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 font-medium text-sm"
                    />
                </div>
            </div>

          </motion.div>

        </div>
      </div>

      {/* ── Trending Section ── */}
      <div className="relative z-10 -mt-20 bg-background rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pt-16 pb-24 px-6 md:px-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">
                Trending Destinations
              </h2>
              <p className="text-muted-foreground mt-2 font-light">Curated experiences just for you</p>
            </div>
            <Button variant="outline" className="hidden md:flex gap-2 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">
                View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRENDING_CARDS.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 ring-1 ring-border/50"
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                        {card.tag}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-teal-200 transition-colors drop-shadow-md">{card.title}</h3>
                  <p className="text-white/80 text-sm line-clamp-2 mb-4 font-light">{card.subtitle}</p>
                  
                  <div className="flex items-center gap-2 text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <span className="font-medium underline decoration-teal-400 decoration-2 underline-offset-4">Explore Trip</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroLanding;
