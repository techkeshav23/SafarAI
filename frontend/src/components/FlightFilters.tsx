"use client";

import { useState, useEffect, useMemo } from "react";
import { Flight } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FlightFilterState {
  stops: string[]; // "0", "1", "2+"
  airlines: string[];
  departureTime: string[]; // "morning", "afternoon", "evening", "night"
}

interface FlightFiltersProps {
  flights: Flight[];
  onFilterChange: (filteredFlights: Flight[]) => void;
}

export function FlightFilters({ flights, onFilterChange }: FlightFiltersProps) {
  const [filters, setFilters] = useState<FlightFilterState>({
    stops: [],
    airlines: [],
    departureTime: [],
  });

  // Extract unique airlines and their min prices
  const airlineStats = useMemo(() => {
    const stats: Record<string, { name: string; minPrice: number; code: string }> = {};
    flights.forEach((f) => {
      const code = f.carrier_code || f.airline.substring(0, 2).toUpperCase();
      if (!stats[f.airline]) {
        stats[f.airline] = { name: f.airline, minPrice: f.price, code };
      } else {
        stats[f.airline].minPrice = Math.min(stats[f.airline].minPrice, f.price);
      }
    });
    return Object.values(stats).sort((a, b) => a.minPrice - b.minPrice);
  }, [flights]);

  // Extract stop options (0, 1, 2+)
  const stopStats = useMemo(() => {
      const stats = { "0": Infinity, "1": Infinity, "2+": Infinity };
      flights.forEach(f => {
          if (f.stops === 0) stats["0"] = Math.min(stats["0"], f.price);
          else if (f.stops === 1) stats["1"] = Math.min(stats["1"], f.price);
          else stats["2+"] = Math.min(stats["2+"], f.price);
      });
      return stats;
  }, [flights]);

  // Apply filters
  useEffect(() => {
    const filtered = flights.filter((f) => {
      // 1. Stops
      if (filters.stops.length > 0) {
        const stopKey = f.stops === 0 ? "0" : f.stops === 1 ? "1" : "2+";
        if (!filters.stops.includes(stopKey)) return false;
      }

      // 2. Airlines
      if (filters.airlines.length > 0) {
        if (!filters.airlines.includes(f.airline)) return false;
      }

      // 3. Departure Time
      if (filters.departureTime.length > 0) {
        const hour = new Date(f.departure_time).getHours();
        let period = "";
        if (hour >= 0 && hour < 6) period = "before_6am";
        else if (hour >= 6 && hour < 12) period = "morning"; // 6AM - 12PM
        else if (hour >= 12 && hour < 18) period = "afternoon"; // 12PM - 6PM
        else period = "evening"; // 6PM - 12AM (night)
        
        // Match specific MMT buckets roughly
        // MMT: Before 6AM, 6AM-12PM, 12PM-6PM, After 6PM
        const isMatch = filters.departureTime.some(t => {
            if (t === "before_6am") return hour < 6;
            if (t === "morning") return hour >= 6 && hour < 12;
            if (t === "afternoon") return hour >= 12 && hour < 18;
            if (t === "evening") return hour >= 18;
            return false;
        });
        if (!isMatch) return false;
      }

      return true;
    });

    onFilterChange(filtered);
  }, [filters, flights, onFilterChange]);

  const toggleFilter = (category: keyof FlightFilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  const formatPrice = (price: number) => {
    if (price === Infinity) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (

    <div className="w-[240px] shrink-0 space-y-6 pr-2 hidden md:block">
      {/* Stops */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Popular Filters</h3>
        <div className="space-y-2">
            {[
                { label: "Non Stop", val: "0", price: stopStats["0"] },
                { label: "1 Stop", val: "1", price: stopStats["1"] },
                // { label: "2+ Stops", val: "2+", price: stopStats["2+"] }
            ].map((opt) => opt.price !== Infinity && (
                <div key={opt.val} className="flex items-center justify-between group cursor-pointer" onClick={() => toggleFilter("stops", opt.val)}>
                    <div className="flex items-center gap-2">
                         <Checkbox 
                            id={`stop-${opt.val}`} 
                            checked={filters.stops.includes(opt.val)}
                            className="w-4 h-4 rounded-[2px] border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                         />
                         <Label htmlFor={`stop-${opt.val}`} className="text-sm font-normal text-slate-700 cursor-pointer pointer-events-none">{opt.label}</Label>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{formatPrice(opt.price)}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Departure Time */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Departure Time</h3>
        <div className="space-y-2">
            {[
                { label: "Before 6 AM", val: "before_6am" },
                { label: "6 AM - 12 PM", val: "morning" },
                { label: "12 PM - 6 PM", val: "afternoon" },
                { label: "After 6 PM", val: "evening" }
            ].map((opt) => (
                <div key={opt.val} className="flex items-center gap-2 group cursor-pointer" onClick={() => toggleFilter("departureTime", opt.val)}>
                     <Checkbox 
                        id={`time-${opt.val}`} 
                        checked={filters.departureTime.includes(opt.val)}
                        className="w-4 h-4 rounded-[2px] border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                     />
                     <Label htmlFor={`time-${opt.val}`} className="text-sm font-normal text-slate-700 cursor-pointer pointer-events-none">{opt.label}</Label>
                </div>
            ))}
        </div>
      </div>

      {/* Airlines */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Airlines</h3>
        <div className="space-y-2">
            {airlineStats.map((airline) => (
                <div key={airline.name} className="flex items-center justify-between group cursor-pointer" onClick={() => toggleFilter("airlines", airline.name)}>
                    <div className="flex items-center gap-2">
                         <Checkbox 
                            id={`algo-${airline.name}`} 
                            checked={filters.airlines.includes(airline.name)}
                            className="w-4 h-4 rounded-[2px] border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                         />
                         <div className="flex items-center gap-2 pointer-events-none">
                             {/* Small Logo */}
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={`https://pics.avs.io/60/60/${airline.code}.png`} alt="" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display="none"} />
                             <Label htmlFor={`algo-${airline.name}`} className="text-sm font-normal text-slate-700 cursor-pointer truncate max-w-[100px]">{airline.name}</Label>
                         </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{formatPrice(airline.minPrice)}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
