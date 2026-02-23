
import dotenv from 'dotenv';
import { resolveCityCode } from './src/services/cityResolver.js';
import { searchHotels } from './src/services/tboApi.js';
import { getDefaultCheckIn, getDefaultCheckOut } from './src/services/agent/helpers.js';

dotenv.config();

async function testLiveSearch() {
    console.log("=== Testing Live TBO Search ===");
    
    // 1. Resolve City
    const cityQuery = "New Delhi, India";
    console.log(`\nStep 1: Resolving City "${cityQuery}"...`);
    
    // This will trigger the fuse/local load
    const cityCode = await resolveCityCode(cityQuery);
    
    if (!cityCode) {
        console.error("❌ City Resolution Failed!");
        return;
    }
    console.log(`✅ CIty Resolved: ${cityQuery} -> Code: ${cityCode}`);

    // 2. Set Dates
    const checkIn = getDefaultCheckIn(); // Tomorrow
    const checkOut = getDefaultCheckOut(checkIn); // Day after
    
    console.log(`\nStep 2: Searching Hotels for ${checkIn} to ${checkOut}...`);

    try {
        const result = await searchHotels({
            cityCode: cityCode,
            checkIn: checkIn,
            checkOut: checkOut,
            rooms: 1,
            adults: 2,
            nationality: "IN"
        });

        // TBO structure check
        const hotels = result.HotelResult || result.HotelSearchResults?.HotelResult || [];
        
        if (hotels.length > 0) {
            console.log(`\n✅ Success! Found ${hotels.length} hotels.`);
            console.log("Top 3 Results:");
            hotels.slice(0, 3).forEach((h, i) => {
                const name = h.HotelName || h.Name;
                const price = h.Rooms?.[0]?.TotalFare || "N/A";
                console.log(`   ${i+1}. ${name} (Price: ${price})`);
            });
        } else {
            console.log("⚠️ 0 Hotels Found. (Staging env might lack inventory for tomorrow)");
            console.log("Raw Response Status:", result.Status || result);
        }

    } catch (err) {
        console.error("❌ API Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

testLiveSearch();
