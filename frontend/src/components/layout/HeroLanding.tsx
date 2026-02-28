"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Sparkles,
  Shield,
  Clock,
  Globe,
  Star,
} from "lucide-react";
import { VoiceInput } from "@/components/features/VoiceInput";
import { Button } from "@/components/ui/button";

/* ─────────────────── Static Data ─────────────────── */

const STATS = [
  { value: "2M+", label: "Happy Travelers", icon: Users },
  { value: "500+", label: "Destinations", icon: Globe },
  { value: "4.8", label: "User Rating", icon: Star },
  { value: "24/7", label: "Expert Support", icon: Clock },
];

const DESTINATIONS = [
  {
    id: 1,
    city: "Bali",
    country: "Indonesia",
    price: "₹32,000",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    tag: "Trending",
  },
  {
    id: 2,
    city: "Paris",
    country: "France",
    price: "₹58,000",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
    tag: "Popular",
  },
  {
    id: 3,
    city: "Swiss Alps",
    country: "Switzerland",
    price: "₹72,000",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    tag: "Adventure",
  },
  {
    id: 4,
    city: "Tokyo",
    country: "Japan",
    price: "₹45,000",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    tag: "Culture",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description:
      "Describe your dream trip in plain language. Our AI curates flights, hotels, and activities tailored to your preferences — in seconds.",
  },
  {
    icon: Shield,
    title: "Best Price Guarantee",
    description:
      "We compare prices across 200+ providers in real-time, ensuring you always get the most competitive rates available.",
  },
  {
    icon: Clock,
    title: "Instant Booking",
    description:
      "From search to confirmation in under 60 seconds. No redirects, no hidden fees — everything finalized in one place.",
  },
];

const PARTNERS = [
  "Amadeus",
  "TBO",
  "Booking.com",
  "Expedia",
  "Skyscanner",
  "Kayak",
];

const STEPS = [
  {
    step: "01",
    title: "Describe your trip",
    desc: "Type or speak what you're looking for — destinations, dates, budget, anything.",
  },
  {
    step: "02",
    title: "Compare options",
    desc: "Our AI searches 200+ providers instantly and presents the best flights, hotels and activities.",
  },
  {
    step: "03",
    title: "Book & go",
    desc: "Select what you love, confirm your itinerary, and you're all set for takeoff.",
  },
];

/* ─────────────────── Component ─────────────────── */

