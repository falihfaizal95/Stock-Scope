# StockScope 📈

A modern, cross-platform stock analyzer and researcher app built with React Native and Node.js.

## 🚀 Features

- **Real-Time Stock Data**: Get live prices, charts, and market data
- **Smart Search**: Search stocks by ticker symbol or company name
- **Personal Watchlist**: Track your favorite stocks
- **Market Overview**: View top gainers, losers, and market indices
- **News Feed**: Stay updated with the latest financial news
- **Authentication**: Secure login with Firebase Auth
- **Cross-Platform**: iOS, Android, and Web support via Expo

## 📱 Tech Stack

### Frontend
- React Native + Expo
- React Navigation (Bottom Tabs + Stack)
- React Native Paper (UI Components)
- Firebase (Authentication + Firestore)
- Axios (API Calls)

### Backend
- Node.js + Express
- Finnhub API (Stock Data)
- NewsAPI (Financial News)
- Node-Cache (Caching)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Get API keys:
   - **Finnhub**: Sign up at [https://finnhub.io/register](https://finnhub.io/register) (Free tier available)
   - **NewsAPI**: Sign up at [https://newsapi.org/register](https://newsapi.org/register) (Free tier available)

5. Update `.env` with your API keys:
```env
FINNHUB_API_KEY=your_finnhub_api_key_here
NEWS_API_KEY=your_newsapi_key_here
PORT=3000
```

6. Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy your Firebase config
   - Update `src/utils/firebase.js` with your config

4. Update API base URL (if different):
   - Edit `src/utils/api.js` and change `API_BASE_URL` if needed

5. Start the Expo development server:
```bash
npm start
```

6. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web
   - Scan QR code with Expo Go app on your phone

## 🏗️ Project Structure

```
StockScope/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── navigation/      # Navigation setup
│   │   ├── context/         # React Context (Auth, Watchlist)
│   │   └── utils/           # Utilities (API, theme, firebase)
│   ├── App.js
│   └── package.json
├── backend/                  # Node.js API server
│   ├── server.js            # Main server file
│   ├── package.json
│   └── .env.example
└── README.md
```

## 📱 Screens

1. **Login Screen**: Email/password authentication
2. **Home Screen**: Market overview, top gainers/losers, watchlist summary
3. **Search Screen**: Search stocks with live results
4. **Stock Detail Screen**: Detailed stock information with news
5. **News Screen**: Latest financial news
6. **Profile Screen**: User information and settings

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication → Email/Password
3. Enable Firestore Database
4. Add Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchlists/{watchlistId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

5. Copy your Firebase config to `frontend/src/utils/firebase.js`

### API Configuration

The app uses two external APIs:

1. **Finnhub API** (Stock Data)
   - Free tier: 60 calls/minute
   - Used for: Stock quotes, company profiles, news

2. **NewsAPI** (Financial News)
   - Free tier: 100 requests/day
   - Used for: General market news

## 🚀 Deployment

### Backend Deployment

Deploy to platforms like:
- Heroku
- Railway
- Render
- AWS EC2

Update the `API_BASE_URL` in `frontend/src/utils/api.js` to point to your deployed backend.

### Frontend Deployment

Build for production:

```bash
# iOS
expo build:ios

# Android
expo build:android

# Web
expo build:web
```

## 🐛 Troubleshooting

### Backend Issues
- Ensure API keys are correctly set in `.env`
- Check if the server is running on port 3000
- Verify API rate limits haven't been exceeded

### Frontend Issues
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Firebase configuration
- Ensure backend is running and accessible

## 📝 API Endpoints

### Stock Endpoints
- `GET /api/stock/search?q={query}` - Search stocks
- `GET /api/stock/:symbol` - Get stock details
- `GET /api/market/overview` - Market overview
- `GET /api/market/gainers` - Top gainers
- `GET /api/market/losers` - Top losers

### News Endpoints
- `GET /api/news` - General news
- `GET /api/news/:symbol` - Stock-specific news

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Finnhub](https://finnhub.io) for stock data API
- [NewsAPI](https://newsapi.org) for news API
- [Expo](https://expo.dev) for cross-platform development
- [React Native Paper](https://callstack.github.io/react-native-paper/) for UI components

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React Native and Node.js



