/**
 * Search routes — handles unified travel search, hotel, and flight queries.
 * Uses shared utils for transforms; delegates to services for business logic.
 */
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { runAgent } from "../services/agentService.js";
import { searchTboFlights } from "../services/tboAirApi.js";
import { searchHotels as tboSearchHotels, getHotelCodeBatch, getCachedHotelDetailsMap } from "../services/tboApi.js";
import { generateMockHotels } from "../services/mockHotels.js";
import { getCityCode } from "../services/cityResolver.js";
import { parseIntent } from "../services/intentParser.js";
import {
  transformTboHotel,
  fetchHotelDetailsMap as _fetchDetailsMap,
  getDefaultCheckIn,
  getDefaultCheckOut,
} from "../utils/index.js";
import config from "../config/index.js";

const router = Router();

/** Wrapper: fetchHotelDetailsMap with injected cache getter */
async function fetchHotelDetailsMap(hotelCodes, cityCode = null) {
  return _fetchDetailsMap(hotelCodes, cityCode, getCachedHotelDetailsMap);
}

/**
 * POST /api/search/
 * Agentic travel search — uses Gemini function calling to reason,
 * decide which tools to invoke, and synthesize a personalized response.
 * Accepts optional `history` for multi-turn conversation context.
 */
router.post("/", asyncHandler(async (req, res) => {
  const { query, budget_max, history } = req.body;

  if (!query) {
    return res.status(400).json({ error: { message: "query is required" } });
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
}));

/**
 * POST /api/search/hotels
 * Search only for hotels (tries TBO first).
 */
router.post("/hotels", asyncHandler(async (req, res) => {
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
      nationality: config.defaults.nationality,
      rooms: rooms || 1,
    });

    const hotelResults = tboResult.HotelResult || [];
    if (hotelResults.length > 0) {
      const returnedCodes = hotelResults.map((h) => String(h.HotelCode));
      const detailsMap = await fetchHotelDetailsMap(returnedCodes, cityCode);
      const hotels = hotelResults.map((h) => transformTboHotel(h, detailsMap, destName || query || "this city"));
      return res.json({ hotels, source: "tbo_live" });
    }

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
      nationality: config.defaults.nationality,
      rooms: intent.rooms || 1,
    });

    const hotelResults = tboResult.HotelResult || [];
    if (hotelResults.length > 0) {
      const returnedCodes = hotelResults.map((h) => String(h.HotelCode));
      const detailsMap = await fetchHotelDetailsMap(returnedCodes, resolvedCode);
      const hotels = hotelResults.map((h) => transformTboHotel(h, detailsMap, intent.destination || destination));
      return res.json({ hotels, intent, source: "tbo_live" });
    }
  }

  // Mock fallback
  const fallbackCity = intent.destination || destination || "";
  console.log(`[Hotels] TBO empty for "${fallbackCity}". Falling back to mock.`);
  const mockHotels = generateMockHotels(
    fallbackCity,
    intent.check_in || getDefaultCheckIn(),
    intent.check_out || getDefaultCheckOut(intent.check_in),
    intent.rooms || 1
  );
  res.json({ hotels: mockHotels, intent, source: "mock" });
}));

/**
 * POST /api/search/flights
 * Uses TBO Air API.
 */
router.post("/flights", asyncHandler(async (req, res) => {
  const { query, origin, destination, departureDate, returnDate, adults } = req.body;
  let flights = [];
  let source = "tbo_air";

  // Direct params (from flight search form)
  if (destination && departureDate) {
    try {
      flights = await searchTboFlights({
        origin: origin || config.defaults.origin,
        destination,
        departureDate,
        returnDate: returnDate || null,
        adults: adults || 1,
      });
    } catch (err) {
      console.error("TBO Search Error (Direct):", err.message);
    }
    return res.json({ flights, source: flights.length > 0 ? "tbo_air" : "none" });
  }

  // Intent-based search
  const intent = await parseIntent(query || "flights");

  if (intent.destination) {
    try {
      flights = await searchTboFlights({
        origin: intent.origin || config.defaults.origin,
        destination: intent.destination,
        departureDate: intent.check_in || getDefaultCheckIn(),
        returnDate: intent.check_out || null,
        adults: intent.adults || 1,
      });
      if (flights.length === 0) source = "none";
    } catch (err) {
      console.error("TBO Search Error (Intent):", err.message);
      source = "error";
    }
  } else {
    source = "none";
  }

  res.json({ flights, intent, source });
}));

export default router;
