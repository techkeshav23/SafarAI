
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCountryList, getCityList } from './src/services/tboApi.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'all_cities.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper for delays to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllCities() {
    console.log("Starting TBO City Scan...");
    let allCities = [];

    try {
        console.log("1. Fetching Country List...");
        const countryResponse = await getCountryList();
        
        // Handle different possible response structures
        const countries = countryResponse.CountryList || countryResponse || [];

        if (!Array.isArray(countries) || countries.length === 0) {
            console.error("No countries found! Response:", JSON.stringify(countryResponse).substring(0, 200));
            return;
        }

        console.log(`Found ${countries.length} countries. Starting city scan...`);
        
        // Loop through all countries
        for (let i = 0; i < countries.length; i++) {
            const country = countries[i];
            const countryCode = country.Code; 
            const countryName = country.Name;

            // Log progress every 10 countries to keep output clean but visible
            if (i % 5 === 0) console.log(`[${i + 1}/${countries.length}] Processing ${countryName} (${countryCode})...`);

            try {
                // Fetch cities for this country
                const cityResponse = await getCityList(countryCode);
                const cities = cityResponse.CityList || [];

                if (cities.length > 0) {
                    const mappedCities = cities.map(city => ({
                        code: String(city.Code), // Ensure code is string
                        name: city.Name,
                        countryCode: countryCode, 
                        countryName: countryName
                    }));
                    allCities.push(...mappedCities);
                    // console.log(`   -> Added ${cities.length} cities.`);
                }
                
                // Be nice to the API
                await delay(100);

            } catch (err) {
                // Log error but continue to next country
                console.warn(`   -> Failed to fetch cities for ${countryName}: ${err.message}`);
                await delay(500); // Wait a bit longer on error
            }
        }

        console.log(`\nScan Complete! Total cities found: ${allCities.length}`);
        
        // Save the full list
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCities, null, 2));
        console.log(`Success! Data saved to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error("Fatal Error in script:", err);
    }
}

// Run the function
fetchAllCities();
