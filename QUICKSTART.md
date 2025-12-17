# 🚀 Quick Start Guide

Get StockScope up and running in 10 minutes!

## Prerequisites

- Node.js (v16+) installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

## Step 1: Get API Keys (5 minutes)

### Finnhub API (Stock Data)
1. Go to [https://finnhub.io/register](https://finnhub.io/register)
2. Sign up (free tier available)
3. Copy your API key

### NewsAPI (Financial News)
1. Go to [https://newsapi.org/register](https://newsapi.org/register)
2. Sign up (free tier available)
3. Copy your API key

### Firebase (Authentication & Database)
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication → Email/Password
4. Enable Firestore Database
5. Go to Project Settings → General
6. Copy your Firebase config

## Step 2: Backend Setup (2 minutes)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
FINNHUB_API_KEY=paste_your_finnhub_key
NEWS_API_KEY=paste_your_newsapi_key
PORT=3000
```

Start the server:
```bash
npm run dev
```

You should see: `🚀 StockScope API server running on port 3000`

## Step 3: Frontend Setup (3 minutes)

Open a new terminal:

```bash
cd frontend
npm install
```

Update Firebase config in `src/utils/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

Start the app:
```bash
npm start
```

## Step 4: Run the App

Choose your platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web
- Scan QR code with Expo Go app on your phone

## 🎉 You're Done!

The app should now be running. Try these features:

1. **Sign Up**: Create an account with email/password
2. **Search**: Search for "AAPL" or "Tesla"
3. **View Details**: Tap on a stock to see details
4. **Add to Watchlist**: Add stocks to your watchlist
5. **Read News**: Check the News tab for latest updates

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify API keys are correct
- Make sure you ran `npm install`

### Frontend won't start
- Clear cache: `expo start -c`
- Check Firebase config
- Ensure backend is running

### API errors
- Verify API keys are correct
- Check if you've exceeded rate limits
- Restart the backend server

### Firebase errors
- Ensure Authentication is enabled
- Check Firestore is enabled
- Verify your config is correct

## 📱 Testing on Real Device

1. Install Expo Go app on your phone
2. Make sure your phone and computer are on the same WiFi
3. Scan the QR code from the terminal
4. The app will load on your device

## 🎨 Customization

### Change App Name
Edit `frontend/app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change Colors
Edit `frontend/src/utils/theme.js`:
```javascript
colors: {
  primary: '#your-color',
  secondary: '#your-color',
  // ...
}
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [backend/README.md](backend/README.md) for API details
- Customize the UI to match your brand
- Deploy to production when ready

## 🆘 Need Help?

- Check the main [README.md](README.md)
- Review the [backend/README.md](backend/README.md)
- Open an issue on GitHub
- Check API documentation:
  - [Finnhub Docs](https://finnhub.io/docs/api)
  - [NewsAPI Docs](https://newsapi.org/docs)

---

Happy coding! 🎉



