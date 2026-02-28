"use client";

import { Flight, CartItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, ChevronDown, ClipboardList, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlightCard({ flight, compact = false, isInCart = false, onAddToCart }: { flight: Flight; compact?: boolean; isInCart?: boolean; onAddToCart?: (item: CartItem) => void }) {
  // Parsing dates
  const dep = new Date(flight.departure_time);
  // Amadeus might not return arrival time in search results sometimes, so we estimate used duration
  const arr = flight.arrival_time 
    ? new Date(flight.arrival_time)
    : new Date(dep.getTime() + (flight.duration_hours || 2) * 60 * 60 * 1000);

  const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  // const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", weekday: "short" });
  
  // Format price in Indian Rupee
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(flight.price);

  // Airline Logic (for demo purposes)
  const airlineName = flight.airline;
  const airlineCode = flight.carrier_code || flight.airline.substring(0, 2).toUpperCase();
  // Logo URL from public flight CDN
  const logoUrl = `https://pics.avs.io/200/200/${airlineCode}.png`;
  
  return (
    <Card className="group mb-3 relative bg-white hover:shadow-lg transition-all duration-300 border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-teal-400">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center p-3 md:p-4 gap-3 md:gap-4">
            
            {/* 1. Airline Logo & Name */}
            <div className="flex items-center gap-3 w-full md:w-[25%] shrink-0">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-lg p-0.5 border border-slate-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={airlineName} className="w-full h-full object-contain" 
                       onError={(e) => {
                          e.currentTarget.style.display="none"; 
                          // When image fails, show the text fallback by removing 'hidden' class from sibling
                          e.currentTarget.parentElement?.querySelector('span')?.classList.remove('hidden');
                       }}
                  />
                  <span className="hidden font-bold text-slate-500 text-xs">{airlineCode}</span>
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm md:text-base leading-tight truncate">{airlineName}</h4>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block border border-slate-100">
                        {flight.carrier_code}-{flight.flight_number}
                    </span>
                </div>
            </div>

            {/* 2. Flight Path (Center Cluster) */}
            <div className="flex flex-1 items-center justify-between gap-2 md:gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                {/* DEPARTURE */}
                <div className="text-left w-[60px]">
                    <p className="text-lg md:text-xl font-black text-slate-800 leading-none">{formatTime(dep)}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase">{flight.origin}</p>
                </div>

                {/* DURATION GRAPHIC */}
                <div className="flex flex-col items-center flex-1 px-2">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5 tracking-wide">{flight.duration_hours}h {flight.stops > 0 ? `(${flight.stops} stop)` : ""}</span>
                    <div className="w-full flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <div className="h-[1.5px] w-full bg-slate-200 relative">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                                <Plane className="w-3 h-3 text-slate-400 fill-slate-50 rotate-90" />
                             </div>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    </div>
                    <span className="text-[9px] font-semibold text-green-600 mt-0.5">
                        {flight.stops === 0 ? "Non-stop" : `${flight.stops} StopVia`}
                    </span>
                </div>

                {/* ARRIVAL */}
                <div className="text-right w-[60px]">
                    <p className="text-lg md:text-xl font-black text-slate-800 leading-none">{formatTime(arr)}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase">{flight.destination}</p>
                </div>
            </div>

            {/* 3. Price & Action (Right) */}
            <div className="flex flex-row md:flex-col items-center justify-between md:items-end md:justify-center w-full md:w-[20%] shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 pl-0 md:pl-4 md:border-l md:border-slate-100 h-full gap-2 md:gap-1">
                 <div className="text-left md:text-right">
                     <p className="text-lg md:text-xl font-black text-slate-900 leading-none tracking-tight">{formattedPrice}</p>
                     <p className="text-[10px] text-slate-400 font-medium">per traveler</p>
                 </div>
                 
                 <Button 
                    className={cn(
                      "h-8 px-4 font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 w-auto md:w-full max-w-[120px] gap-1.5",
                      isInCart
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    )}
                    onClick={() => {
                      if (!isInCart && onAddToCart) {
                        onAddToCart({
                          id: `flight-${flight.id}`,
                          type: "flight",
                          name: `${flight.airline} ${flight.carrier_code}-${flight.flight_number}`,
                          price: flight.price,
                          quantity: 1,
                          image_url: `https://pics.avs.io/200/200/${airlineCode}.png`,
                          details: `${flight.origin} \u2192 ${flight.destination} \u2022 ${flight.duration_hours}h \u2022 ${flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}`,
                          originalData: flight,
                        });
                      }
                    }}
                    disabled={isInCart}
                 >
                    {isInCart ? (
                      <><Check className="w-3 h-3" /> Added</>
                    ) : (
                      <><ClipboardList className="w-3 h-3" /> Add</>
                    )}
                 </Button>
            </div>
        </div>
        
        {/* Footer Bar */}
        <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Partially Refundable</span>
            <button className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-800 transition-colors">
                Flight Details <ChevronDown className="w-3 h-3" />
            </button>
        </div>
      </CardContent>
    </Card>
  );
}
