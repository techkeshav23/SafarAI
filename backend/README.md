# Voyehack Backend

## Setup
1. Copy `.env.example` to `.env`
2. Fill in the required API keys:
   - `GEMINI_API_KEY`: Google Gemini API Key
   - `TBO_USERNAME` / `TBO_PASSWORD`: TBO Hotel API credentials
   - `AMADEUS_API_KEY` / `AMADEUS_API_SECRET`: Amadeus Flight API credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints
- `POST /api/search`: Integrated Agentic Search
- `POST /api/search/hotels`: Direct Hotel Search
- `POST /api/search/flights`: Direct Flight Search
