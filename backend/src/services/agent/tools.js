// ─── Tool Executors ─────────────────────────────────────────────
import { searchActivities } from "../searchEngine.js";
import { searchAmadeusFlights } from "../amadeusApi.js";
import { searchHotels as tboSearchHotels, getHotelCodeBatch } from "../tboApi.js";
import { generateMockHotels } from "../mockHotels.js";
import { getCityCode } from "../cityResolver.js";
import {
  getDefaultCheckIn,
  getDefaultCheckOut,
  transformTboHotel,
  fetchHotelDetailsMap,
} from "./helpers.js";
import dotenv from "dotenv";

dotenv.config();

export async function executeSearchHotels(args, collected) {
  const destination = args.destination || "";
  console.log(`[Agent Tool] executeSearchHotels called for: ${destination}`);
  const checkIn = args.check_in || getDefaultCheckIn();
  const checkOut = args.check_out || getDefaultCheckOut(checkIn);

  let hotels = [];
  let source = "mock";
  let usedCheckIn = checkIn;
  let usedCheckOut = checkOut;

  // Try TBO API first
  const cityCode = await getCityCode(destination.toLowerCase());
  if (cityCode) {
    // Build a list of date ranges to try: original, then shifted by +1, +3, +7 days
    const dateAttempts = [
      { checkIn, checkOut },
    ];
    const addShifted = (daysShift) => {
      const ci = new Date(checkIn);
      ci.setDate(ci.getDate() + daysShift);
      const co = new Date(checkOut);
      co.setDate(co.getDate() + daysShift);
      dateAttempts.push({
        checkIn: ci.toISOString().split("T")[0],
        checkOut: co.toISOString().split("T")[0],
      });
    };
    addShifted(1);
    addShifted(3);
    addShifted(7);

    for (const attempt of dateAttempts) {
      // Retry up to 2 times per date with different random code batches
      // (TBO returns 500 when random codes include bad/expired ones)
      const CODE_RETRIES = 2;
      for (let codeRetry = 0; codeRetry < CODE_RETRIES; codeRetry++) {
        try {
          const hotelCodes = await getHotelCodeBatch(cityCode);
          console.log(`[Agent] Attempt: dates ${attempt.checkIn}→${attempt.checkOut}, code batch #${codeRetry + 1}`);
          const tboResult = await tboSearchHotels({
            cityCode,
            checkIn: attempt.checkIn,
            checkOut: attempt.checkOut,
            hotelCodes,
            adults: args.adults || 2,
            children: 0,
            childrenAges: [],
            nationality: args.nationality || process.env.DEFAULT_NATIONALITY || "IN",
            rooms: args.rooms || 1,
          });

          // If TBO returned a 500 error, retry with different codes
          if (tboResult.Status && tboResult.Status.Code === 500) {
            console.warn(`[Agent] TBO 500 error on batch #${codeRetry + 1}, retrying with different codes...`);
            continue;
          }

          let hotelResults =
            tboResult.HotelResult ||
            tboResult.HotelSearchResults?.HotelResult ||
            [];

          console.log(
            `[Agent] TBO returned ${hotelResults.length} hotels for CityCode: ${cityCode} (dates: ${attempt.checkIn} → ${attempt.checkOut})`
          );

          if (hotelResults.length > 0) {
            const limitedResults = hotelResults.slice(0, 20);
            const returnedCodes = limitedResults.map((h) => String(h.HotelCode));
            const detailsMap = await fetchHotelDetailsMap(returnedCodes);

            hotels = limitedResults.map((h) => transformTboHotel(h, detailsMap, destination));
            source = "tbo_live";
            usedCheckIn = attempt.checkIn;
            usedCheckOut = attempt.checkOut;
            if (attempt !== dateAttempts[0]) {
              console.log(`[Agent] Found hotels with shifted dates: ${attempt.checkIn} → ${attempt.checkOut}`);
            }
            break; // Found results, stop retrying codes
          }
        } catch (err) {
          console.error(`[Agent] TBO hotel search error (dates: ${attempt.checkIn} → ${attempt.checkOut}, batch #${codeRetry + 1}):`, err.message);
        }
      }
      if (hotels.length > 0) break; // Found results, stop trying dates
    }
  }

  // If TBO still returns 0 hotels after all attempts, use mock fallback
  if (hotels.length === 0) {
      console.log("[Agent] TBO returned 0 hotels across all date attempts. Using mock fallback.");
      hotels = generateMockHotels(destination, usedCheckIn, usedCheckOut, args.rooms || 1);
      source = "mock";
      console.log(`[Agent] Generated ${hotels.length} mock hotels for ${destination}`);
  }

  // Store full data
  collected.hotels = hotels;
  collected.dataSource = source;
  if (!collected.destination) collected.destination = destination;
  collected.check_in = usedCheckIn;
  collected.check_out = usedCheckOut;
  collected.search_params = {
      cityId: cityCode,
      check_in: usedCheckIn,
      check_out: usedCheckOut
  };

  // Return compact summary
  return {
    count: hotels.length,
    source,
    search_params: {
        check_in: usedCheckIn,
        check_out: usedCheckOut,
        cityId: cityCode
    },
    hotels: hotels.slice(0, 10).map((h) => ({
      name: h.name,
      city: h.city,
      price_per_night: h.price_per_night,
      total_fare: h.total_fare || null,
      rating: h.rating,
      check_in: usedCheckIn,   // Explicitly adding check-in date to each hotel object
      check_out: checkOut, // Explicitly adding check-out date to each hotel object
      amenities: (h.amenities || []).slice(0, 4),
      style_tags: (h.style_tags || []).slice(0, 3),
      match_reason: h.match_reason || null,
    })),
  };
}

