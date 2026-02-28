# SafarAI — AI-Powered Travel Search Engine

An intelligent travel search platform that uses Google Gemini (function calling) to search flights, hotels, and activities from natural language queries.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + React 19 + Tailwind 4)        │
│  ├── Natural language search bar                       │
│  ├── Interactive map (Leaflet + OpenStreetMap)         │
│  ├── Results panel (Flights / Hotels / Itineraries)    │
│  └── AI Chat assistant                                 │
└──────────────────────┬─────────────────────────────────┘
                       │ REST API
┌──────────────────────▼─────────────────────────────────┐
│  Backend (Node.js + Express)                           │
│  ├── Gemini 2.0 Flash — agentic tool-calling engine    │
│  ├── TBO Hotels API (real-time hotel pricing)          │
│  ├── TBO Air API (real-time flight search)             │
│  └── Activity search (local dataset + Fuse.js)         │
└────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone & install

```bash
git clone <repo-url> && cd SafarAI

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your API keys (see backend/.env.example)

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Run

```bash
# Terminal 1 — Backend (port 8000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
SafarAI/
├── backend/
│   ├── src/
│   │   ├── config/          # Centralized configuration
│   │   ├── middleware/       # Express middleware (errors, rate-limit)
│   │   ├── routes/           # Route handlers
│   │   ├── services/         # Business logic
│   │   │   ├── agent/        # Gemini agentic engine
│   │   │   ├── tboApi.js     # TBO Hotels integration
│   │   │   ├── tboAirApi.js  # TBO Flights integration
│   │   │   └── ...
│   │   ├── utils/            # Shared utilities
│   │   └── index.js          # Express app entry
│   ├── data/                 # Static datasets
│   └── scripts/              # Dev/debug scripts
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui primitives
│   │   │   ├── features/     # Feature components
│   │   │   └── layout/       # Layout components
│   │   └── lib/              # API client, types, utils
│   └── public/
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/search/` | Agentic search (Gemini + tools) |
| `POST` | `/api/search/hotels` | Direct hotel search |
| `POST` | `/api/search/flights` | Direct flight search |
| `POST` | `/api/booking/prebook` | Pre-book a hotel room |
| `POST` | `/api/booking/confirm` | Confirm booking |
| `POST` | `/api/booking/detail` | Get booking details |
| `POST` | `/api/booking/cancel` | Cancel booking |
| `GET`  | `/health` | Health check |

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-2.0-flash`) |
| `TBO_USERNAME` | Yes | TBO Hotels API username |
| `TBO_PASSWORD` | Yes | TBO Hotels API password |
| `TBO_AIR_USERNAME` | Yes | TBO Air API username |
| `TBO_AIR_PASSWORD` | Yes | TBO Air API password |
| `PORT` | No | Server port (default: `8000`) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8000`) |

## License

MIT
