"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  Users,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

export interface FilterData {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  budgetMin: number;
  budgetMax: number;
}

export interface FilterInitialData {
  destination?: string;
  origin?: string;
  checkIn?: string;
  checkOut?: string;
}

interface RefinedFiltersProps {
  onApplyFilters: (filters: FilterData) => void;
  initialData?: FilterInitialData;
  className?: string;
}

export function RefinedFilters({ onApplyFilters, initialData, className }: RefinedFiltersProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // Default: start date is tomorrow, end date is empty for flexibility
  const [dateRange, setDateRange] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const start = d.toISOString().split("T")[0];
    return { start, end: "" };
  });
  const [budget, setBudget] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [travelers, setTravelers] = useState(1);

  // Sync fields when agent results arrive
  useEffect(() => {
    if (initialData?.destination) setTo(initialData.destination);
    if (initialData?.origin) setFrom(initialData.origin);
    if (initialData?.checkIn) {
      setDateRange({
        start: initialData.checkIn || "",
        end: initialData.checkOut || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.destination, initialData?.origin, initialData?.checkIn]);
  
  const handleApply = () => {
    onApplyFilters({
      from,
      to,
      departureDate: dateRange.start,
      returnDate: dateRange.end,
      budgetMin: budget.min,
      budgetMax: budget.max,
    });
  };

  return (
    <div className={cn("w-full bg-background border-y border-border px-4 py-3 flex items-center shadow-sm z-40 sticky top-14 overflow-x-auto no-scrollbar gap-2", className)}>
        
        {/* From */}
        <div className="flex items-center bg-muted/40 rounded-full border border-border/50 px-3 py-1.5 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20 transition-all min-w-[180px] shrink-0">
             <Briefcase className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
             <Input 
                 className="border-none h-auto p-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground truncated" 
                 placeholder="From?" 
                 value={from}
                 onChange={(e) => setFrom(e.target.value)}
             />
        </div>

        {/* To */}
        <div className="flex items-center bg-muted/40 rounded-full border border-border/50 px-3 py-1.5 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20 transition-all min-w-[180px] shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <Input 
                className="border-none h-auto p-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground truncated" 
                placeholder="Where to?" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
            />
        </div>

        <div className="h-6 w-px bg-border/60 mx-1 hidden md:block shrink-0" />

        {/* Date Picker Trigger (Mock) */}
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/50 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground font-normal shrink-0 h-9 px-3">
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    <span className="text-xs truncate max-w-[100px]">
                        {dateRange.start ? `${dateRange.start}` : "Travel Dates"}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Travel Dates</h4>
                    <div className="grid gap-4">
                         {/* Departure - Always Visible */}
                         <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Departure</label>
                            <Input 
                                type="date" 
                                className="block w-full"
                                min={new Date().toISOString().split("T")[0]} 
                                value={dateRange.start} 
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} 
                            />
                         </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>

        {/* Travelers Trigger */}
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/50 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground font-normal shrink-0 h-9 px-3">
                    <Users className="w-3.5 h-3.5 mr-2" />
                    <span className="text-xs">{travelers} Guest{travelers !== 1 ? 's' : ''}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-4">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Travelers</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Adults</span>
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setTravelers(Math.max(1, travelers - 1))}>-</Button>
                            <span className="w-4 text-center">{travelers}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setTravelers(travelers + 1)}>+</Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>

        {/* Budget Trigger */}
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/50 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground font-normal shrink-0 h-9 px-3">
                    <DollarSign className="w-3.5 h-3.5 mr-2" />
                    <span className="text-xs">
                        {budget.max < 100000 ? `<₹${budget.max.toLocaleString('en-IN')}` : "Budget"}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4">
                 <div className="space-y-4">
                    <div className="flex justify-between">
                        <h4 className="font-medium leading-none">Max Budget</h4>
                        <span className="text-sm text-green-600 font-bold">₹{budget.max.toLocaleString('en-IN')}</span>
                    </div>
                    <Input 
                        type="range" 
                        min={1000} 
                        max={200000} 
                        step={1000} 
                        value={budget.max} 
                        onChange={(e) => setBudget(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹1,000</span>
                        <span>₹2L+</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>


        <div className="flex-1" />

         <Button 
            size="sm" 
            className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 shrink-0"
            onClick={handleApply}
        >
            <Filter className="w-3.5 h-3.5 mr-2" />
            Apply
         </Button>
    </div>
  );
}
