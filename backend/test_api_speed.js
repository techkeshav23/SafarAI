import dotenv from 'dotenv';
import { searchTboFlights } from './src/services/tboAirApi.js';
import { getHotelCodeBatch, searchHotels } from './src/services/tboApi.js';

dotenv.config();

async function testApiSpeed() {
  console.log("🚀 Starting API Speed Test...\n");

  // 1. Test Flight API
  console.log("--------------------------------------------------");
  console.log("✈️  Testing TBO Flight API (Delhi -> Mumbai)...");
  const flightStart = Date.now();
  try {
    const flights = await searchTboFlights({
      origin: "DEL",
      destination: "BOM",
      departureDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      adults: 1
    });
    const flightDuration = (Date.now() - flightStart) / 1000;
    console.log(`✅ Flight API Response: ${flights.length} flights found`);
    console.log(`⏱️  Time taken: ${flightDuration.toFixed(2)} seconds`);
  } catch (error) {
    const flightDuration = (Date.now() - flightStart) / 1000;
    console.error(`❌ Flight API Failed after ${flightDuration.toFixed(2)}s:`, error.message);
  }

  // 2. Test Hotel API
  console.log("\n--------------------------------------------------");
  console.log("🏨 Testing TBO Hotel API (Delhi)...");
  const hotelStart = Date.now();
  const cityCode = "130443"; // Delhi
  
  try {
    // Step A: Get Codes
    console.log("   Step 1: Fetching Hotel Codes...");
    const codeStart = Date.now();
    const hotelCodes = await getHotelCodeBatch(cityCode);
    const codeDuration = (Date.now() - codeStart) / 1000;
    console.log(`   ✅ Got codes in ${codeDuration.toFixed(2)}s`);

    // Step B: Search Hotels
    if (hotelCodes) {
      console.log("   Step 2: Searching Hotel Availability...");
      const searchStart = Date.now();
      const checkIn = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const checkOut = new Date(Date.now() + 172800000).toISOString().split('T')[0];
      
      const hotels = await searchHotels({
        cityCode,
        checkIn,
        checkOut,
        hotelCodes,
        rooms: 1,
        adults: 2
      });
      
      const searchDuration = (Date.now() - searchStart) / 1000;
      const resultCount = hotels.HotelResult ? hotels.HotelResult.length : 0;
      console.log(`   ✅ Hotel Search Response: ${resultCount} hotels found`);
      console.log(`   ⏱️  Search time: ${searchDuration.toFixed(2)}s`);
    } else {
      console.log("   ⚠️ No hotel codes found, skipping search.");
    }

    const totalHotelDuration = (Date.now() - hotelStart) / 1000;
    console.log(`⏱️  Total Hotel API Time: ${totalHotelDuration.toFixed(2)} seconds`);

  } catch (error) {
    const totalHotelDuration = (Date.now() - hotelStart) / 1000;
    console.error(`❌ Hotel API Failed after ${totalHotelDuration.toFixed(2)}s:`, error.message);
  }

  console.log("\n--------------------------------------------------");
  console.log("🏁 Test Complete");
}

testApiSpeed();
