/**
 * City code resolver - maps city names to TBO city codes.
 * Optimized for local lookup using 53,000+ city dataset.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Fuse from "fuse.js";

// Calculate paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming structure: backend/src/services/cityResolver.js -> backend/data/all_cities.json
const DATA_FILE = path.join(__dirname, "..", "..", "data", "all_cities.json");

// In-memory index for fast lookups
const cityIndex = new Map();
let isInitialized = false;
let fuse = null; // Fuse.js instance for fuzzy search

// Common aliases map to help user queries match official names
const CITY_ALIASES = {
  "delhi": "New Delhi, India",
  "new delhi": "New Delhi, India",
  "nyc": "New York, United States", 
  "la": "Los Angeles, United States",
  "kl": "Kuala Lumpur, Malaysia",
  "bangalore": "Bangalore, India", 
  "bengaluru": "Bangalore, India",
  "bombay": "Mumbai, India",
  "mumbai": "Mumbai, India",
  "chennai": "Chennai, India",
  "madras": "Chennai, India",
  "kolkata": "Kolkata, India",
  "calcutta": "Kolkata, India",
  "benaras": "Varanasi, India",
  "banaras": "Varanasi, India",
  "kashi": "Varanasi, India",
  "cochin": "Kochi, India",
  "kochi": "Kochi, India",
  "aleppey": "Alappuzha, India",
  "alleppey": "Alappuzha, India",
  "pondicherry": "Pondicherry, India",
  "pondi": "Pondicherry, India",
  "shimla": "Shimla, India",
  "goa": "Goa, India", 
  "dubai": "Dubai, United Arab Emirates",
  "london": "London, United Kingdom",
  "paris": "Paris, France",
  "singapore": "Singapore, Singapore",
  "bangkok": "Bangkok, Thailand",
  "tokyo": "Tokyo, Japan",
  "bali": "Bali, Indonesia",
  "agra": "Agra, India",
  "jaipur": "Jaipur, India",
  "udaipur": "Udaipur, India",
  "manali": "Manali, India",
  "pune": "Pune, India",
  "hyderabad": "Hyderabad, India"
};

/**
 * Load and index the city data from JSON file.
 * This runs once on first access.
 */
function initializeCityIndex() {
  if (isInitialized) return;

  console.log(`[CityResolver] Loading cities from ${DATA_FILE}...`);
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`[CityResolver] Data file not found at ${DATA_FILE}. Run 'node scan_cities.js' first.`);
      return;
    }

    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const cities = JSON.parse(rawData);

    let count = 0;
    
    // First Pass: Index full names CONSTRUCTED from name + country
    // The data file has {"name": "Bamiyan", "countryName": "Afghanistan"}
    // But user asks for "Bamiyan, Afghanistan".
    // We must synthesize "City, Country" as a key.
    for (const city of cities) {
      if (!city.name || !city.code) continue;
      const code = String(city.code);
      const name = city.name.toLowerCase().trim();
      const country = (city.countryName || "").toLowerCase().trim();

      // 1. Index just the city name: "bamiyan"
      cityIndex.set(name, code);
      
      // 2. Index "city, country": "bamiyan, afghanistan"
      if (country) {
          const fullName = `${name}, ${country}`;
          cityIndex.set(fullName, code);
      }

      count++;
    }

    // Second Pass: Index simple names ... (This block is now redundant but safe to keep or remove. Let's simplify)
    // Actually, the previous pass covers both simple and combo.
    
    // Initialize Fuse.js for fuzzy search
    // We pass the raw cities array to Fuse but we should enhance the searchable fields
    // Fuse needs to search "City, Country" too.
    const fuseData = cities.map(c => ({
        ...c,
        fullName: `${c.name}, ${c.countryName}`
    }));

    const fuseOptions = {
        keys: ["name", "fullName", "countryName"], // Search in name, constructed fullname, and country
        includeScore: true,
        threshold: 0.3, 
        ignoreLocation: true
    };
    // Re-initialize fuse here inside the function scope where 'cities' is available
    fuse = new Fuse(fuseData, fuseOptions);
    console.log(`[CityResolver] Fuse.js initialized with threshold 0.3`);

    // Third Pass: Explicit Overrides for ambiguity resolution
    // Use the CITY_ALIASES values to find the correct code for the "canonical" version
    // checking if the "target" (e.g. "Paris, France") exists in our index.
    for (const [alias, targetName] of Object.entries(CITY_ALIASES)) {
        const targetKey = targetName.toLowerCase();
        if (cityIndex.has(targetKey)) {
            const correctCode = cityIndex.get(targetKey);
            // Map the alias (e.g. "paris" or "delhi") to the correct code
            cityIndex.set(alias, correctCode);
        }
    }

    console.log(`[CityResolver] Indexed ${count} cities. Map size: ${cityIndex.size}`);
    isInitialized = true;
  } catch (err) {
    console.error(`[CityResolver] Failed to load city index: ${err.message}`);
  }
}

/**
 * Resolve a destination name to a TBO city code.
 */
export async function resolveCityCode(destination) {
  if (!destination) return null;
  
  if (!isInitialized) initializeCityIndex();

  let key = destination.toLowerCase().trim();

  // Check map directly (aliases are already folded into map during init)
  if (cityIndex.has(key)) {
      return cityIndex.get(key);
  }
  
  // Try removing ", india" or other country names if present to find a base match
  if (key.includes(",")) {
      const parts = key.split(",");
      const baseName = parts[0].trim();
      if (cityIndex.has(baseName)) {
          console.log(`[CityResolver] Exact match found for base name: "${baseName}" -> "${key}"`);
          return cityIndex.get(baseName);
      }
  }

  // Fallback: Fuzzy Search if no exact match
  // Only attempt if init is complete and we have a valid query
  if (fuse && destination.length > 2) {
      const results = fuse.search(destination); 
      if (results.length > 0) {
          const bestMatch = results[0];
          // Log the successful fuzzy match
          console.log(`[CityResolver] Fuzzy match: "${destination}" -> "${bestMatch.item.name}" (Score: ${bestMatch.score ? bestMatch.score.toFixed(3) : 'N/A'})`);
          return String(bestMatch.item.code);
      }
  }

  console.warn(`[CityResolver] No match found for "${destination}"`);
  return null;
}

/**
 * Search cities by name (mocked to match interface if needed elsewhere).
 */
export async function searchCities(countryCode) {
    return []; 
}

/**
 * Get TBO city code wrapper.
 */
export async function getCityCode(destination, countryCode) {
  return await resolveCityCode(destination);
}
