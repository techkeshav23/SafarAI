/**
 * Shared utility functions used across routes and services.
 * Single source of truth — eliminates duplication between routes and agent helpers.
 */

// ─── Date Utilities ─────────────────────────────────────────────

/**
 * Validate and fix a YYYY-MM-DD date string.
 * Auto-rolls invalid dates (e.g. Feb 29 non-leap → Mar 1).
 * Rejects malformed strings by returning null.
 */
export function validateAndFixDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const [yearStr, monthStr, dayStr] = parts;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return null;

  const fixed = d.toISOString().split("T")[0];
  if (fixed !== dateStr) {
    console.log(`[DateFix] Corrected invalid date: ${dateStr} → ${fixed}`);
  }
  return fixed;
}

/** Default check-in: tomorrow */
export function getDefaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/** Default check-out: checkIn + 2 days */
export function getDefaultCheckOut(checkIn) {
  const base = checkIn ? new Date(checkIn + "T00:00:00Z") : new Date();
  if (!checkIn) base.setUTCDate(base.getUTCDate() + 1);
  base.setUTCDate(base.getUTCDate() + 2);
  return base.toISOString().split("T")[0];
}

/** Default flight date: 7 days out (TBO rejects near-term) */
export function getDefaultFlightDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

// ─── String Utilities ───────────────────────────────────────────

/** Strip HTML tags and decode common entities */
export function stripHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ensure image URLs use HTTPS and trim whitespace */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  url = url.trim();
  if (url.startsWith("http://")) url = url.replace("http://", "https://");
  return url;
}

// ─── TBO Transform ────────────────────────────────────────────

import config from "../config/index.js";

/**
 * Transform a TBO search result + details map entry into our unified Hotel format.
 * This is the SINGLE source of truth — used by both routes and agent tools.
 */
export function transformTboHotel(searchResult, detailsMap = {}, destCity = "") {
  const code = String(searchResult.HotelCode);
  const details =
    detailsMap[code] ||
    Object.values(detailsMap).find((d) => String(d.HotelCode) === code) ||
    {};

  const rooms = searchResult.Rooms || [];
  const cheapestRoom = rooms.reduce(
    (min, r) => ((r.TotalFare || Infinity) < (min.TotalFare || Infinity) ? r : min),
    rooms[0] || {}
  );

  const USD_TO_INR = config.USD_TO_INR;
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
    city: details.CityName || destCity || details.Address || "Unknown City",
    address: details.Address || "",
    country: details.CountryName || "",
    description: stripHtml(details.Description) || details.HotelName || "",
    price_per_night: inrPrice,
    total_fare: inrTotal,
    currency: "INR",
    tax: inrTax,
    rating:
      typeof details.HotelRating === "number"
        ? details.HotelRating
        : parseFloat(details.HotelRating) || 0,
    star_rating: details.StarRating || 0,
    amenities: (details.HotelFacilities || []).slice(0, 8),
    image_url:
      normalizeImageUrl(details.Images && details.Images[0]) ||
      normalizeImageUrl(details.ImageUrls && details.ImageUrls[0]?.ImageUrl) ||
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
      total_fare: isUsd ? Math.round((r.TotalFare || 0) * USD_TO_INR) : r.TotalFare || 0,
      total_tax: isUsd ? Math.round((r.TotalTax || 0) * USD_TO_INR) : r.TotalTax || 0,
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
 * Checks the cached TBOHotelCodeList first; skips the broken staging API.
 */
export async function fetchHotelDetailsMap(hotelCodes, cityCode = null, getCachedHotelDetailsMap) {
  if (!hotelCodes || hotelCodes.length === 0) return {};
  const map = {};

  if (cityCode && getCachedHotelDetailsMap) {
    const cached = getCachedHotelDetailsMap(cityCode);
    if (cached && Object.keys(cached).length > 0) {
      for (const code of hotelCodes) {
        const key = String(code);
        if (cached[key]) map[key] = cached[key];
      }
      console.log(
        `[HotelDetails] Found ${Object.keys(map).length}/${hotelCodes.length} from TBOHotelCodeList cache`
      );
      if (Object.keys(map).length === hotelCodes.length) return map;
    }
  }

  const missingCodes = hotelCodes.filter((c) => !map[String(c)]);
  if (missingCodes.length > 0) {
    console.log(
      `[HotelDetails] Skipping broken API for ${missingCodes.length} missing codes`
    );
  }

  console.log(
    `[HotelDetails] Resolved ${Object.keys(map).length}/${hotelCodes.length} hotel details`
  );
  return map;
}
