# Neighborhood Intelligence — HRM Edition

A **Progressive Web App (PWA)** built with Next.js 15 focused on the **Halifax Regional Municipality (HRM), Nova Scotia, Canada**. Search any HRM civic address and instantly receive a comprehensive neighbourhood scorecard — covering safety, schools, Halifax Transit, walkability, environment, green space, cost of living, and community.

---

## Features

- **Address search** with debounced autocomplete suggestions
- **Scorecard dashboard** — 8 category scores with SVG progress rings, trend indicators, supporting stats, and per-category data source & date attribution
- **Side-by-side comparison** — queue up to 4 neighborhoods and compare every category simultaneously, with per-row winner highlighting
- **Browser history support** — back/forward navigation and deep-linkable URLs (`/?q=address`)
- **PWA-ready** — installable, offline-capable via a hand-written service worker
- **Fully typed** — TypeScript strict mode throughout
- **Clean architecture** — frontend (`src/`) and backend (`server/`) are strictly separated; Next.js API routes are thin wrappers over server-side services

---

## Project Structure

```
.
├── public/                        # Static assets, PWA manifest, service worker
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│
├── server/                        # Backend — shared by Next.js API routes and Express
│   ├── app.ts                     # Single entry point: Express app + Next.js re-exports + standalone boot
│   ├── routes/
│   │   ├── neighborhoodRoute.ts   # HTTP layer for GET /api/neighborhood (Next.js-compatible handler)
│   │   └── suggestionsRoute.ts    # HTTP layer for GET /api/suggestions  (Next.js-compatible handler)
│   ├── services/
│   │   ├── neighborhoodService.ts # Domain logic: geocode → score
│   │   └── suggestionsService.ts  # Domain logic: autocomplete suggestions
│   ├── lib/
│   │   ├── errors.ts              # AppError class + HTTP status mapping
│   │   ├── geocoder.ts            # Nominatim client (geocode + autocomplete)
│   │   └── crimeDataLoader.ts     # HRM open-data crime CSV parser
│   ├── data/
│   │   └── mockDataEngine.ts      # Deterministic scorecard generator (djb2 hash)
│   └── assets/
│       └── Crime.csv              # HRM open-data crime dataset
│
├── src/                           # Next.js frontend
│   ├── app/
│   │   ├── api/
│   │   │   ├── neighborhood/route.ts   # Thin wrapper → server/app.ts neighborhoodRoute
│   │   │   └── suggestions/route.ts    # Thin wrapper → server/app.ts suggestionsRoute
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── SuggestionDropdown.tsx
│   │   ├── ScorecardDashboard.tsx
│   │   ├── AddressHeader.tsx
│   │   ├── OverallScoreRing.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── ScoreBar.tsx
│   │   ├── ComparisonBar.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ErrorState.tsx
│   │   └── InstallPrompt.tsx
│   ├── hooks/
│   │   ├── useNeighborhoodSearch.ts
│   │   ├── useAddressSuggestions.ts
│   │   └── useComparison.ts
│   └── lib/
│       ├── apiBase.ts             # Reads NEXT_PUBLIC_API_BASE for fetch URL prefix
│       ├── types.ts
│       ├── utils.ts
│       └── addressParser.ts
│
├── .env                           # Environment variables (frontend + backend)
├── tsconfig.json                  # Next.js TypeScript config
└── tsconfig.server.json           # Server TypeScript config (CommonJS, used by tsx)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v3 |
| PWA | Custom service worker + Web App Manifest |
| Runtime | Node.js ≥ 18 / npm ≥ 9 |

> **No database or external API keys required.** Scores are generated deterministically from the address string using a djb2 hash — the same address always returns the same data.
> The app is scoped to HRM addresses in Nova Scotia (NS postal codes starting with **B**). Addresses outside HRM return an appropriate validation error.

---

## Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| [Node.js](https://nodejs.org) | 18.0.0 | `node -v` |
| npm | 9.0.0 | `npm -v` |

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node versions easily.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/neighborhood-intelligence.git
cd neighborhood-intelligence
```

### 2. Install dependencies

The repository includes a committed `package-lock.json`, so you can use either command below:

```bash
# Recommended — installs the exact versions recorded in package-lock.json
npm ci

# Alternative — resolves versions fresh from package.json ranges
npm install
```

> **Why `npm ci`?**
> `npm ci` uses `package-lock.json` as the single source of truth and fails fast if the lock file is out of sync. This guarantees every developer and CI environment gets byte-for-byte identical dependencies.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The server supports hot-reload — any file changes are reflected instantly.

---

## Running the app

### Option A — Next.js (recommended)

Next.js serves both the frontend and `/api/*` routes. No extra configuration needed.

```bash
npm run dev        # http://localhost:3000
```

### Option B — Express API + Next.js frontend side-by-side

1. In `.env`, set `NEXT_PUBLIC_API_BASE=http://localhost:3001`
2. Run both servers:
   ```bash
   npm run dev:all
   ```
   Or start them individually:
   ```bash
   npm run dev:server   # Express API on :3001
   npm run dev          # Next.js frontend on :3000
   ```

### Option C — Express API only

