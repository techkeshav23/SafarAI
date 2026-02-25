/**
 * TBO Holidays Hotel API service layer.
 * Wraps the real TBO staging API with Basic Auth.
 */

const TBO_BASE = "http://api.tbotechnology.in/TBOHolidays_HotelAPI";

// Read credentials lazily
function authHeader() {
  const user = process.env.TBO_USERNAME;
  const pass = process.env.TBO_PASSWORD;
  if (!user || !pass) {
    throw new Error("TBO_USERNAME and TBO_PASSWORD must be set in .env");
  }
  const cred = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${cred}`;
}

async function tboPost(endpoint, body) {
  const url = `${TBO_BASE}/${endpoint}`;
  const bodyStr = JSON.stringify(body);
  const start = Date.now();
  const controller = new AbortController();
  // 45s timeout for slow TBO staging API
  const timeout = setTimeout(() => controller.abort(), 45000); 
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: bodyStr,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[TBO ERROR] POST ${endpoint} — HTTP ${res.status}: ${text.substring(0, 200)}`);
      return { error: true, status: res.status, message: text.substring(0, 200) };
    }
    
    const data = await res.json();
    if (data.HotelResult) {
      console.log(`[TBO ←] POST ${endpoint} — HotelResult: ${data.HotelResult.length} hotels`);
    }
    if (data.Status && data.Status.Code !== 200) {
      console.warn(`[TBO API Error] ${endpoint}: ${data.Status.Description} (Code: ${data.Status.Code})`);
    }
    return data;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[TBO ERROR] POST ${endpoint} — ${err.name}: ${err.message} (${elapsed}ms)`);
    return { error: true, message: err.message };
  }
}

/* ────────── Utilities & Constants ────────── */

/**
 * Known working hotel codes from Postman collection.
 * These return REAL hotel names, images, and pricing.
 */
const POSTMAN_KNOWN_CODES = [
  376565, 1345318, 1345320, 1200255, 1128760, 1250333,
  1078234, 1347149, 1358855, 1345321, 1108025, 1356271, 1267547,
  // Additional reliable staging codes
  1000011, 1000012, 1000013, 1000014, 1000015,
  1000020, 1000030, 1000040, 1000050, 1000060, 
  1000070, 1000080, 1000090, 1000099,
];

/** Dead hotel codes that break the entire batch — never include these */
const DEAD_CODES = new Set([1000000, 1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009]);

function filterDeadCodes(codes) {
  return codes.filter(c => !DEAD_CODES.has(Number(c)));
}

function parseStarRating(rating) {
  if (!rating) return 0;
  const map = { OneStar: 1, TwoStar: 2, ThreeStar: 3, FourStar: 4, FiveStar: 5 };
  return map[rating] || 0;
}

/* ────────── Search ────────── */

export async function searchHotels({
  checkIn,
  checkOut,
  hotelCodes = "",
  adults = 2,
  children = 0,
  childrenAges = [],
  nationality = "IN",
  rooms = 1,
}) {
  const resolvedCodes = hotelCodes || "";
  if (!resolvedCodes) {
     return { Status: { Code: 200, Description: "No hotel codes to search" }, HotelResult: [] };
  }

  const payload = {
    CheckIn: checkIn,
    CheckOut: checkOut,
    HotelCodes: resolvedCodes,
    GuestNationality: nationality,
    PaxRooms: [{ Adults: adults, Children: children, ChildrenAges: childrenAges }],
    ResponseTime: 4,
    IsDetailedResponse: true,
    Filters: { Refundable: false, NoOfRooms: rooms, MealType: "All" },
  };

  console.log(`[TBO] Searching hotels: ${resolvedCodes.split(',').length} codes, ${checkIn} → ${checkOut}`);
  return tboPost("search", payload);
}

/* ────────── Booking Flow ────────── */

export async function preBook(bookingCode) {
  return tboPost("PreBook", { BookingCode: bookingCode, PaymentMode: "Limit" });
}

export async function book(bookingCode, {
  customerDetails = [],
  clientReferenceId = "",
  bookingReferenceId = "",
  totalFare = 0,
  emailId = "",
  phoneNumber = "",
  bookingType = "Voucher",
} = {}) {
  return tboPost("Book", {
    BookingCode: bookingCode,
    CustomerDetails: customerDetails,
    ...(clientReferenceId && { ClientReferenceId: clientReferenceId }),
    ...(bookingReferenceId && { BookingReferenceId: bookingReferenceId }),
    ...(totalFare && { TotalFare: totalFare }),
    ...(emailId && { EmailId: emailId }),
    ...(phoneNumber && { PhoneNumber: phoneNumber }),
    BookingType: bookingType,
    PaymentMode: "Limit",
  });
}

export async function getBookingDetail({ confirmationNumber, bookingReferenceId } = {}) {
  const payload = { PaymentMode: "Limit" };
  if (confirmationNumber) payload.ConfirmationNumber = confirmationNumber;
  if (bookingReferenceId) payload.BookingReferenceId = bookingReferenceId;
  return tboPost("BookingDetail", payload);
}

export async function cancelBooking(confirmationNumber) {
  return tboPost("Cancel", { ConfirmationNumber: confirmationNumber });
}

export async function getBookingsByDate(fromDate, toDate) {
  return tboPost("BookingDetailsBasedOnDate", { FromDate: fromDate, ToDate: toDate });
}

export async function generateVoucher(bookingId) {
  return tboPost("GenerateVoucher", { BookingId: bookingId });
}

/* ────────── Hotel Code & Details Caching ────────── */

const cityCodesCache = new Map();   // cityCode → { codes: string[], time: number }
const cityDetailsCache = new Map(); // cityCode → { map: { [hotelCode]: details }, time: number }
const CACHE_TTL = 1000 * 60 * 60;  // 1 hour

/**
 * Get hotel codes for a specific city from TBO (cached).
 * Tries detailed list first (for images), falls back to simple list (names/locations).
 */
async function getCityHotelCodes(cityCode) {
  if (!cityCode) return [];

  const now = Date.now();
  const cached = cityCodesCache.get(cityCode);
  if (cached && now - cached.time < CACHE_TTL) {
    return cached.codes;
  }

  console.log(`[TBO] Fetching hotel codes for city ${cityCode}...`);
  
  // Attempt 1: Detailed fetch (timeout 5s)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); 

    const res = await fetch(
      `${TBO_BASE}/TBOHotelCodeList`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader() },
        body: JSON.stringify({ CityCode: String(cityCode), IsDetailedResponse: "true" }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      const detailsMap = {};
      let codes = [];
      
      if (data.Hotels && Array.isArray(data.Hotels)) {
          for (const hotel of data.Hotels) {
              if (!hotel || typeof hotel !== 'object') continue;
              const code = String(hotel.HotelCode || hotel.hotelCode || '');
              if (!code) continue;
              codes.push(code);

              let lat = 0, lng = 0;
              if (hotel.Map && typeof hotel.Map === 'string' && hotel.Map.includes('|')) {
                const [latStr, lngStr] = hotel.Map.split('|');
                lat = parseFloat(latStr) || 0;
                lng = parseFloat(lngStr) || 0;
              }

              detailsMap[code] = formatHotelDetails(hotel, code, lat, lng);
          }
      }
      
      codes = filterDeadCodes(codes);
      if (codes.length > 0) {
          cityCodesCache.set(cityCode, { codes, time: now });
          if (Object.keys(detailsMap).length > 0) {
              cityDetailsCache.set(cityCode, { map: detailsMap, time: now });
              console.log(`[TBO] Cached ${codes.length} detailed codes for ${cityCode}`);
          }
          return codes;
      }
    }
  } catch (err) {
     // Silent fail for detailed list timeout - expected on staging
  }

  // Attempt 2: Simple fetch (timeout 20s)
  console.log(`[TBO] Fetching SIMPLE hotel codes for city ${cityCode} (fallback)...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res2 = await fetch(
      `${TBO_BASE}/TBOHotelCodeList`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader() },
        body: JSON.stringify({ CityCode: String(cityCode), IsDetailedResponse: "false" }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const data2 = await res2.json();

    let codes = [];
    const detailsMap2 = {};

    const hotelsList = data2.Hotels || (Array.isArray(data2) ? data2 : []) || [];
    
    // Even simple response has name/location data we can parse
    if (Array.isArray(hotelsList)) {
        for (const hotel of hotelsList) {
            if (!hotel || typeof hotel !== 'object') continue;
            const code = String(hotel.HotelCode || hotel.hotelCode || '');
            if (!code) continue;
            codes.push(code);

            let lat = 0, lng = 0;
            if (hotel.Map && typeof hotel.Map === 'string' && hotel.Map.includes('|')) {
                const [latStr, lngStr] = hotel.Map.split('|');
                lat = parseFloat(latStr) || 0;
                lng = parseFloat(lngStr) || 0;
            } else {
                lat = parseFloat(hotel.Latitude) || 0;
                lng = parseFloat(hotel.Longitude) || 0;
            }

            detailsMap2[code] = formatHotelDetails(hotel, code, lat, lng);
        }
    } else if (data2.HotelCodes && Array.isArray(data2.HotelCodes)) {
         codes = data2.HotelCodes.map(c => String(c));
    }

    codes = filterDeadCodes(codes);
    // Prioritize known working codes
    const knownCodes = POSTMAN_KNOWN_CODES.map(String);
    const goldStandard = codes.filter(c => knownCodes.includes(c));
    const regular = codes.filter(c => !knownCodes.includes(c));
    codes = [...goldStandard, ...regular];

    if (codes.length > 0) {
        cityCodesCache.set(cityCode, { codes, time: now });
        if (Object.keys(detailsMap2).length > 0) {
             cityDetailsCache.set(cityCode, { map: detailsMap2, time: now });
        }
        console.log(`[TBO] Cached ${codes.length} simple codes for ${cityCode}`);
        return codes;
    }
  } catch (err) {
    console.warn(`[TBO] HotelCodeList fallback failed: ${err.message}`);
  }

  return [];
}

