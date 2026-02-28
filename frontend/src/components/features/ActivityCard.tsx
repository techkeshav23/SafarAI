"use client";

import { Activity } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, Heart, ClipboardList, Check, Plus, Minus } from "lucide-react";
import Image from "next/image";

interface ActivityCardProps {
  activity: Activity;
  cartQuantity?: number;
  onAddToCart?: (activity: Activity) => void;
  onRemoveFromCart?: (activityId: string) => void;
}

export function ActivityCard({ activity, cartQuantity = 0, onAddToCart, onRemoveFromCart }: ActivityCardProps) {
  const isInCart = cartQuantity > 0;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-200/60 bg-white h-full flex flex-col">
      <div className="relative h-48 overflow-hidden shrink-0">
        <Image
          src={activity.image_url}
          alt={activity.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white shadow-sm font-semibold border-none">
            {activity.category}
        </Badge>
        
        <div className="absolute top-3 right-3">
             <button className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors text-white">
                <Heart className="w-4 h-4" />
             </button>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between">
           <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
               <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
               <span className="text-xs font-bold">{activity.rating}</span>
           </div>
           <div className="text-xl font-bold text-white flex items-center leading-none drop-shadow-sm">
                <span className="text-xs font-medium opacity-80 mr-0.5">₹</span>
                {activity.price.toLocaleString('en-IN')}
           </div>
        </div>
      </div>
      
      <CardContent className="pt-4 px-5 pb-5 flex-1 flex flex-col space-y-3">
        <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1 group-hover:text-teal-600 transition-colors">
                {activity.name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {activity.duration_hours}h duration
                </span>
                <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Guided Tour
                </span>
            </div>
        </div>
        
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {activity.description}
        </p>
        
        {isInCart ? (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={() => onRemoveFromCart?.(activity.id)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Check className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">{cartQuantity} added</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors"
              onClick={() => onAddToCart?.(activity)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9 mt-2 shadow-lg shadow-slate-200 gap-2"
            onClick={() => onAddToCart?.(activity)}
          >
            <ClipboardList className="w-4 h-4" />
            Add to Itinerary
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
