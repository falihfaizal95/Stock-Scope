# StockScope Backend API

Node.js + Express backend for the StockScope app.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
```env
FINNHUB_API_KEY=your_key_here
NEWS_API_KEY=your_key_here
PORT=3000
```

4. Start the server:
```bash
npm run dev
```

## 📡 API Endpoints

### Stock Endpoints

#### Search Stocks
```
GET /api/stock/search?q={query}
```
Search for stocks by symbol or company name.

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "type": "Common Stock"
  }
]
```

#### Get Stock Details
```
GET /api/stock/:symbol
```
Get detailed information about a specific stock.

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc",
  "price": 150.25,
  "change": 2.50,
  "changePercent": 1.69,
  "volume": 50000000,
  "marketCap": 2500000000000,
  "week52High": 180.00,
  "week52Low": 120.00
}
```

#### Market Overview
```
GET /api/market/overview
```
Get overview of major market indices.

**Response:**
```json
{
  "sp500": 4500.25,
  "sp500Change": 0.5,
  "nasdaq": 15000.50,
  "nasdaqChange": 0.8
}
```

#### Top Gainers
```
GET /api/market/gainers
```
Get top gaining stocks.

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "price": 150.25,
    "change": 2.50,
    "changePercent": 1.69
  }
]
```

#### Top Losers
```
GET /api/market/losers
```
Get top losing stocks.

### News Endpoints

#### General News
```
GET /api/news
```
Get general financial news.

**Response:**
```json
[
  {
    "title": "Market Update",
    "description": "Stock market rises...",
    "source": "Reuters",
    "url": "https://...",
    "publishedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Stock News
```
GET /api/news/:symbol
```
Get news specific to a stock symbol.

## 🔧 Configuration

### Environment Variables

- `FINNHUB_API_KEY` - Your Finnhub API key
- `NEWS_API_KEY` - Your NewsAPI key
- `PORT` - Server port (default: 3000)

### Caching

The API uses in-memory caching with a 5-minute TTL to reduce API calls and improve performance.

## 🐛 Troubleshooting

### API Rate Limits

Both Finnhub and NewsAPI have rate limits:
- **Finnhub Free**: 60 calls/minute
- **NewsAPI Free**: 100 requests/day

If you hit rate limits, the cache will help, but consider upgrading your API plans for production use.

### CORS Issues

The server is configured to allow CORS from all origins. For production, update the CORS configuration in `server.js`.

## 📦 Production Deployment

### Environment Setup

1. Set environment variables on your hosting platform
2. Update CORS settings for your frontend domain
3. Consider adding rate limiting middleware
4. Set up monitoring and logging

### Recommended Hosting

- **Heroku**: Easy deployment with `git push`
- **Railway**: Simple Node.js deployment
- **Render**: Free tier available
- **AWS EC2**: Full control and scalability

## 🔒 Security

- Never commit `.env` file to version control
- Use environment variables for all sensitive data
- Consider adding authentication middleware for production
- Implement rate limiting to prevent abuse

## 📝 License

MIT



