/**
 * TBO Holidays Hotel API service layer.
 * Wraps the real TBO staging API with Basic Auth.
 */

const TBO_BASE = "http://api.tbotechnology.in/TBOHolidays_HotelAPI";

// Read credentials lazily (not at module load time) so dotenv has time to configure
function authHeader() {
  const user = process.env.TBO_USERNAME;
  const pass = process.env.TBO_PASSWORD;
  if (!user || !pass) {
    throw new Error("TBO_USERNAME and TBO_PASSWORD must be set in .env");
  }
  const cred = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${cred}`;
}

async function tboGet(endpoint) {
  const url = `${TBO_BASE}/${endpoint}`;
  console.log(`[TBO →] GET ${url}`);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
    });
    const elapsed = Date.now() - start;
    console.log(`[TBO ←] GET ${endpoint} — ${res.status} (${elapsed}ms)`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[TBO ERROR] GET ${endpoint} — HTTP ${res.status}: ${text.substring(0, 500)}`);
      return { error: true, status: res.status, message: text.substring(0, 200) };
    }
    const data = await res.json();
    console.log(`[TBO ←] GET ${endpoint} — keys: [${Object.keys(data).join(', ')}]`);
    return data;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[TBO ERROR] GET ${endpoint} — ${err.name}: ${err.message} (${elapsed}ms)`);
    return { error: true, message: err.message };
  }
}

async function tboPost(endpoint, body) {
  const url = `${TBO_BASE}/${endpoint}`;
  const bodyStr = JSON.stringify(body);
  console.log(`[TBO →] POST ${endpoint} — payload: ${bodyStr.substring(0, 300)}${bodyStr.length > 300 ? '...' : ''}`);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: bodyStr,
    });
    const elapsed = Date.now() - start;
    console.log(`[TBO ←] POST ${endpoint} — ${res.status} (${elapsed}ms)`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[TBO ERROR] POST ${endpoint} — HTTP ${res.status}: ${text.substring(0, 500)}`);
      return { error: true, status: res.status, message: text.substring(0, 200) };
    }
    const data = await res.json();
    // Log response summary
    if (data.Status) {
      console.log(`[TBO ←] POST ${endpoint} — Status: ${data.Status.Code} - ${data.Status.Description}`);
    }
    if (data.HotelResult) {
      console.log(`[TBO ←] POST ${endpoint} — HotelResult: ${data.HotelResult.length} hotels`);
    }
    if (data.HotelDetails) {
      console.log(`[TBO ←] POST ${endpoint} — HotelDetails: ${Array.isArray(data.HotelDetails) ? data.HotelDetails.length : 'N/A'} entries`);
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

/* ────────── Static Data ────────── */

export async function getCountryList() {
  return tboGet("CountryList");
}

export async function getCityList(countryCode) {
  return tboPost("CityList", { CountryCode: countryCode });
}

/**
 * Get hotel codes for a specific city via TBOHotelCodeList (POST).
 * Postman collection confirms this is a POST endpoint, not GET.
 * @param {string} cityCode - TBO city code (e.g. "130543" for Dubai)
 */
export async function getHotelCodeList(cityCode) {
  if (!cityCode) {
    console.warn("[TBO] getHotelCodeList called without cityCode — returning empty");
    return { HotelCodes: [] };
  }
  return tboPost("TBOHotelCodeList", {
    CityCode: String(cityCode),
    IsDetailedResponse: "true",
  });
}

/**
 * Get hotel details by hotel code(s).
 * @param {string} hotelCodes - comma-separated hotel codes
 */
export async function getHotelDetails(hotelCodes) {
  return tboPost("Hoteldetails", {
    Hotelcodes: hotelCodes,
    Language: "EN",
  });
}

/* ────────── Search ────────── */

/**
 * Search hotels via TBO API.
 * Requires hotel codes — the search only returns availability + pricing.
 *
 * TBO Response shape:
 * {
 *   Status: { Code, Description },
 *   HotelResult: [
 *     {
 *       HotelCode, Currency,
 *       Rooms: [{ Name: string[], BookingCode, Inclusion, DayRates, TotalFare, TotalTax,
 *                  RoomPromotion, CancelPolicies, MealType, IsRefundable, WithTransfers }]
 *     }
 *   ]
 * }
 */
/**
 * Known working hotel codes in the staging environment.
 * Codes 1000000–1000009 are DEAD and must never be included.
 */
/**
 * Known working hotel codes from Postman collection.
 * These return REAL hotel names, images, and pricing.
 * Also includes a broader range of staging codes as fallback.
 */
const POSTMAN_KNOWN_CODES = [
  376565, 1345318, 1345320, 1200255, 1128760, 1250333,
  1078234, 1347149, 1358855, 1345321, 1108025, 1356271, 1267547,
];

const CURATED_HOTEL_CODES = [
  // Real codes from Postman (highest priority — return actual hotel data)
  ...POSTMAN_KNOWN_CODES,
  // Broader staging codes as additional fallback
  1000011, 1000012, 1000013, 1000014, 1000015,
  1000016, 1000017, 1000018, 1000019, 1000020,
  1000021, 1000022, 1000023, 1000024, 1000025,
  1000030, 1000035, 1000040, 1000045, 1000050,
  1000055, 1000060, 1000065, 1000070, 1000075,
  1000080, 1000085, 1000090, 1000095, 1000099,
];

/** Dead hotel codes that break the entire batch — never include these */
const DEAD_CODES = new Set([1000000, 1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009]);

/** Filter out dead codes from any list of hotel codes */
function filterDeadCodes(codes) {
  return codes.filter(c => !DEAD_CODES.has(Number(c)));
}

export async function searchHotels({
  cityCode,
  checkIn,
  checkOut,
  hotelCodes = "",
  adults = 2,
  children = 0,
  childrenAges = [],
  nationality = "IN",
  rooms = 1,
}) {
  // TBO /search endpoint REQUIRES HotelCodes (comma-separated string).
  // CityCode is NOT a valid param for the search endpoint.
  // If no hotel codes provided, use curated defaults known to work on staging.
  const resolvedCodes = hotelCodes || CURATED_HOTEL_CODES.join(",");

  const payload = {
    CheckIn: checkIn,
    CheckOut: checkOut,
    HotelCodes: resolvedCodes,
    GuestNationality: nationality,
    PaxRooms: [
      {
        Adults: adults,
        Children: children,
        ChildrenAges: childrenAges,
      },
    ],
    ResponseTime: 23,
    IsDetailedResponse: true,
    Filters: {
      Refundable: false,
      NoOfRooms: rooms,
      MealType: "All",
    },
  };

  console.log(`[TBO] Searching hotels: ${resolvedCodes.split(',').length} codes, ${checkIn} → ${checkOut}`);

  // TBO staging endpoint is /search (NOT /HotelSearch)
  return tboPost("search", payload);
}

/* ────────── Booking Flow ────────── */

export async function preBook(bookingCode) {
  return tboPost("PreBook", {
    BookingCode: bookingCode,
    PaymentMode: "Limit",
  });
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
  return tboPost("Cancel", {
    ConfirmationNumber: confirmationNumber,
  });
}

/**
 * Get all bookings within a date range.
 * @param {string} fromDate - Start date (YYYY-MM-DD)
 * @param {string} toDate - End date (YYYY-MM-DD)
 */
export async function getBookingsByDate(fromDate, toDate) {
  return tboPost("BookingDetailsBasedOnDate", {
    FromDate: fromDate,
    ToDate: toDate,
  });
}

export async function generateVoucher(bookingId) {
  return tboPost("GenerateVoucher", {
    BookingId: bookingId,
  });
}

/* ────────── Hotel Code Caching (per city) ────────── */

const cityCodesCache = new Map(); // cityCode → { codes: number[], time: number }
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get hotel codes for a specific city from TBO (cached).
 * Falls back to curated defaults if the API is slow or fails.
 * @param {string} cityCode - TBO city code
 * @returns {Promise<number[]>} - Array of hotel code numbers
 */
async function getCityHotelCodes(cityCode) {
  if (!cityCode) return CURATED_HOTEL_CODES;

  const now = Date.now();
  const cached = cityCodesCache.get(cityCode);
  if (cached && now - cached.time < CACHE_TTL) {
    return cached.codes;
  }

  try {
    console.log(`[TBO] Fetching hotel codes for city ${cityCode}...`);
    // Use AbortController with 15s timeout so we don't wait 2-3 minutes
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      `${TBO_BASE}/TBOHotelCodeList`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        body: JSON.stringify({ CityCode: String(cityCode), IsDetailedResponse: "true" }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const data = await res.json();
    console.log(`[TBO] TBOHotelCodeList response keys: [${Object.keys(data).join(', ')}]`);

    let codes = [];
    if (data.HotelCodes && Array.isArray(data.HotelCodes)) {
      codes = data.HotelCodes;
    } else if (Array.isArray(data)) {
      codes = data;
    } else {
      const values = Object.values(data);
      const arr = values.find((v) => Array.isArray(v));
      codes = arr || [];
    }

    // Filter out dead codes
    codes = filterDeadCodes(codes);

    if (codes.length > 0) {
      cityCodesCache.set(cityCode, { codes, time: now });
      console.log(`[TBO] Cached ${codes.length} hotel codes for city ${cityCode}`);
      return codes;
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`[TBO] HotelCodeList timed out for city ${cityCode} — using curated defaults`);
    } else {
      console.error(`[TBO] HotelCodeList error for city ${cityCode}:`, err.message);
    }
  }

  // Fallback to curated codes that work on staging
  console.log(`[TBO] Using curated default codes for city ${cityCode}`);
  return CURATED_HOTEL_CODES;
}

/**
 * Get a batch of hotel codes for a city, ready for the search endpoint.
 * @param {string} cityCode - TBO city code (optional, falls back to curated)
 * @param {number} count - Max codes to include (default 50)
 * @returns {Promise<string>} - Comma-separated hotel codes string
 */
export async function getHotelCodeBatch(cityCode, count = 200) {
  const codes = await getCityHotelCodes(cityCode);
  if (!codes || codes.length === 0) return CURATED_HOTEL_CODES.join(",");

  // Take a sample if too many codes (API can't handle 300K at once)
  const batch = codes.length > count
    ? [...codes].sort(() => Math.random() - 0.5).slice(0, count)
    : codes;

  return filterDeadCodes(batch).join(",");
}