function formatHotelDetails(hotel, code, lat, lng) {
  return {
    HotelCode: code,
    HotelName: hotel.HotelName || '',
    HotelRating: parseStarRating(hotel.HotelRating),
    StarRating: parseStarRating(hotel.HotelRating),
    Images: (hotel.ImageUrls || []).map(img => img?.ImageUrl || img).filter(Boolean),
    Address: hotel.Address || '',
    CityName: hotel.CityName || '',
    CountryName: hotel.CountryName || '',
    CountryCode: hotel.CountryCode || '',
    Description: hotel.Description || '',
    HotelFacilities: hotel.HotelFacilities || [],
    Latitude: lat,
    Longitude: lng,
    Email: hotel.Email || '',
    PhoneNumber: hotel.PhoneNumber || '',
    PinCode: hotel.PinCode || '',
    HotelWebsiteUrl: hotel.HotelWebsiteUrl || '',
  };
}

export function getCachedHotelDetailsMap(cityCode) {
  const cached = cityDetailsCache.get(String(cityCode));
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.map;
  }
  return {};
}

/**
 * Find hotel details in cache by hotel code (linear scan across all cached cities).
 * Useful when we don't know the city code.
 */
export function findCachedHotelDetails(hotelCode) {
    if (!hotelCode) return null;
    const cleanCode = String(hotelCode);
    
    for (const [cityCode, cached] of cityDetailsCache.entries()) {
        if (Date.now() - cached.time < CACHE_TTL) {
            if (cached.map[cleanCode]) {
                return cached.map[cleanCode];
            }
        }
    }
    return null;
}

/**
 * Get a batch of hotel codes for a city.
 * Supports paging/attempts to rotate through available codes.
 */
export async function getHotelCodeBatch(cityCode, count = 10000, attempt = 1) {
  const codes = await getCityHotelCodes(cityCode);
  if (!codes || codes.length === 0) return "";

  // Return ALL codes without filtering/slicing if count is large
  // But still prioritize known codes first just in case
  const knownCodesStr = POSTMAN_KNOWN_CODES.map(String);
  const known = codes.filter(c => knownCodesStr.includes(c));
  const unknown = codes.filter(c => !knownCodesStr.includes(c));
  
  // Combine all
  const allCodes = [...known, ...unknown];
  return filterDeadCodes(allCodes).join(",");
}