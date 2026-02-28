# SafarAI Backend

Express API server powering the SafarAI travel search engine.

## Setup

1. Copy `.env.example` → `.env` and fill in your API keys
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── config/          # Centralized env/config
├── middleware/       # Error handler, rate limiter, logger
├── routes/          # Express route handlers
│   ├── search.js    # /api/search/*
│   └── booking.js   # /api/booking/*
├── services/        # Business logic
│   ├── agent/       # Gemini agentic engine (prompts, tools, helpers)
│   ├── tboApi.js    # TBO Hotels integration
│   ├── tboAirApi.js # TBO Air integration
│   ├── cityResolver.js
│   ├── intentParser.js
│   ├── mockHotels.js
│   └── searchEngine.js  # Activity search
├── utils/           # Shared utilities (transforms, date helpers)
└── index.js         # Entry point
data/                # Static datasets (cities, activities)
scripts/             # Dev/debug scripts
```