```bash
npm run dev:server
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm ci` | Install exact dependencies from `package-lock.json` (recommended for first-time setup) |
| `npm install` | Install/update dependencies from `package.json` version ranges |
| `npm run dev` | Next.js dev server (frontend + API routes) on [localhost:3000](http://localhost:3000) |
| `npm run dev:server` | Standalone Express API server on :3001 |
| `npm run dev:all` | Both servers in parallel via `concurrently` |
| `npm run build` | Create an optimised production build in `.next/` |
| `npm start` | Serve the production build locally (run `npm run build` first) |
| `npm run lint` | Run ESLint across the entire project |

---

## Dependencies

All dependencies are declared in `package.json` and locked in `package-lock.json`. Running `npm ci` installs them without requiring any manual steps.

### Runtime dependencies

**Address format accepted:** `[number] [street], [community], NS [postal code]`
Examples: `2595 Agricola St, Halifax, NS B3K 4C4` · `150 Wyse Rd, Dartmouth, NS B3A 1M5`

| Package | Version | Purpose |
|---|---|---|
| `next` | ^15.3.0 | React framework — App Router, API routes, SSR |
| `react` | ^18 | UI library |
| `react-dom` | ^18 | React DOM renderer |
| `express` | ^4.21.2 | HTTP server for standalone mode |
| `cors` | ^2.8.5 | CORS middleware for the Express app |

### Development dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | Static typing |
| `tsx` | ^4.19.2 | TypeScript executor for running `server/app.ts` directly |
| `concurrently` | ^9.1.2 | Run Next.js and Express side-by-side (`dev:all`) |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework |
| `postcss` | ^8 | CSS processing pipeline for Tailwind |
| `autoprefixer` | ^10 | Adds vendor prefixes to CSS |
| `eslint` | ^8 | Linting |
| `eslint-config-next` | ^15.3.0 | Next.js ESLint ruleset |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^18 | React type definitions |
| `@types/react-dom` | ^18 | React DOM type definitions |
| `@types/express` | ^4.17.21 | Express type definitions |
| `@types/cors` | ^2.8.17 | cors type definitions |

---

## Environment Variables

All variables live in a single `.env` file at the project root.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port for the standalone Express server |
| `NEXT_PUBLIC_API_BASE` | *(empty)* | API base URL for browser fetch calls. Empty = use Next.js relative `/api/*` URLs. Set to `http://localhost:3001` when running Express standalone. |

> When using `npm run dev` (Next.js), leave `NEXT_PUBLIC_API_BASE` empty — Next.js handles `/api/*` itself.  
> When using `npm run dev:server` or `npm run dev:all`, set `NEXT_PUBLIC_API_BASE=http://localhost:3001`.

---

## API Endpoints

Both endpoints are served by the same service layer regardless of runtime. In Next.js mode the thin wrappers in `src/app/api/` call the route handlers from `server/app.ts`; in Express standalone mode `server/app.ts` registers them directly on the Express router.

### `GET /api/neighborhood?address=<address>`

Returns a full neighborhood scorecard for the given address.

| Parameter | Type | Required | Constraints |
|---|---|---|---|
| `address` | string | Yes | HRM civic address — min 5 chars, max 200 chars. NS postal codes only (start with B). |

**Example request**
```
GET /api/neighborhood?address=2595+Agricola+St+Halifax+NS
```

**Example response**
```json
{
  "ok": true,
  "data": {
    "address": "2595 Agricola St, Halifax, NS",
    "neighborhood": "Agricola Street Corridor",
    "city": "Halifax",
    "state": "NS",
    "overallScore": 71,
    "overallBand": "fair",
    "overallLabel": "Above Average",
    "summary": "Maple Heights is an above average area...",
    "categories": [
      {
        "id": "safety",
        "label": "Safety",
        "score": 84,
        "band": "good",
        "trend": "up",
        "description": "Below-average crime rates...",
        "stats": [ { "label": "Annual crimes per 1,000 residents", "value": "12" } ],
        "source": "Halifax Regional Police Service (HRPS)",
        "updatedDate": "Mar 2025"
      }
    ],
    "lastUpdated": "April 1, 2026",
    "dataSource": "NeighborhoodIQ Composite Index (Simulated)"
  }
}
```

### `GET /api/suggestions?q=<query>`

Returns up to 6 address autocomplete suggestions.

| Parameter | Type | Required | Constraints |
|---|---|---|---|
| `q` | string | Yes | min 2 chars |

---

## How Scores Are Generated

Scores are produced by `server/data/mockDataEngine.ts` using a **djb2 hash** of the normalised address string as a deterministic seed:

- The same address **always** returns the same scores
- Different addresses produce different (but consistent) scores
- No randomness, no database — fully reproducible

Each category also carries a `source` (real agency name) and `updatedDate` (deterministic recent date) so the data feels credible and attributable.

In a production deployment, replace `generateNeighborhoodData()` with calls to real HRM/Canadian data providers such as the Halifax Regional Police Service open data portal, HRCE school performance data, Halifax Transit GTFS feeds, Statistics Canada Census API, CMHC housing data, and the Nova Scotia AQHI service.

---

## PWA Installation

The app is installable as a Progressive Web App on desktop and mobile:

1. Open the app in Chrome, Edge, or Safari
2. Look for the **"Install Neighborhood IQ"** banner at the bottom of the screen
3. Click **Install** to add it to your home screen or taskbar
4. The app works offline — static assets are served from cache and previously fetched addresses are available without a network connection

---

## Neighborhood Comparison

1. Search an address to view its scorecard
2. Click **Compare** in the address header to add it to the comparison tray
3. Search more addresses and add them (up to 4 total)
4. Click **Compare Now** in the bottom tray to open the side-by-side view
5. The winning score in each category row is highlighted with a **★ Best** badge
6. Click **Back to Scorecard** to return to the individual view

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
