/**
 * Intent parser service - lightweight keyword-based intent extraction.
 * No Gemini calls here — the agentService already handles AI understanding.
 * This is used only as a fast, free fallback for direct routes (/hotels, /flights).
 *
 * Destination extraction is done dynamically using NLP patterns,
 * NOT from a hardcoded city list — any city in the world works.
 */

/**
 * Parse user query into structured intent using keyword matching.
 */
export async function parseIntent(query) {
  return parseWithKeywords(query);
}

function parseWithKeywords(query) {
  const queryLower = query.toLowerCase();
  
  // Generate default dates (7 days from now, 2 night stay)
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  
  const intent = {
    travel_type: "trip",
    themes: [],
    style_tags: [],
    check_in: checkIn.toISOString().split("T")[0],
    check_out: checkOut.toISOString().split("T")[0],
    adults: 2,
    children: 0,
    rooms: 1,
  };

  // ── Dynamic destination extraction from query using NLP patterns ──
  // These patterns capture city names from natural language, not from a static list.
  const destPatterns = [
    // "delhi to guwahati" — direct X to Y (prioritize this for "go delhi to guwahati" style)
    /(?:go|going|fly|flying|travel|heading)\s+(?:from\s+)?([a-z][a-z\s]{1,25}?)\s+to\s+([a-z][a-z\s]{1,25}?)(?:\s+(?:from|under|below|budget|for|with|on|in|during|between|around|next|this)|[.,!?]|$)/i,
    // "want to go to X", "want to visit X"
    /(?:want\s+to\s+go\s+to|want\s+to\s+visit|going\s+to|go\s+to)\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s+(?:from|to|under|below|budget|for|with|on|in|during)|[.,!?]|$)/i,
    // "trip to X", "flights to X", "hotels in X", etc.
    /(?:fly\s+to|flights?\s+to|hotels?\s+in|trip\s+to|travel\s+to|heading\s+to|vacation\s+in|holiday\s+in|visit|explore)\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s+(?:from|to|under|below|budget|for|with|on|in|during|between|around|next|this)|[.,!?]|$)/i,
    // "X trip", "X vacation"
    /([A-Za-z][A-Za-z\s]{1,30}?)\s+(?:trip|vacation|holiday|travel|getaway|tour)/i,
  ];

  // ── Dynamic origin extraction ──
  const originPatterns = [
    /(?:from|departing|leaving|starting\s+from|origin|flying\s+from)\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s+(?:to|on|in|for|under|below|budget|next|this)|[.,!?]|$)/i,
  ];

  for (const pat of destPatterns) {
    const m = queryLower.match(pat);
    if (m) {
      // Pattern 0 (X to Y) captures both origin and destination
      if (pat === destPatterns[0] && m[1] && m[2]) {
        const originCandidate = cleanCityName(m[1]);
        const destCandidate = cleanCityName(m[2]);
        if (destCandidate && !isNoiseWord(destCandidate)) {
          intent.destination = capitalize(destCandidate);
        }
        if (originCandidate && !isNoiseWord(originCandidate) && !intent.origin) {
          intent.origin = capitalize(originCandidate);
        }
        break;
      }
      // Other patterns capture only destination in group 1
      if (m[1]) {
        const extracted = cleanCityName(m[1]);
        if (extracted && !isNoiseWord(extracted)) {
          intent.destination = capitalize(extracted);
          break;
        }
      }
    }
  }

  for (const pat of originPatterns) {
    const m = queryLower.match(pat);
    if (m && m[1]) {
      const extracted = cleanCityName(m[1]);
      if (extracted && !isNoiseWord(extracted)) {
        intent.origin = capitalize(extracted);
        break;
      }
    }
  }

  // Fallback: if "X to Y" pattern (e.g., "delhi to guwahati")
  if (!intent.destination) {
    const xyMatch = queryLower.match(/([a-z][a-z\s]{1,25})\s+to\s+([a-z][a-z\s]{1,25})/i);
    if (xyMatch) {
      const from = cleanCityName(xyMatch[1]);
      const to = cleanCityName(xyMatch[2]);
      if (to && !isNoiseWord(to)) {
        intent.destination = capitalize(to);
      }
      if (from && !isNoiseWord(from) && !intent.origin) {
        intent.origin = capitalize(from);
      }
    }
  }

  // Travel type
  if (["flight", "fly", "flying"].some((w) => queryLower.includes(w))) {
    intent.travel_type = "flight";
  } else if (
    ["hotel", "stay", "accommodation", "room", "hostel"].some((w) =>
      queryLower.includes(w)
    )
  ) {
    intent.travel_type = "hotel";
  } else if (
    ["activity", "things to do", "tour", "experience"].some((w) =>
      queryLower.includes(w)
    )
  ) {
    intent.travel_type = "activity";
  }

  // Budget
  const budgetMatch = queryLower.match(/(?:under|below|max|budget)\s*\$?(\d+)/);
  if (budgetMatch) {
    intent.budget_max = parseInt(budgetMatch[1], 10);
  }

  // Themes / Style tags
  const themeMap = {
    romantic: ["romantic", "couples"],
    luxury: ["luxury", "exclusive", "five_star"],
    budget: ["budget", "backpacker"],
    adventure: ["adventure", "hiking", "trekking"],
    beach: ["beach", "tropical", "sea_view"],
    cultural: ["cultural", "historic", "art"],
    art: ["art", "artistic", "cultural"],
    wellness: ["wellness", "yoga", "spa", "retreat"],
    family: ["family"],
    nature: ["nature", "eco", "wilderness"],
    modern: ["modern", "futuristic", "tech"],
    cozy: ["cozy", "rustic", "chalet"],
    nightlife: ["nightlife", "lively", "social"],
    peaceful: ["peaceful", "serene", "zen"],
    unique: ["unique", "once_in_a_lifetime"],
  };

  for (const [keyword, tags] of Object.entries(themeMap)) {
    if (queryLower.includes(keyword)) {
      intent.themes.push(keyword);
      intent.style_tags.push(...tags);
    }
  }

  // Remove duplicates
  intent.style_tags = [...new Set(intent.style_tags)];

  return intent;
}

/** Strip leading noise words from a captured group and normalize whitespace */
function cleanCityName(raw) {
  const LEADING_NOISE = /^(?:i|want|to|go|need|the|a|an|my|some|please|help|let|me|us|we)\s+/i;
  let cleaned = raw.trim().replace(/\s+/g, " ");
  // Repeatedly strip leading noise (handles "i want to go delhi" → "delhi")
  let prev = "";
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(LEADING_NOISE, "");
  }
  return cleaned.trim();
}

/** Capitalize each word */
function capitalize(str) {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Filter out common English words that regex might accidentally capture as city names */
function isNoiseWord(word) {
  const noise = new Set([
    "a", "an", "the", "i", "me", "my", "we", "us", "you", "it",
    "want", "need", "go", "get", "find", "show", "search", "look",
    "some", "any", "good", "best", "cheap", "nice", "great",
    "please", "help", "plan", "book", "trip", "travel", "hotel",
    "flight", "flights", "hotels", "activities", "activity",
    "somewhere", "there", "here", "place", "places",
  ]);
  return noise.has(word.toLowerCase().trim());
}
