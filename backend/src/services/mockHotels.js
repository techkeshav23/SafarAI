/**
 * Mock hotel data generator — provides realistic fallback hotels
 * when TBO API returns no results for a destination.
 * Hotels are clearly marked with source: "mock" so the UI can badge them.
 */

const HOTEL_TEMPLATES = {
  // ─── India ──────────────────────────────────────────────
  delhi: [
    { name: "The Imperial New Delhi", rating: 4.8, star: 5, price: 185, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Airport Shuttle"], desc: "Heritage luxury hotel near Connaught Place with colonial-era architecture and world-class dining." },
    { name: "The Oberoi New Delhi", rating: 4.7, star: 5, price: 220, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Gym", "Business Center"], desc: "Elegant five-star property overlooking the Delhi Golf Club greens." },
    { name: "ITC Maurya Delhi", rating: 4.6, star: 5, price: 195, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Free WiFi", "Pool", "Bukhara Restaurant", "Spa"], desc: "Iconic luxury hotel famous for its award-winning Bukhara restaurant." },
    { name: "Radisson Blu Plaza Delhi", rating: 4.2, star: 4, price: 95, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Pool", "Gym", "Restaurant"], desc: "Modern airport-area hotel with excellent connectivity to the city center." },
    { name: "Zostel Delhi", rating: 4.0, star: 2, price: 25, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Common Kitchen", "Lounge"], desc: "Vibrant backpacker hostel in Paharganj with a social atmosphere." },
    { name: "Lemon Tree Premier Delhi", rating: 4.1, star: 4, price: 75, img: "https://images.unsplash.com/photo-1590490360182-c33d955c4644?w=800", amenities: ["Free WiFi", "Pool", "Restaurant", "Gym"], desc: "Upscale mid-range hotel near Aerocity with modern amenities." },
  ],
  mumbai: [
    { name: "Taj Mahal Palace Mumbai", rating: 4.9, star: 5, price: 350, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Sea View", "Heritage Walk"], desc: "The iconic waterfront palace hotel overlooking the Gateway of India." },
    { name: "The Oberoi Mumbai", rating: 4.7, star: 5, price: 280, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Free WiFi", "Pool", "Ocean View", "Spa", "Fine Dining"], desc: "Contemporary luxury with panoramic views of Marine Drive." },
    { name: "ITC Maratha Mumbai", rating: 4.5, star: 5, price: 160, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Peshawri Restaurant"], desc: "Grand Maratha-inspired hotel near the international airport." },
    { name: "Hotel Marine Plaza", rating: 4.0, star: 4, price: 90, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Pool", "Sea View", "Restaurant"], desc: "Art deco boutique hotel on Marine Drive with glass-bottom pool." },
    { name: "Treebo Trend Daksh", rating: 3.8, star: 3, price: 40, img: "https://images.unsplash.com/photo-1590490360182-c33d955c4644?w=800", amenities: ["Free WiFi", "AC", "Restaurant"], desc: "Affordable and clean stay in Andheri near the airport." },
  ],
  bangalore: [
    { name: "The Leela Palace Bengaluru", rating: 4.8, star: 5, price: 210, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Golf", "Fine Dining"], desc: "Opulent royal-style palace hotel on Old Airport Road." },
    { name: "ITC Gardenia Bengaluru", rating: 4.6, star: 5, price: 170, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Free WiFi", "Pool", "LEED Platinum", "Spa"], desc: "Eco-luxury hotel and the world's largest LEED Platinum-certified hotel." },
    { name: "Taj West End Bengaluru", rating: 4.5, star: 5, price: 155, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Free WiFi", "Heritage Garden", "Pool", "Spa"], desc: "120-year-old heritage hotel set in 20 acres of tropical gardens." },
    { name: "Lemon Tree Whitefield", rating: 4.0, star: 4, price: 65, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Pool", "Gym", "Restaurant"], desc: "Modern mid-range hotel in Bengaluru's IT hub." },
    { name: "Zostel Bengaluru", rating: 3.9, star: 2, price: 20, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Common Area", "Cafe"], desc: "Social hostel in Koramangala, popular with digital nomads." },
  ],
  goa: [
    { name: "Taj Exotica Resort Goa", rating: 4.8, star: 5, price: 250, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Private Beach", "Pool", "Spa", "Golf", "Free WiFi"], desc: "Mediterranean-style luxury resort on Benaulim Beach." },
    { name: "W Goa", rating: 4.6, star: 5, price: 200, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Beach Access", "Pool", "DJ Nights", "Spa", "Free WiFi"], desc: "Trendy beach retreat with vibrant nightlife and stunning sunset views." },
    { name: "Alila Diwa Goa", rating: 4.5, star: 5, price: 140, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Pool", "Spa", "Paddy Field View", "Free WiFi"], desc: "Contemporary resort surrounded by lush paddy fields in South Goa." },
    { name: "The Hosteller Goa", rating: 4.1, star: 2, price: 18, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Common Kitchen", "Beach Nearby"], desc: "Backpacker-friendly hostel steps from Anjuna Beach." },
    { name: "Resort Rio Goa", rating: 4.0, star: 4, price: 80, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Pool", "Water Park", "Casino", "Free WiFi"], desc: "All-in-one resort with casino, water park, and river views." },
  ],
  jaipur: [
    { name: "Rambagh Palace Jaipur", rating: 4.9, star: 5, price: 380, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Heritage Palace", "Pool", "Polo Ground", "Spa", "Free WiFi"], desc: "Former residence of the Maharaja of Jaipur, now a grand heritage hotel." },
    { name: "ITC Rajputana Jaipur", rating: 4.4, star: 5, price: 120, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Free WiFi", "Pool", "Spa", "Rajasthani Dining"], desc: "Rajasthani-style luxury hotel near the vibrant local markets." },
    { name: "Zostel Jaipur", rating: 4.0, star: 2, price: 15, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Rooftop", "Common Kitchen"], desc: "Colorful hostel with rooftop views of Nahargarh Fort." },
    { name: "Holiday Inn Jaipur", rating: 4.1, star: 4, price: 70, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Pool", "Restaurant", "Gym"], desc: "Comfortable city hotel with easy access to Jaipur's attractions." },
  ],

  // ─── International ─────────────────────────────────────
  dubai: [
    { name: "Burj Al Arab Jumeirah", rating: 4.9, star: 5, price: 800, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Butler Service", "Private Beach", "Spa", "Helipad", "Free WiFi"], desc: "The world's most iconic luxury hotel, shaped like a sail on its own island." },
    { name: "Atlantis The Palm", rating: 4.6, star: 5, price: 320, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Aquaventure Waterpark", "Aquarium", "Pool", "Beach", "Free WiFi"], desc: "Spectacular resort on Palm Jumeirah with waterpark and marine experiences." },
    { name: "JW Marriott Marquis Dubai", rating: 4.5, star: 5, price: 180, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Free WiFi", "Pool", "Spa", "15 Restaurants"], desc: "One of the world's tallest hotels with skyline views of Downtown Dubai." },
    { name: "Rove Downtown Dubai", rating: 4.2, star: 3, price: 85, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Pool", "Burj Khalifa View", "Cafe"], desc: "Trendy mid-range hotel steps from Dubai Mall and Burj Khalifa." },
    { name: "Premier Inn Dubai", rating: 3.9, star: 3, price: 55, img: "https://images.unsplash.com/photo-1590490360182-c33d955c4644?w=800", amenities: ["Free WiFi", "Restaurant", "Gym"], desc: "Budget-friendly hotel chain with consistently clean rooms." },
  ],
  singapore: [
    { name: "Marina Bay Sands", rating: 4.7, star: 5, price: 400, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Infinity Pool", "SkyPark", "Casino", "Mall", "Free WiFi"], desc: "Iconic triple-tower hotel with the world's largest rooftop infinity pool." },
    { name: "Raffles Singapore", rating: 4.8, star: 5, price: 500, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Heritage", "Butler Service", "Spa", "Long Bar", "Free WiFi"], desc: "Legendary colonial luxury hotel, birthplace of the Singapore Sling." },
    { name: "Capella Singapore", rating: 4.6, star: 5, price: 350, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Pool", "Spa", "Sentosa Beach", "Free WiFi"], desc: "Tranquil Sentosa Island resort blending colonial and modern architecture." },
    { name: "Hotel G Singapore", rating: 4.1, star: 3, price: 100, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Restaurant", "Bar", "Gym"], desc: "Hip lifestyle hotel in the Bugis arts district." },
  ],
  bangkok: [
    { name: "Mandarin Oriental Bangkok", rating: 4.8, star: 5, price: 280, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["River View", "Spa", "Pool", "Cooking School", "Free WiFi"], desc: "Legendary riverside hotel with 140+ years of heritage hospitality." },
    { name: "The Siam Bangkok", rating: 4.7, star: 5, price: 250, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Pool", "Muay Thai Ring", "Spa", "Art Collection", "Free WiFi"], desc: "Boutique urban resort with private pier and curated art throughout." },
    { name: "Anantara Riverside Bangkok", rating: 4.4, star: 5, price: 120, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Pool", "Spa", "River Shuttle", "Free WiFi"], desc: "Tropical riverside escape with free shuttle boat to BTS station." },
    { name: "Lub d Silom Bangkok", rating: 4.0, star: 2, price: 22, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Bar", "Common Area", "Laundry"], desc: "Award-winning social hostel in the heart of Silom nightlife." },
  ],
  london: [
    { name: "The Ritz London", rating: 4.8, star: 5, price: 550, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Afternoon Tea", "Spa", "Fine Dining", "Free WiFi"], desc: "Iconic Piccadilly hotel synonymous with luxury and afternoon tea." },
    { name: "The Savoy London", rating: 4.7, star: 5, price: 450, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["River View", "Pool", "Spa", "Theatre District", "Free WiFi"], desc: "Art deco masterpiece on the Strand with Thames views." },
    { name: "Premier Inn London City", rating: 4.0, star: 3, price: 95, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Free WiFi", "Restaurant", "Central Location"], desc: "Reliable budget hotel near Tower Bridge and the City." },
    { name: "Generator London", rating: 3.9, star: 2, price: 35, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Bar", "Events", "Lounge"], desc: "Stylish hostel in a converted police barracks near Russell Square." },
  ],
  paris: [
    { name: "Le Meurice Paris", rating: 4.9, star: 5, price: 600, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Tuileries View", "Spa", "Michelin Dining", "Free WiFi"], desc: "Palace hotel facing the Tuileries Garden with Dalí-inspired decor." },
    { name: "Hôtel Plaza Athénée", rating: 4.8, star: 5, price: 550, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Eiffel Tower View", "Dior Spa", "Alain Ducasse", "Free WiFi"], desc: "Couture-chic palace on Avenue Montaigne with Eiffel Tower views." },
    { name: "Citadines Les Halles", rating: 4.1, star: 3, price: 120, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", amenities: ["Kitchen", "Free WiFi", "Central Paris", "Laundry"], desc: "Self-catering apart-hotel in the heart of Les Halles." },
    { name: "Generator Paris", rating: 3.8, star: 2, price: 30, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Rooftop Bar", "Common Kitchen"], desc: "Design hostel near Canal Saint-Martin with vibrant rooftop bar." },
  ],
  bali: [
    { name: "Four Seasons Bali at Sayan", rating: 4.9, star: 5, price: 450, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", amenities: ["Jungle Valley", "Infinity Pool", "Spa", "Yoga", "Free WiFi"], desc: "Stunning valley resort perched above the Ayung River gorge." },
    { name: "The Mulia Bali", rating: 4.7, star: 5, price: 300, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", amenities: ["Beachfront", "6 Pools", "Spa", "Fine Dining", "Free WiFi"], desc: "Beachfront mega-resort in Nusa Dua with six swimming pools." },
    { name: "Alila Ubud", rating: 4.5, star: 5, price: 180, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", amenities: ["Valley View", "Infinity Pool", "Spa", "Cooking Class", "Free WiFi"], desc: "Eco-luxury hillside retreat overlooking the Ayung River valley." },
    { name: "Capsule Hotel Bali", rating: 4.0, star: 2, price: 15, img: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800", amenities: ["Free WiFi", "Pool", "Airport Shuttle"], desc: "Modern capsule hotel near Kuta Beach, great for transit stays." },
  ],
};

// Aliases mapping from various names to the template key
const CITY_ALIASES = {
  "new delhi": "delhi",
  "bengaluru": "bangalore",
  "bombay": "mumbai",
  "panaji": "goa",
  "panjim": "goa",
  "calangute": "goa",
  "seminyak": "bali",
  "ubud": "bali",
  "kuta": "bali",
  "denpasar": "bali",
};

/**
 * Generate mock hotel results for a destination.
 * Returns hotels in our unified format with source: "mock".
 *
 * @param {string} destination - City name (e.g. "Delhi", "Paris")
 * @param {string} checkIn - Check-in date
 * @param {string} checkOut - Check-out date
 * @param {number} rooms - Number of rooms
 * @returns {Array} - Array of hotel objects in unified format
 */
export function generateMockHotels(destination, checkIn, checkOut, rooms = 1) {
  const key = destination.toLowerCase().trim();
  const aliased = CITY_ALIASES[key] || key;
  const templates = HOTEL_TEMPLATES[aliased];

  if (!templates) {
    // Generate generic hotels for unknown cities
    return generateGenericHotels(destination, checkIn, checkOut, rooms);
  }

  return templates.map((t, idx) => {
    const USD_TO_INR = 84.5;
    const priceInr = Math.round(t.price * USD_TO_INR);
    const nightlyTotal = priceInr * rooms;
    const stayTotal = nightlyTotal * getNights(checkIn, checkOut);
    const tax = Math.round(priceInr * 0.18);
    return {
    id: `mock-${aliased}-${idx}`,
    name: t.name,
    city: capitalize(destination),
    country: "",
    description: t.desc,
    price_per_night: nightlyTotal,
    total_fare: stayTotal,
    currency: "INR",
    tax,
    rating: t.rating,
    star_rating: t.star,
    amenities: t.amenities,
    image_url: t.img,
    latitude: 0,
    longitude: 0,
    style_tags: getStyleTags(t),
    match_score: null,
    match_reason: null,
    hotel_code: null,
    booking_code: null,
    rooms: [{
      room_name: t.star >= 4 ? "Deluxe Room" : "Standard Room",
      booking_code: null,
      inclusion: "",
      meal_type: t.star >= 4 ? "Breakfast Included" : "Room Only",
      total_fare: stayTotal,
      total_tax: tax,
      is_refundable: t.star >= 4,
      cancel_policies: [],
      day_rates: [],
      promotions: [],
    }],
    source: "mock",
  };
  });
}

/**
 * Generate generic hotels for cities not in our curated list.
 */
function generateGenericHotels(destination, checkIn, checkOut, rooms = 1) {
  const city = capitalize(destination);
  const nights = getNights(checkIn, checkOut);
  const templates = [
    { name: `${city} Grand Hotel`, rating: 4.5, star: 5, price: 180, amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"], desc: `Premium five-star hotel in the heart of ${city} with world-class amenities.` },
    { name: `${city} Palace Resort`, rating: 4.3, star: 4, price: 120, amenities: ["Free WiFi", "Pool", "Restaurant", "Bar"], desc: `Elegant resort offering a blend of comfort and sophistication in ${city}.` },
    { name: `${city} Business Hotel`, rating: 4.1, star: 4, price: 85, amenities: ["Free WiFi", "Business Center", "Restaurant", "Gym"], desc: `Modern business hotel with conference facilities and convenient location.` },
    { name: `${city} Comfort Inn`, rating: 3.9, star: 3, price: 55, amenities: ["Free WiFi", "Restaurant", "Parking"], desc: `Comfortable mid-range stay with friendly service and clean rooms.` },
    { name: `${city} Backpackers Hub`, rating: 3.7, star: 2, price: 20, amenities: ["Free WiFi", "Common Kitchen", "Lounge"], desc: `Budget-friendly hostel perfect for backpackers exploring ${city}.` },
  ];

  return templates.map((t, idx) => {
    const USD_TO_INR = 84.5;
    const priceInr = Math.round(t.price * USD_TO_INR);
    const nightlyTotal = priceInr * rooms;
    const stayTotal = nightlyTotal * nights;
    const tax = Math.round(priceInr * 0.18);
    return {
    id: `mock-generic-${idx}`,
    name: t.name,
    city,
    country: "",
    description: t.desc,
    price_per_night: nightlyTotal,
    total_fare: stayTotal,
    currency: "INR",
    tax,
    rating: t.rating,
    star_rating: t.star,
    amenities: t.amenities,
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    latitude: 0,
    longitude: 0,
    style_tags: getStyleTags(t),
    match_score: null,
    match_reason: null,
    hotel_code: null,
    booking_code: null,
    rooms: [{
      room_name: t.star >= 4 ? "Deluxe Room" : "Standard Room",
      booking_code: null,
      inclusion: "",
      meal_type: t.star >= 4 ? "Breakfast Included" : "Room Only",
      total_fare: stayTotal,
      total_tax: tax,
      is_refundable: t.star >= 4,
      cancel_policies: [],
      day_rates: [],
      promotions: [],
    }],
    source: "mock",
  };
  });
}

// ─── Helpers ────────────────────────────────────────────

function getNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getStyleTags(t) {
  const tags = [];
  if (t.star >= 5) tags.push("luxury");
  if (t.star <= 2) tags.push("budget");
  if (t.star === 3 || t.star === 4) tags.push("mid-range");
  if (t.price < 30) tags.push("backpacker");
  if (t.amenities?.includes("Spa")) tags.push("wellness");
  if (t.amenities?.includes("Beach") || t.amenities?.includes("Private Beach") || t.amenities?.includes("Beach Access")) tags.push("beach");
  return tags;
}
