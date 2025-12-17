# StockScope Project Structure

## 📁 Directory Tree

```
StockScope/
│
├── 📱 frontend/                          # React Native + Expo App
│   ├── src/
│   │   ├── screens/                     # All app screens
│   │   │   ├── LoginScreen.js          # Authentication screen
│   │   │   ├── HomeScreen.js           # Dashboard with market overview
│   │   │   ├── SearchScreen.js         # Stock search functionality
│   │   │   ├── StockDetailScreen.js    # Detailed stock information
│   │   │   ├── NewsScreen.js           # Financial news feed
│   │   │   └── ProfileScreen.js        # User profile & settings
│   │   │
│   │   ├── navigation/                  # Navigation setup
│   │   │   └── MainNavigator.js        # Tab & stack navigation
│   │   │
│   │   ├── context/                     # React Context providers
│   │   │   ├── AuthContext.js          # Authentication state
│   │   │   └── WatchlistContext.js     # Watchlist state management
│   │   │
│   │   └── utils/                       # Utility functions
│   │       ├── api.js                  # API client functions
│   │       ├── theme.js                # App theme configuration
│   │       └── firebase.js             # Firebase initialization
│   │
│   ├── assets/                          # Images, fonts, etc.
│   ├── App.js                          # Main app entry point
│   ├── app.json                        # Expo configuration
│   ├── babel.config.js                 # Babel configuration
│   ├── package.json                    # Dependencies
│   └── .gitignore                      # Git ignore rules
│
├── 🔧 backend/                          # Node.js + Express API
│   ├── server.js                       # Main server file
│   ├── package.json                    # Dependencies
│   ├── .env.example                    # Environment variables template
│   └── .gitignore                      # Git ignore rules
│
├── 📄 Documentation
│   ├── README.md                       # Main documentation
│   ├── QUICKSTART.md                   # Quick start guide
│   └── PROJECT_STRUCTURE.md            # This file
│
└── .gitignore                          # Root git ignore
```

## 🗂️ File Descriptions

### Frontend Files

#### Core App Files
- **App.js**: Main entry point, sets up providers and navigation
- **app.json**: Expo configuration (app name, icons, splash screen)
- **babel.config.js**: Babel presets and plugins

#### Screens
- **LoginScreen.js**: Email/password authentication UI
- **HomeScreen.js**: 
  - Market overview (S&P 500, NASDAQ)
  - Top gainers/losers
  - Watchlist summary
- **SearchScreen.js**: 
  - Live stock search
  - Search results with prices
- **StockDetailScreen.js**: 
  - Stock price and change
  - Key statistics (market cap, volume, 52-week range)
  - Related news
  - Add/remove from watchlist
- **NewsScreen.js**: 
  - Latest financial news
  - Pull-to-refresh
- **ProfileScreen.js**: 
  - User information
  - Sign out functionality

#### Navigation
- **MainNavigator.js**: 
  - Bottom tab navigation (Home, Search, News, Profile)
  - Stack navigation for modals/details
  - Auth-based routing

#### Context (State Management)
- **AuthContext.js**: 
  - User authentication state
  - Sign in/up/out functions
  - Auth state listener
- **WatchlistContext.js**: 
  - Watchlist state
  - Add/remove from watchlist
  - Firestore integration

#### Utilities
- **api.js**: 
  - API client functions
  - Stock API calls
  - News API calls
- **theme.js**: 
  - Light/dark theme configuration
  - Material Design 3 colors
- **firebase.js**: 
  - Firebase initialization
  - Auth and Firestore exports

### Backend Files

#### Server
- **server.js**: 
  - Express server setup
  - API routes
  - Caching middleware
  - Error handling

#### API Routes

**Stock Endpoints:**
- `GET /api/stock/search?q={query}` - Search stocks
- `GET /api/stock/:symbol` - Get stock details
- `GET /api/market/overview` - Market indices
- `GET /api/market/gainers` - Top gainers
- `GET /api/market/losers` - Top losers

**News Endpoints:**
- `GET /api/news` - General financial news
- `GET /api/news/:symbol` - Stock-specific news

## 🔄 Data Flow

### Authentication Flow
```
User Input → LoginScreen → AuthContext → Firebase Auth
                                      ↓
                              Auth State Change
                                      ↓
                              MainNavigator → Show App
```

### Stock Search Flow
```
User Types → SearchScreen → Debounce (500ms) → API Call
                                              ↓
                                    stockAPI.searchStocks()
                                              ↓
                                    Backend → Finnhub API
                                              ↓
                                    Results → Display
```

### Watchlist Flow
```
User Taps "Add" → StockDetailScreen → WatchlistContext
                                            ↓
                                    Firestore (Add Document)
                                            ↓
                                    Update Local State
                                            ↓
                                    Refresh UI
```

### Market Data Flow
```
App Launch → HomeScreen → useEffect → API Calls
                                          ↓
                            [Market Overview, Gainers, Losers]
                                          ↓
                                    Display Cards
```

## 🔌 API Integration

### External APIs Used

1. **Finnhub API** (Stock Data)
   - Stock quotes
   - Company profiles
   - Company news
   - Search functionality

2. **NewsAPI** (Financial News)
   - Top business headlines
   - News by category

3. **Firebase** (Backend Services)
   - Authentication
   - Firestore (watchlist storage)

### API Rate Limits

- **Finnhub Free**: 60 calls/minute
- **NewsAPI Free**: 100 requests/day

**Caching Strategy**: Backend uses 5-minute cache to minimize API calls

## 🎨 UI/UX Components

### Design System
- **Framework**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation (Tabs + Stack)
- **Styling**: StyleSheet (React Native)
- **Icons**: Material Community Icons

### Theme
- Light mode (default)
- Dark mode support (via theme.js)
- Custom colors for primary, secondary, error, success

### Key UI Patterns
- **Cards**: Stock cards, news cards, stat cards
- **Chips**: Change indicators (green/red)
- **Searchbar**: Live search with debouncing
- **Pull-to-refresh**: News and home screens
- **Bottom Tabs**: Main navigation
- **Stack Navigation**: Detail screens

## 🔒 Security

### Frontend
- Firebase Authentication (email/password)
- Secure token storage (Firebase handles)
- API calls from authenticated users only

### Backend
- Environment variables for API keys
- CORS configuration
- Input validation
- Error handling

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchlists/{watchlistId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🚀 Deployment Checklist

### Backend
- [ ] Set environment variables
- [ ] Configure CORS for production domain
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Test all endpoints

### Frontend
- [ ] Update API_BASE_URL for production
- [ ] Configure Firebase for production
- [ ] Update app.json with production settings
- [ ] Generate app icons and splash screens
- [ ] Test on iOS and Android
- [ ] Build production bundles

## 📊 Performance Optimizations

1. **Caching**: 5-minute cache on backend
2. **Debouncing**: 500ms on search input
3. **Lazy Loading**: Screens load on demand
4. **Image Optimization**: Expo handles asset optimization
5. **Code Splitting**: React Native handles automatically

## 🧪 Testing Strategy

### Manual Testing
- Test all screens
- Test navigation flows
- Test API integrations
- Test authentication
- Test watchlist functionality

### Future Enhancements
- Unit tests (Jest)
- Integration tests
- E2E tests (Detox)
- Performance monitoring
- Error tracking (Sentry)

---

This structure is designed for scalability and maintainability. Each component has a single responsibility, and the app follows React Native best practices.



