// ─── Helpers ────────────────────────────────────────────────────
// Extracted from agentService.js to maintain modularity

import { getHotelDetails as tboGetHotelDetails } from "../tboApi.js";

// Date Helpers
export function getDefaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 1); // tomorrow
  return d.toISOString().split("T")[0];
}

export function getDefaultCheckOut(checkIn) {
  const d = checkIn ? new Date(checkIn) : new Date();
  if (!checkIn) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 2); // check-in + 2 days
  return d.toISOString().split("T")[0];
}

// TBO Transform Helper
export function transformTboHotel(searchResult, detailsMap = {}, destCity = "") {
  const code = String(searchResult.HotelCode);
  // Ensure strict string matching for details lookup
  const details =
    detailsMap[code] ||
    Object.values(detailsMap).find((d) => String(d.HotelCode) === code) ||
    {};

  const rooms = searchResult.Rooms || [];
  const cheapestRoom = rooms.reduce(
    (min, r) =>
      (r.TotalFare || Infinity) < (min.TotalFare || Infinity) ? r : min,
    rooms[0] || {}
  );

  // TBO staging returns USD — convert to INR for display
  const USD_TO_INR = 84.5;
  const rawPrice = cheapestRoom.DayRates?.[0]?.[0]?.BasePrice || cheapestRoom.TotalFare || 0;
  const rawTotal = cheapestRoom.TotalFare || 0;
  const rawTax = cheapestRoom.TotalTax || 0;
  const isUsd = (searchResult.Currency || "USD") === "USD";
  const inrPrice = isUsd ? Math.round(rawPrice * USD_TO_INR) : rawPrice;
  const inrTotal = isUsd ? Math.round(rawTotal * USD_TO_INR) : rawTotal;
  const inrTax = isUsd ? Math.round(rawTax * USD_TO_INR) : rawTax;

  return {
    id: code,
    name: details.HotelName || `Hotel in ${destCity || "this area"}`,
    city: details.Address || details.CityName || destCity || "Unknown City",
    country: details.CountryName || "",
    description: details.Description || details.HotelName || "",
    price_per_night: inrPrice,
    total_fare: inrTotal,
    currency: "INR",
    tax: inrTax,
    rating: details.HotelRating ? parseFloat(details.HotelRating) : 0,
    star_rating: details.StarRating || 0,
    amenities: (details.HotelFacilities || []).slice(0, 8),
    image_url:
      details.Images?.[0] ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    latitude: details.Latitude || 0,
    longitude: details.Longitude || 0,
    style_tags: [],
    match_score: null,
    match_reason: null,
    hotel_code: code,
    booking_code: cheapestRoom.BookingCode || null,
    rooms: rooms.map((r) => ({
      room_name: (r.Name || []).join(", ") || "Standard Room",
      booking_code: r.BookingCode || null,
      inclusion: r.Inclusion || "",
      meal_type: (r.MealType || "Room_Only").replace(/_/g, " "),
      total_fare: isUsd ? Math.round((r.TotalFare || 0) * USD_TO_INR) : (r.TotalFare || 0),
      total_tax: isUsd ? Math.round((r.TotalTax || 0) * USD_TO_INR) : (r.TotalTax || 0),
      is_refundable: r.IsRefundable || false,
      cancel_policies: r.CancelPolicies || [],
      day_rates: r.DayRates || [],
      promotions: r.RoomPromotion || [],
    })),
    source: "tbo",
  };
}

export async function fetchHotelDetailsMap(hotelCodes) {
  if (!hotelCodes || hotelCodes.length === 0) return {};
  const map = {};

  // Batch in chunks of 5 to avoid TBO 500 errors on large requests
  const CHUNK_SIZE = 5;
  for (let i = 0; i < hotelCodes.length; i += CHUNK_SIZE) {
    const chunk = hotelCodes.slice(i, i + CHUNK_SIZE);
    try {
      const codes = chunk.join(",");
      console.log(`[HotelDetails] Fetching details for chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${codes}`);
      const data = await tboGetHotelDetails(codes);
      const results = data.HotelDetails || [];
      if (Array.isArray(results)) {
        for (const d of results) {
          if (d.HotelCode) map[String(d.HotelCode)] = d;
        }
      }
      // If this chunk returned a 500 / error, just skip it
      if (data.Status && data.Status.Code === 500) {
        console.warn(`[HotelDetails] Chunk ${Math.floor(i / CHUNK_SIZE) + 1} returned 500, skipping`);
      }
    } catch (err) {
      console.error(`[HotelDetails] Chunk error: ${err.message}`);
      // Continue with remaining chunks
    }
  }

  console.log(`[HotelDetails] Resolved ${Object.keys(map).length}/${hotelCodes.length} hotel details`);
  return map;
}

// UI Action Builder
export function buildMapActions(collected) {
  const actions = [];

  // Fly to destination based on top hotel coordinates
  if (collected.hotels.length > 0) {
    const topHotel = collected.hotels[0];
    if (topHotel.latitude && topHotel.longitude) {
      actions.push({
        type: "fly_to",
        lat: topHotel.latitude,
        lng: topHotel.longitude,
        zoom: 13,
        city: topHotel.city || collected.destination,
      });
    }
  }

  // Highlight top hotels on the map
  collected.hotels.slice(0, 3).forEach((h) => {
    if (h.id) {
      actions.push({ type: "highlight_hotel", hotel_id: h.id });
    }
  });

  return actions;
}

export function estimateCost(collected) {
  let total = 0;
  if (collected.hotels.length > 0) {
    const h = collected.hotels[0];
    total += h.total_fare || h.price_per_night * 2;
  }
  if (collected.flights.length > 0) {
    total += collected.flights[0].price;
  }
  if (collected.activities.length > 0) {
    total += collected.activities
      .slice(0, 3)
      .reduce((s, a) => s + a.price, 0);
  }
  return Math.round(total * 100) / 100;
}

export function getStepText(toolName, args) {
    const dest = args?.destination || "your destination";
    switch (toolName) {
      case "plan_trip": {
          const orig = args?.origin || "your city";
          return `Planning your entire trip from ${orig} to ${dest}...`;
      }
      case "search_hotels":
        return `Searching hotels in ${dest}...`;
      case "search_flights": {
        const orig = args?.origin || "your city";
        return `Finding flights from ${orig} to ${dest}...`;
      }
      case "search_activities":
        return `Discovering activities in ${dest}...`;
      default:
        return "Processing...";
    }
  }