interface HeroLandingProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function HeroLanding({ onSearch, isLoading }: HeroLandingProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [origin, setOrigin] = useState("");
  const [dates, setDates] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [guests, setGuests] = useState("1 Guest");
  const [budget, setBudget] = useState("");

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

  /* ────────── Render ────────── */
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-center overflow-hidden">
        {/* BG image + overlay */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16">
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold text-white tracking-tight leading-[1.08]">
              Plan Smarter.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">
                Travel Better.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
              Search flights, compare hotels, and build complete itineraries
              &mdash; all in one AI&#8209;powered platform.
            </p>
          </motion.div>

          {/* ── Search Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/25 flex items-center p-2 ring-1 ring-white/[0.06]"
            >
              <div className="pl-4 pr-3">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where do you want to go? Try 'flights to Goa from Delhi'..."
                className="flex-1 bg-transparent py-4 text-base text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <div className="flex items-center gap-2 pr-1">
                <VoiceInput onTranscription={handleVoiceResult} />
                <div className="h-6 w-px bg-border" />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-7 h-12 text-sm font-semibold shadow-lg shadow-teal-600/25 transition-all active:scale-[0.97]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Search
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Structured fields */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                {
                  icon: MapPin,
                  label: "From",
                  value: origin,
                  set: setOrigin,
                  ph: "Origin city",
                },
                {
                  icon: MapPin,
                  label: "Where to",
                  value: location,
                  set: setLocation,
                  ph: "Destination",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-white/[0.18] backdrop-blur-md border border-white/[0.25] rounded-xl px-4 py-3 hover:bg-white/[0.28] transition-colors"
                >
                  <label className="text-[10px] uppercase font-semibold text-white/70 tracking-wider flex items-center gap-1 mb-1">
                    <f.icon className="w-3 h-3" /> {f.label}
                  </label>
                  <input
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.ph}
                    className="w-full bg-transparent text-white text-sm font-medium placeholder:text-white/40 outline-none"
                  />
                </div>
              ))}

              {/* Date */}
              <div className="bg-white/[0.18] backdrop-blur-md border border-white/[0.25] rounded-xl px-4 py-3 hover:bg-white/[0.28] transition-colors">
                <label className="text-[10px] uppercase font-semibold text-white/70 tracking-wider flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input
                  type="date"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent text-white text-sm font-medium outline-none [color-scheme:dark]"
                />
              </div>

              {/* Guests */}
              <div className="bg-white/[0.18] backdrop-blur-md border border-white/[0.25] rounded-xl px-4 py-3 hover:bg-white/[0.28] transition-colors">
                <label className="text-[10px] uppercase font-semibold text-white/70 tracking-wider flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3" /> Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-transparent text-white text-sm font-medium outline-none appearance-none cursor-pointer [&>option]:text-black"
                >
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3 Guests</option>
                  <option>4+ Guests</option>
                </select>
              </div>

              {/* Budget */}
              <div className="bg-white/[0.18] backdrop-blur-md border border-white/[0.25] rounded-xl px-4 py-3 hover:bg-white/[0.28] transition-colors col-span-2 md:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-white/70 tracking-wider flex items-center gap-1 mb-1">
                  <Wallet className="w-3 h-3" /> Budget
                </label>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Any budget"
                  className="w-full bg-transparent text-white text-sm font-medium placeholder:text-white/40 outline-none"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — STATS BAR (floating card)
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 -mt-6">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/[0.06] border border-border/50 px-8 py-7 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3 — PARTNER STRIP
      ═══════════════════════════════════════════════ */}
      <section className="pt-14 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.25em] font-semibold mb-5">
            Trusted data from leading travel platforms
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-sm md:text-base font-bold text-muted-foreground/30 tracking-wide select-none"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4 — TRENDING DESTINATIONS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-teal-600 dark:text-teal-400 mb-2">
                Popular right now
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Trending Destinations
              </h2>
            </div>
            <Button
              variant="ghost"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all destinations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DESTINATIONS.map((dest, idx) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.07 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 ring-1 ring-border/40">
                  <Image
                    src={dest.image}
                    alt={dest.city}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-[11px] font-semibold rounded-full text-foreground dark:text-white">
                      {dest.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white/65 text-sm">{dest.country}</p>
                    <h3 className="text-white text-xl font-bold tracking-tight">
                      {dest.city}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm text-muted-foreground">
                    From{" "}
                    <span className="text-foreground font-semibold">
                      {dest.price}
                    </span>
                  </p>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Explore <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — WHY SAFARAI
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-teal-600 dark:text-teal-400 mb-2">
              Why SafarAI
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Travel planning, reinvented
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              We combine artificial intelligence with real-time data from 200+
              providers to deliver the fastest, smartest travel experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="bg-background rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center mb-5">
                  <feat.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 6 — HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-teal-600 dark:text-teal-400 mb-2">
              Simple &amp; fast
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-border" />

            {STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.12 }}
                className="text-center relative"
              >
                <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mx-auto mb-6 border-4 border-background relative z-10">
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 7 — CTA BANNER
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl px-8 py-16 md:px-16 text-center relative overflow-hidden"
          >
            {/* Decorative blurs */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Ready to plan your next adventure?
              </h2>
              <p className="text-base text-white/65 mb-8 max-w-lg mx-auto leading-relaxed">
                Join millions of travelers who plan smarter with SafarAI. Your
                perfect trip is just one search away.
              </p>
              <Button
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="bg-white text-teal-700 hover:bg-white/90 rounded-xl px-8 h-12 text-sm font-bold shadow-xl shadow-black/10 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Start Planning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SafarAI"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-sm font-bold text-foreground">SafarAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {["About", "Privacy", "Terms", "Support"].map((l) => (
              <span
                key={l}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                {l}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; 2026 SafarAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;
