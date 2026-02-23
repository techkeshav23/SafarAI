/**
 * Amadeus API service - fetches real flight data.
 * Uses Amadeus Self-Service API (v2) with client_credentials OAuth2 flow.
 *
 * Docs: https://developers.amadeus.com/self-service/apis-docs
 */

const AMADEUS_AUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMADEUS_FLIGHT_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get an OAuth2 access_token, caching it until near expiry.
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;

  if (!key || !secret) {
    throw new Error("AMADEUS_API_KEY and AMADEUS_API_SECRET must be set in .env");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: key,
    client_secret: secret,
  });

  console.log(`[Amadeus →] Requesting OAuth2 token...`);
  const start = Date.now();
  const res = await fetch(AMADEUS_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const elapsed = Date.now() - start;

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amadeus ERROR] Auth failed (${res.status}, ${elapsed}ms): ${text.substring(0, 300)}`);
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log(`[Amadeus ←] Token obtained (expires_in: ${data.expires_in}s, ${elapsed}ms)`);
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return cachedToken;
}

/**
 * IATA city-code lookup — fast cache for common cities.
 * If a city is NOT in this map, we call the Amadeus Location API in real-time.
 */
const CITY_IATA = {
  "new york": "NYC", "nyc": "NYC", "jfk": "JFK",
  "los angeles": "LAX", "la": "LAX",
  "san francisco": "SFO",
  "chicago": "CHI", "ord": "ORD",
  "miami": "MIA",
  "london": "LON", "heathrow": "LHR",
  "paris": "PAR", "cdg": "CDG",
  "dubai": "DXB",
  "tokyo": "TYO",
  "singapore": "SIN",
  "bangkok": "BKK",
  "delhi": "DEL", "new delhi": "DEL",
  "mumbai": "BOM", "bombay": "BOM",
  "bangalore": "BLR", "bengaluru": "BLR",
};

// Dynamic cache — populated from Amadeus Location API at runtime
const dynamicIATACache = new Map();

const AMADEUS_LOCATION_URL = "https://test.api.amadeus.com/v1/reference-data/locations";

/**
 * Call Amadeus Location API to resolve a city name → IATA code in real-time.
 * Docs: https://developers.amadeus.com/self-service/category/destinations/doc/airport-and-city-search
 */
async function lookupIATAFromAPI(cityName) {
  try {
    const token = await getAccessToken();
    const params = new URLSearchParams({
      subType: "CITY,AIRPORT",
      keyword: cityName,
      "page[limit]": "5",
      view: "LIGHT",
    });

    const res = await fetch(`${AMADEUS_LOCATION_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn(`[Amadeus Location] API error (${res.status}) for "${cityName}"`);
      return null;
    }

    const data = await res.json();
    const results = data.data || [];

    if (results.length === 0) {
      console.warn(`[Amadeus Location] No results for "${cityName}"`);
      return null;
    }

    // Prefer CITY type over AIRPORT, pick the first best match
    const cityResult = results.find(r => r.subType === "CITY") || results[0];
    const iataCode = cityResult.iataCode;

    if (iataCode) {
      console.log(`[Amadeus Location] Resolved "${cityName}" → ${iataCode} (${cityResult.name})`);
      // Cache it for future calls
      dynamicIATACache.set(cityName.toLowerCase().trim(), iataCode);
      return iataCode;
    }

    return null;
  } catch (err) {
    console.error(`[Amadeus Location] Lookup failed for "${cityName}":`, err.message);
    return null;
  }
}

/**
 * Resolve a city name to an IATA code. Case-insensitive.
 * 1. If already a 3-letter code → return as-is
 * 2. Check fast static cache
 * 3. Check dynamic runtime cache
 * 4. Call Amadeus Location API in real-time
 */
