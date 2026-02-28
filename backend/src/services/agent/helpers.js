// ─── Agent Helpers ──────────────────────────────────────────────
// Re-exports shared utils + agent-specific logic (map actions, cost estimation).

import { getCachedHotelDetailsMap } from "../tboApi.js";

// Re-export shared utilities so tools.js imports stay unchanged
export {
  validateAndFixDate,
  getDefaultCheckIn,
  getDefaultCheckOut,
  getDefaultFlightDate,
  stripHtml,
  normalizeImageUrl,
  transformTboHotel,
} from "../../utils/index.js";

import { fetchHotelDetailsMap as _fetchDetailsMap } from "../../utils/index.js";

/** Wrapper that injects the TBO cache getter */
export async function fetchHotelDetailsMap(hotelCodes, cityCode = null) {
  return _fetchDetailsMap(hotelCodes, cityCode, getCachedHotelDetailsMap);
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