export async function executeSearchFlights(args, collected) {
  const destination = args.destination || "";
  const origin =
    args.origin ||
    collected.origin ||
    process.env.DEFAULT_ORIGIN ||
    "Delhi";
  const departureDate =
    args.departure_date || collected.check_in || getDefaultCheckIn();

  let flights = [];
  let source = "amadeus";

  try {
    const amadeusFlights = await searchAmadeusFlights({
      origin,
      destination,
      departureDate,
      returnDate: args.return_date || null,
      adults: args.adults || 1,
      maxResults: 250,
    });
    if (amadeusFlights.length > 0) {
      console.log(`[Agent] Amadeus returned ${amadeusFlights.length} flights`);

      // Dedup true duplicates (same flight + same price + same cabin)
      // but keep genuinely different fare variants
      const seen = new Set();
      const unique = [];
      for (const f of amadeusFlights) {
        const key = [
          f.carrier_code, f.flight_number,
          f.departure_time, f.arrival_time,
          f.price, f.cabin_class, f.stops
        ].join("|");
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(f);
        }
      }
      console.log(`[Agent] After dedup: ${unique.length} unique flights`);
      flights = unique.sort((a, b) => a.price - b.price);
    } else {
      console.warn("[Agent] Amadeus returned 0 flights");
    }
  } catch (err) {
    console.error("[Agent] Amadeus flight search error:", err.message);
  }

  collected.flights = flights;
  if (!collected.destination) collected.destination = destination;
  if (!collected.origin) collected.origin = origin;

  // Return compact summary for the LLM to reason about, but we've stored full list in 'collected'
  return {
    count: flights.length,
    source,
    // Give LLM a decent chunk but not overwhelming, e.g. 50
    flights: flights.slice(0, 50).map((f) => ({ 
      airline: f.airline,
      carrier_code: f.carrier_code,
      origin: f.origin,
      destination: f.destination,
      price: f.price,
      currency: "INR",
      duration_hours: f.duration_hours,
      stops: f.stops,
      departure_time: f.departure_time,
      arrival_time: f.arrival_time,
    })),
  };
}

export async function executeSearchActivities(args, collected) {
  const destination = args.destination || "";
  const activities = searchActivities({
    destination,
    themes: args.themes || [],
  });

  collected.activities = activities;
  if (!collected.destination) collected.destination = destination;

  return {
    count: activities.length,
    activities: activities.slice(0, 5).map((a) => ({
      name: a.name,
      city: a.city,
      price: a.price,
      duration_hours: a.duration_hours,
      category: a.category,
      rating: a.rating,
    })),
  };
}

// ─── Super Tool Executor ────────────────────────────────────────

// For "plan_trip", we run both flight and hotel search sequentially or parallel
export async function executePlanTrip(args, collected) {
  console.log(`[Agent Tool] executePlanTrip called. Destination: ${args.destination}`);
  
  const [flightRes, hotelRes] = await Promise.all([
     executeSearchFlights({
       destination: args.destination,
       origin: args.origin,
       departure_date: args.start_date,
       return_date: args.end_date,
       adults: args.adults
     }, collected),
     executeSearchHotels({
       destination: args.destination,
       check_in: args.start_date,
       check_out: args.end_date,
       adults: args.adults
     }, collected)
  ]);
  
  return {
    flights: flightRes,
    hotels: hotelRes,
    message: "Searched for both flights and hotels."
  };
}

export async function executeTool(name, args, collected) {
  try {
    switch (name) {
      case "plan_trip":
        return await executePlanTrip(args, collected);
      case "search_hotels":
        return await executeSearchHotels(args, collected);
      case "search_flights":
        return await executeSearchFlights(args, collected);
      case "search_activities":
        return await executeSearchActivities(args, collected);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[Agent] Tool ${name} failed:`, err.message);
    return { error: `Tool ${name} failed: ${err.message}` };
  }
}
