# StockScope

Cross-platform stock research and paper-trading app (Web, iOS, Android) built with Expo React Native + Express.

Repository: [https://github.com/falihfaizal95/Stock-Scope](https://github.com/falihfaizal95/Stock-Scope)

## What It Does

- Market dashboard with portfolio equity graph and buying power
- Top gainers/losers and crypto movers
- Stock search with detail pages
- Interactive stock chart (hover/crosshair on web)
- Watchlist tracking (added date, entry price, live gain/loss)
- Paper trading from stock detail (buy/sell, holdings updates)
- Trading-hours logic
  - US stocks/ETFs: 9:30 AM-4:00 PM ET, weekdays, major US market holidays excluded
  - Off-hours stock orders are queued
  - Crypto trades 24/7
- News feed + article detail
  - Back-to-news action
  - Refresh behavior (pull-to-refresh + repeat-tap refresh)
  - Image fallbacks and duplicate-image prevention
- Profile/settings with theme mode toggle

## Stack

### Frontend (`/frontend`)
- Expo React Native
- React Navigation (Bottom Tabs + Native Stack)
- React Native Paper
- Firebase Auth + Firestore
- Axios
- react-native-chart-kit

### Backend (`/backend`)
- Node.js + Express
- Finnhub (quotes, profile, market, candles, earnings, peers)
- NewsAPI (headlines)
- NodeCache (5-minute in-memory cache)

## Architecture

- Mobile/web client calls backend under `/api/*`
- Backend normalizes provider payloads and returns consistent response shape
- Fallback data is used when provider auth/rate limits fail to avoid blank screens
- Portfolio/watchlist state persisted in Firestore, with local fallback in web error cases

## Key API Endpoints

- `GET /api/health`
- `GET /api/market/overview`
- `GET /api/market/gainers`
- `GET /api/market/losers`
- `GET /api/crypto`
- `GET /api/stock/search?q=AAPL`
- `GET /api/stock/:symbol`
- `GET /api/stock/:symbol/candles`
- `GET /api/stock/:symbol/related`
- `GET /api/stock/:symbol/earnings`
- `GET /api/news`
- `GET /api/news/wsj`
- `GET /api/news/:symbol`

## Local Development

### Prerequisites
- Node.js 18+ recommended
- npm

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set `backend/.env`:

```env
FINNHUB_API_KEY=your_finnhub_key
NEWS_API_KEY=your_newsapi_key
PORT=3000
```

Run backend:

```bash
npm run dev
```

Backend health:

```bash
curl -s http://localhost:3000/health
```

### 2) Frontend

```bash
cd frontend
npm install
npm start -- --web --port 8081
```

Open:
- `http://localhost:8081`

## Firebase Setup

Update `frontend/src/utils/firebase.js` with your project config.

Minimum required:
- Authentication: Email/Password enabled
- Firestore enabled

## Deployment (Vercel)

This repo is configured for Vercel.

Required project environment variables:
- `FINNHUB_API_KEY`
- `NEWS_API_KEY`

Also ensure deployment protection/auth gates are disabled if you want public access.

## Important Files

- `frontend/src/screens/HomeScreen.js`
- `frontend/src/screens/SearchScreen.js`
- `frontend/src/screens/StockDetailScreen.js`
- `frontend/src/screens/NewsScreen.js`
- `frontend/src/screens/NewsDetailScreen.js`
- `frontend/src/screens/WatchlistScreen.js`
- `frontend/src/screens/ProfileScreen.js`
- `frontend/src/navigation/MainNavigator.js`
- `frontend/src/context/PortfolioContext.js`
- `frontend/src/context/WatchlistContext.js`
- `backend/server.js`
- `CHANGELOG.md`
- `PROJECT_OVERVIEW.txt`

## Troubleshooting

- Blank market/news/search data:
  - Verify Vercel env vars are set and redeploy
  - Check backend logs for provider 401/403/429
- Web not updating:
  - Hard refresh (`Cmd+Shift+R`)
- Missing images:
  - Provider image URLs are filtered/fallbacked; refresh feed to rotate fallback
- Trading behavior:
  - Outside US market hours, stock/ETF orders queue by design
  - Crypto should execute immediately

## Recent Work Log

See `CHANGELOG.md` for commit-level updates and feature/fix history.
