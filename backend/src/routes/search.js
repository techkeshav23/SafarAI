/**
 * Main search router - handles unified travel search queries.
 * Uses real TBO Hotel API for hotels, Amadeus API for flights, mock data for activities.
 */
import { Router } from "express";
import { runAgent } from "../services/agentService.js";
import { searchAmadeusFlights } from "../services/amadeusApi.js";

import { searchHotels as tboSearchHotels, getHotelDetails, getHotelCodeBatch } from "../services/tboApi.js";
import { generateMockHotels } from "../services/mockHotels.js";
import { getCityCode } from "../services/cityResolver.js";
import { parseIntent } from "../services/intentParser.js";

const router = Router();

/**
 * Transform TBO search result + details into our unified Hotel format.
 * TBO search returns: { HotelCode, Currency, Rooms[] }
 * TBO details returns: { HotelCode, HotelName, HotelRating, Address, ... }
 */
function transformTboHotel(searchResult, detailsMap = {}, destCity = "") {
  const code = String(searchResult.HotelCode);
  const details = detailsMap[code] || {};
  const rooms = searchResult.Rooms || [];

  // Find cheapest room
  const cheapestRoom = rooms.reduce(
    (min, r) => ((r.TotalFare || Infinity) < (min.TotalFare || Infinity) ? r : min),
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
    city: details.Address || details.CityName || destCity || "",
    country: details.CountryName || "",
    description: details.Description || details.HotelName || "",
    price_per_night: inrPrice,
    total_fare: inrTotal,
    currency: "INR",
    tax: inrTax,
    rating: details.HotelRating ? parseFloat(details.HotelRating) : 0,
    star_rating: details.StarRating || 0,
    amenities: (details.HotelFacilities || []).slice(0, 8),
    image_url: details.Images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    latitude: details.Latitude || 0,
    longitude: details.Longitude || 0,
    style_tags: [],
    match_score: null,
    match_reason: null,
    // TBO-specific fields for booking
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

/**
 * Fetch hotel details for a set of hotel codes.
 * Batches in chunks of 5 to avoid TBO 500 errors.
 * Returns a map of hotelCode → details.
 */
async function fetchHotelDetailsMap(hotelCodes) {
  if (!hotelCodes || hotelCodes.length === 0) return {};
  const map = {};
  const CHUNK_SIZE = 5;

  for (let i = 0; i < hotelCodes.length; i += CHUNK_SIZE) {
    const chunk = hotelCodes.slice(i, i + CHUNK_SIZE);
    try {
      const codes = chunk.join(",");
      console.log(`[HotelDetails] Route: fetching chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${codes}`);
      const data = await getHotelDetails(codes);
      const results = data.HotelDetails || [];
      if (Array.isArray(results)) {
        for (const d of results) {
          if (d.HotelCode) map[String(d.HotelCode)] = d;
        }
      }
      if (data.Status && data.Status.Code === 500) {
        console.warn(`[HotelDetails] Route: chunk returned 500, skipping`);
      }
    } catch (err) {
      console.error(`[HotelDetails] Route: chunk error: ${err.message}`);
    }
  }

  console.log(`[HotelDetails] Route: resolved ${Object.keys(map).length}/${hotelCodes.length} hotel details`);
  return map;
}

/**
 * POST /api/search/
 * Agentic travel search — uses Gemini function calling to reason,
 * decide which tools to invoke, and synthesize a personalized response.
 * Accepts optional `history` for multi-turn conversation context.
 */
router.post("/", async (req, res) => {
  try {
    const { query, budget_max, history } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    console.log(`[Search] Agentic query: "${query}" (history: ${(history || []).length} msgs)`);

    const result = await runAgent(query, history || []);

    // Apply budget ceiling if passed separately
    if (budget_max && result.hotels) {
      result.hotels = result.hotels.filter(
        (h) => !budget_max || h.price_per_night <= budget_max
      );
    }

    res.json(result);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/search/hotels
 * Search only for hotels (tries TBO first).
 */
router.post("/hotels", async (req, res) => {
  try {
    const { query, budget_max, cityCode, checkIn, checkOut, adults, children, rooms, destination: destName } =
      req.body;

    // If direct TBO params provided, use them
    if (cityCode && checkIn && checkOut) {
      const hotelCodes = await getHotelCodeBatch(cityCode);
      const tboResult = await tboSearchHotels({
        cityCode,
        checkIn,
        checkOut,
        hotelCodes,
        adults: adults || 2,
        children: children || 0,
        childrenAges: [],
        nationality: process.env.DEFAULT_NATIONALITY || "IN",
        rooms: rooms || 1,
      });

      const hotelResults = tboResult.HotelResult || [];
      if (hotelResults.length > 0) {
        const returnedCodes = hotelResults.map((h) => String(h.HotelCode));
        const detailsMap = await fetchHotelDetailsMap(returnedCodes);
        const hotels = hotelResults.map((h) => transformTboHotel(h, detailsMap, destName || query || "this city")).slice(0, 20);
        return res.json({ hotels, source: "tbo_live" });
      }

      // TBO returned 0 results for direct params — mock fallback
      console.log(`[Hotels] TBO empty for cityCode ${cityCode}. Falling back to mock.`);
      const mockHotels = generateMockHotels(cityCode, checkIn, checkOut, rooms || 1);
      return res.json({ hotels: mockHotels, source: "mock" });
    }

    // Otherwise parse intent
    const intent = await parseIntent(query || "hotel search");
    if (budget_max) intent.budget_max = budget_max;

    const destination = (intent.destination || "").toLowerCase();
    const resolvedCode = await getCityCode(destination);

    if (resolvedCode) {
      const hotelCodes = await getHotelCodeBatch(resolvedCode);
      const tboResult = await tboSearchHotels({
        cityCode: resolvedCode,
        checkIn: intent.check_in || getDefaultCheckIn(),
        checkOut: intent.check_out || getDefaultCheckOut(intent.check_in),
        hotelCodes,
        adults: intent.adults || 2,
        children: intent.children || 0,
        childrenAges: [],
        nationality: process.env.DEFAULT_NATIONALITY || "IN",
        rooms: intent.rooms || 1,
      });

      const hotelResults = tboResult.HotelResult || [];
      if (hotelResults.length > 0) {
        const returnedCodes = hotelResults.map((h) => String(h.HotelCode));
        const detailsMap = await fetchHotelDetailsMap(returnedCodes);
        const hotels = hotelResults.map((h) => transformTboHotel(h, detailsMap, intent.destination || destination)).slice(0, 20);
        return res.json({ hotels, intent, source: "tbo_live" });
      }
    }

    // Mock fallback — never return empty hotel list
    const fallbackCity = intent.destination || destination || "";
    console.log(`[Hotels] TBO empty for "${fallbackCity}". Falling back to mock.`);
    const mockHotels = generateMockHotels(
      fallbackCity,
      intent.check_in || getDefaultCheckIn(),
      intent.check_out || getDefaultCheckOut(intent.check_in),
      intent.rooms || 1
    );
    res.json({ hotels: mockHotels, intent, source: "mock" });
  } catch (err) {
    console.error("Hotel search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/search/flights
 * Search for flights (Amadeus API, fallback to mock).
 */
router.post("/flights", async (req, res) => {
  try {
    const { query, origin, destination, departureDate, returnDate, adults } = req.body;

    // If direct params provided, use them
    if (destination && departureDate) {
      const flights = await searchAmadeusFlights({
        origin: origin || process.env.DEFAULT_ORIGIN || "",
        destination,
        departureDate,
        returnDate: returnDate || null,
        adults: adults || 1,
        maxResults: 250,
      });
      return res.json({ flights, source: flights.length > 0 ? "amadeus" : "none" });
    }

    // Otherwise parse intent from query
    const intent = await parseIntent(query || "flights");
    let flights = [];
    let source = "mock";

    if (intent.destination) {
      try {
        flights = await searchAmadeusFlights({
          origin: intent.origin || process.env.DEFAULT_ORIGIN || "",
          destination: intent.destination,
          departureDate: intent.check_in || getDefaultCheckIn(),
          returnDate: intent.check_out || null,
          adults: intent.adults || 1,
          maxResults: 250,
        });
        if (flights.length > 0) source = "amadeus";
      } catch (err) {
        console.error("Amadeus error:", err.message);
      }
    }

    // No mock fallback — return empty if Amadeus has no results

    res.json({ flights, intent, source });
  } catch (err) {
    console.error("Flight search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Helpers ── */

function getDefaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function getDefaultCheckOut(checkIn) {
  const d = checkIn ? new Date(checkIn) : new Date();
  if (!checkIn) d.setDate(d.getDate() + 7);
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

export default router;
