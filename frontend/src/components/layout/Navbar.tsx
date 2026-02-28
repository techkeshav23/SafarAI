"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  transparent?: boolean;
  cartCount?: number;
  cartTotal?: number;
}

export function Navbar({ activeTab = "all", onTabChange, transparent = false, cartCount = 0, cartTotal = 0 }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTransparent = transparent && !isScrolled;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isTransparent 
          ? "bg-transparent" 
          : "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
      )}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo — left */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-24 h-16 flex items-center justify-center transition-all duration-200 overflow-hidden group-hover:scale-105 shrink-0">
              <Image src="/logo.png" alt="SafarAI" width={96} height={64} className="object-contain" />
            </div>
            <span className={cn(
              "text-3xl font-bold tracking-tight transition-colors hidden sm:inline-flex items-baseline",
              isTransparent ? "text-white drop-shadow-md" : "text-foreground"
            )}>
              Safar<span className={cn("font-normal", isTransparent ? "text-white/75" : "text-primary")}>AI</span>
            </span>
          </Link>

          {/* Center spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">


            {/* Divider */}
            <div className={cn(
              "hidden sm:block w-px h-7 mx-0.5",
              isTransparent ? "bg-white/20" : "bg-border"
            )} />

            {/* Profile */}
            <button className="hidden sm:flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors">
              <div className="text-right leading-tight">
                <p className={cn(
                  "text-sm font-medium",
                  isTransparent ? "text-white" : "text-foreground"
                )}>
                  Dhruv Khare
                </p>
                <p className={cn(
                  "text-[10px] uppercase tracking-widest font-semibold",
                  isTransparent ? "text-white/60" : "text-muted-foreground"
                )}>
                  Pro
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-amber-400 p-[1.5px] shrink-0">
                <div className="h-full w-full rounded-full overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Dhruv Khare" className="h-full w-full object-cover" />
                </div>
              </div>
            </button>

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "sm:hidden h-9 w-9 rounded-lg",
                isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/60"
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-3 shadow-xl sm:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg bg-muted/40">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-amber-400 p-[1.5px] shrink-0">
                <div className="h-full w-full rounded-full overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Dhruv Khare" className="h-full w-full object-cover" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Dhruv Khare</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Pro</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="justify-start h-10 rounded-lg">
              <Settings className="w-4 h-4 mr-2.5" /> Settings
            </Button>
            <Button variant="ghost" size="sm" className="justify-start h-10 rounded-lg text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2.5" /> Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
