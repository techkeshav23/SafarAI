"use client";

import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  X,
  Globe,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  transparent?: boolean;
}

export function Navbar({ activeTab = "all", onTabChange, transparent = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute final state: transparent only if requested AND not scrolled
  const isTransparent = transparent && !isScrolled;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isTransparent 
          ? "bg-transparent border-transparent py-4" 
          : "bg-background/80 backdrop-blur-md border-b border-border py-2 shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-105",
            isTransparent ? "bg-white/20 text-white backdrop-blur-sm" : "bg-primary text-primary-foreground"
          )}>
            <Globe className="h-6 w-6 animate-pulse-slow" />
          </div>
          <span className={cn(
            "text-xl font-bold tracking-tight transition-colors",
            isTransparent ? "text-white drop-shadow-md" : "text-foreground"
          )}>
            Voyage<span className={cn("font-light", isTransparent ? "text-white/80" : "text-primary")}>AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 mx-8">
           {/* Navigation removed as per requirement */}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
            {/* Quick Search (Only visible on scroll or non-transparent pages) */}
            <div className={cn(
                "hidden lg:flex relative transition-all duration-300 w-64",
                isTransparent ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"
            )}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Quick search..." 
                    className="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background transition-colors"
                />
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "rounded-full relative",
                    isTransparent ? "text-white hover:bg-white/10" : "text-muted-foreground hover:bg-muted"
                )}
            >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border/50">
                <div className="text-right">
                    <p className={cn(
                        "text-sm font-medium leading-none",
                        isTransparent ? "text-white" : "text-foreground"
                    )}>
                        Traveler
                    </p>
                    <p className={cn(
                        "text-[10px] uppercase tracking-wider font-bold mt-0.5",
                        isTransparent ? "text-white/70" : "text-muted-foreground"
                    )}>Pro</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 p-[2px]">
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className={cn("md:hidden", isTransparent ? "text-white" : "text-foreground")}
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
        </div>
      </div>

      {/* Sub-header Removed */}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-xl md:hidden animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                </Button>
                <Button variant="ghost" className="justify-start text-destructive hover:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
            </div>
        </div>
      )}
    </header>
  );
}
