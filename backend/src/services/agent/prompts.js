const today = new Date().toISOString().split("T")[0];

export const SYSTEM_INSTRUCTION = `You are Voyage AI, an expert travel assistant that helps users discover and book travel experiences.

CURRENT DATE: ${today}

YOUR CAPABILITIES:
- Search for hotels in any destination worldwide (with real-time pricing)
- Search for flights between cities (with real airline data)
- Find activities, tours, and experiences at destinations
- Understand follow-up questions using conversation context

BEHAVIOR RULES:
1. MANDATORY: For any query mentioning a destination (e.g. "trip to Bali", "go to London", "Delhi to Mumbai"), you MUST call BOTH 'search_flights' (if origin implied) AND 'search_hotels'. Do not assume they have a place to stay.
2. Even if the user only asks for "flights", proactively check hotels for the destination as a helpful assistant unless they say "flight only".
3. For specific queries (e.g., "flights to Paris"), still consider suggesting hotels.
4. For follow-up queries (e.g., "show me cheaper ones", "what about with a pool?"), use conversation context to understand what the user wants and search with updated filters.
5. When no origin city is mentioned for flights, ask or default based on context.
6. Default check-in is tomorrow, check-out is 2 days after check-in.
7. Always be enthusiastic, specific, and mention actual names and prices from the search results.
8. Keep responses concise (3-5 sentences). Use markdown formatting (**bold** for names/prices).
9. If the destination is ambiguous, make a reasonable assumption and proceed.
10. IMPORTANT: Always call at least one search tool before giving your final answer. Do NOT fabricate hotel/flight data.
11. When multiple tool calls are needed, call them all at once for efficiency.`;

export const functionDeclarations = [
  {
    name: "plan_trip",
    description: "Search for BOTH flight options AND hotel options for a trip. Use this whenever the user asks for 'trip to', 'vacation in', or 'go to [city] from [city]'. Saves you from calling two separate tools.",
    parameters: {
      type: "OBJECT",
      properties: {
        origin: { type: "STRING", description: "Departure city (e.g. Delhi)" },
        destination: { type: "STRING", description: "Destination city (e.g. Bangalore)" },
        start_date: { type: "STRING", description: "Trip start date (YYYY-MM-DD)" },
        end_date: { type: "STRING", description: "Trip end date (YYYY-MM-DD)" },
        adults: { type: "INTEGER", description: "Number of travelers" },
      },
      required: ["destination"]
    }
  },
  {
    name: "search_hotels",
    description:
      "Search for hotels in a destination city. Returns a list of hotels. CALL THIS whenever the user mentions traveling to a city (e.g. 'go to London', 'visit Paris', 'Delhi to Mumbai'). Do not skip this unless user says 'flight only'.",
    parameters: {
      type: "OBJECT",
      properties: {
        destination: {
          type: "STRING",
          description:
            "City or destination name, e.g. 'Paris', 'Bali', 'Dubai'",
        },
        check_in: {
          type: "STRING",
          description: "Check-in date YYYY-MM-DD",
        },
        check_out: {
          type: "STRING",
          description: "Check-out date YYYY-MM-DD",
        },
        budget_max: {
          type: "NUMBER",
          description: "Maximum budget per night in USD",
        },
        adults: {
          type: "INTEGER",
          description: "Number of adults, default 2",
        },
        rooms: {
          type: "INTEGER",
          description: "Number of rooms, default 1",
        },
        style_tags: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Style preferences: luxury, budget, boutique, romantic, modern, eco, etc.",
        },
        themes: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Trip themes: beach, adventure, wellness, cultural, spa, etc.",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_flights",
    description:
      "Find flights between two cities. Use ONLY when user mentions 'flight', 'fly', 'plane', or traveling from one city to another.",
    parameters: {
      type: "OBJECT",
      properties: {
        origin: {
          type: "STRING",
          description: "Departure city name, default 'Delhi'",
        },
        destination: {
          type: "STRING",
          description: "Arrival city name",
        },
        departure_date: {
          type: "STRING",
          description: "Departure date YYYY-MM-DD",
        },
        return_date: {
          type: "STRING",
          description: "Optional return date for round-trip YYYY-MM-DD",
        },
        adults: {
          type: "INTEGER",
          description: "Number of passengers, default 1",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_activities",
    description:
      "Search for activities, tours, sightseeing, and things to do at a destination. Use this when the user wants experiences or is planning activities.",
    parameters: {
      type: "OBJECT",
      properties: {
        destination: {
          type: "STRING",
          description: "City or destination name",
        },
        themes: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Activity themes: adventure, cultural, food, nature, nightlife, etc.",
        },
      },
      required: ["destination"],
    },
  },
];
