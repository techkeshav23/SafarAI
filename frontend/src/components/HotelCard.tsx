"use client";

import { useState } from "react";
import { Hotel } from "@/lib/types";
import { preBookHotel } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, BedDouble, UtensilsCrossed, ShieldCheck, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const [showRooms, setShowRooms] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<string | null>(null);

  const isTbo = hotel.source === "tbo";
  const isMock = hotel.source === "mock";
  const displayPrice = isTbo && hotel.total_fare
    ? hotel.total_fare
    : hotel.price_per_night;
  const priceLabel = isTbo && hotel.total_fare ? "total" : "/night";

  const handlePreBook = async (bookingCode: string) => {
    setBooking(true);
    setBookingResult(null);
    try {
      const result = await preBookHotel(bookingCode);
      if (result && (result.Status?.Code === 200 || result.PreBookResult?.Status === "Success" || result.item_id)) {
        setBookingResult("✅ Room blocked! Proceeding...");
      } else {
        setBookingResult(`⚠️ ${result.Status?.Description || "Not available"}`);
      }
    } catch {
      setBookingResult("❌ Error. Try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-200/60 bg-white h-full flex flex-col">
      <div className="relative h-48 overflow-hidden shrink-0">
        <Image
          src={hotel.image_url || "/placeholder-hotel.jpg"}
          alt={hotel.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        {isTbo && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live Deal
          </div>
        )}
        {isMock && (
          <div className="absolute top-3 left-3 bg-amber-50/90 backdrop-blur-md text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Sample
          </div>
        )}
        
        {hotel.match_score != null && hotel.match_score > 0 && (
          <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 border border-emerald-400/50">
             <Sparkles className="w-3 h-3 text-emerald-100" />
            {Math.min(Math.round(hotel.match_score), 100)}% Match
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-sm font-medium flex items-center gap-1 opacity-95 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {hotel.city}
            </p>
        </div>
      </div>
      
      <CardHeader className="pb-3 pt-4 px-5 space-y-1">
        <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
                <CardTitle className="text-lg leading-tight font-bold text-slate-800 line-clamp-1" title={hotel.name}>
                    {hotel.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < (hotel.star_rating || Math.round(hotel.rating)) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} 
                        />
                    ))}
                    <span className="text-xs text-slate-400 ml-1 font-medium">
                        ({hotel.rating ? hotel.rating : "New"})
                    </span>
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className="text-xl font-bold text-blue-600 flex items-center justify-end leading-none">
                    <span className="text-sm font-normal text-slate-400 mr-0.5">₹</span>
                    {Math.round(displayPrice).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                  {priceLabel}
                </span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-5 pb-5 flex-1 flex flex-col">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {hotel.description || "Experience comfort and luxury at this top-rated property, offering premium amenities and easy access to local attractions."}
        </p>

        {/* Amenities / Facilities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 3).map((a) => (
              <span key={a} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100">
                {a}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-1 text-[10px] font-medium text-slate-400">
                    +{hotel.amenities.length - 3}
                </span>
            )}
          </div>
        )}

        <div className="space-y-3 mt-auto pt-2">
            {hotel.match_reason && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg flex gap-2 items-start">
                <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                <span className="leading-tight">{hotel.match_reason}</span>
              </div>
            )}

            {isTbo && hotel.rooms && hotel.rooms.length > 0 && (
               <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                  <button
                    onClick={() => setShowRooms(!showRooms)}
                    className="w-full px-3 py-2 text-xs flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5" />
                        {hotel.rooms.length} Room Options
                    </span>
                    <span className="text-blue-600 font-semibold">{showRooms ? "Hide" : "View"}</span>
                  </button>
                  
                  {showRooms && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-100 bg-white">
                        {hotel.rooms.slice(0, 2).map((room, idx) => (
                             <div key={idx} className="pt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-slate-700 line-clamp-1">{room.room_name || room.room_type}</span>
                                    <span className="text-[10px] font-bold text-blue-600">₹{Math.round(room.total_fare).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex gap-2 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-0.5"><UtensilsCrossed className="w-2.5 h-2.5"/> {room.meal_type}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                  )}
               </div>
            )}

            <div className="pt-1">
                {isMock ? (
                    <Button variant="outline" className="w-full text-sm font-medium border-amber-200 text-amber-700 hover:text-amber-800 hover:border-amber-300 hover:bg-amber-50 rounded-xl h-9">
                        Sample Listing
                    </Button>
                ) : isTbo && hotel.rooms?.[0]?.booking_code ? (
                    <Button 
                        className={cn(
                            "w-full text-sm font-semibold rounded-xl shadow-md h-9 transition-all",
                            bookingResult?.includes("✅") 
                                ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" 
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
                        )}
                        onClick={() => hotel.rooms?.[0]?.booking_code && handlePreBook(hotel.rooms[0].booking_code)}
                        disabled={booking || (!!bookingResult && bookingResult.includes("✅"))}
                    >
                        {booking ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Checking...</>
                        ) : bookingResult ? (
                            <span className="flex items-center gap-1.5">
                                {bookingResult.includes("✅") ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {bookingResult}
                            </span>
                        ) : (
                            "Book Best Price"
                        )}
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full text-sm font-medium border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl h-9">
                        View Details
                    </Button>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