export async function resolveIATA(cityName) {
  if (!cityName) return null;
  const cleaned = cityName.trim().toLowerCase().replace(/\s*\(.*?\)\s*/, "");
  
  // Already an IATA code
  if (cleaned.length === 3 && /^[a-z]{3}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  // Static cache (instant)
  if (CITY_IATA[cleaned]) return CITY_IATA[cleaned];
  
  // Dynamic cache (already resolved before)
  if (dynamicIATACache.has(cleaned)) return dynamicIATACache.get(cleaned);
  
  // Real-time API lookup
  return await lookupIATAFromAPI(cleaned);
}

/**
 * Search flights using Amadeus Flight Offers Search API.
 *
 * @param {Object} params
 * @param {string} params.origin - city name or IATA code
 * @param {string} params.destination - city name or IATA code
 * @param {string} params.departureDate - YYYY-MM-DD
 * @param {string} [params.returnDate] - YYYY-MM-DD (optional, for round-trip)
 * @param {number} [params.adults=1]
 * @param {number} [params.maxResults=5]
 * @returns {Promise<Array>} Array of normalized flight objects
 */
export async function searchAmadeusFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
  maxResults = 5,
}) {
  const originCode = await resolveIATA(origin);
  const destCode = await resolveIATA(destination);

  if (!originCode || !destCode) {
    console.warn(`Amadeus: Could not resolve IATA codes for origin="${origin}" (${originCode}) / dest="${destination}" (${destCode})`);
    return [];
  }

  const token = await getAccessToken();

  const params = new URLSearchParams({
    originLocationCode: originCode,
    destinationLocationCode: destCode,
    departureDate,
    adults: String(adults),
    max: String(maxResults),
    currencyCode: "INR",
  });

  if (returnDate) {
    params.set("returnDate", returnDate);
  }

  const url = `${AMADEUS_FLIGHT_URL}?${params.toString()}`;
  console.log(`[Amadeus →] GET flights: ${originCode} → ${destCode} on ${departureDate} (max: ${maxResults})`);
  const start = Date.now();

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const elapsed = Date.now() - start;
  console.log(`[Amadeus ←] ${res.status} (${elapsed}ms)`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amadeus ERROR] HTTP ${res.status}: ${text.substring(0, 500)}`);
    return [];
  }

  const data = await res.json();
  const offers = data.data || [];
  console.log(`[Amadeus ←] ${offers.length} flight offers found`);

  // Normalize to our Flight interface
  return offers.map((offer, idx) => {
    const firstSeg = offer.itineraries?.[0]?.segments || [];
    const lastSeg = firstSeg[firstSeg.length - 1];
    const firstSegData = firstSeg[0];

    // Carrier name
    const carrierCode = firstSegData?.carrierCode || "??";
    const flightNumber = firstSegData?.number || ""; // e.g. "101"
    const carrierName = data.dictionaries?.carriers?.[carrierCode] || carrierCode;

    // Duration: parse ISO 8601 duration (e.g. "PT12H30M")
    const isoDuration = offer.itineraries?.[0]?.duration || "";
    const durationMatch = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hrs = parseInt(durationMatch?.[1] || "0", 10);
    const mins = parseInt(durationMatch?.[2] || "0", 10);
    const totalHours = Math.round((hrs + mins / 60) * 10) / 10;

    return {
      id: `amadeus_${offer.id || idx}`,
      airline: carrierName,
      origin: `${firstSegData?.departure?.iataCode || originCode}`,
      destination: `${lastSeg?.arrival?.iataCode || destCode}`,
      departure_time: firstSegData?.departure?.at || departureDate,
      arrival_time: lastSeg?.arrival?.at || "",
      price: parseFloat(offer.price?.total || "0"),
      currency: offer.price?.currency || "USD",
      duration_hours: totalHours,
      stops: Math.max(0, firstSeg.length - 1),
      match_score: 0,
      source: "amadeus",
      // Extra detail
      carrier_code: carrierCode,
      flight_number: flightNumber,
      cabin_class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "",
      number_of_bookable_seats: offer.numberOfBookableSeats || null,
    };
  });
}
