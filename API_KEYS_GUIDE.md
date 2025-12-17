# 🔑 API Keys Setup Guide

This guide will help you obtain the necessary API keys for StockScope.

## Required API Keys

StockScope requires API keys from the following services:

1. **Finnhub** - Stock market data
2. **NewsAPI** - Financial news
3. **Firebase** - Authentication and database

---

## 1. Finnhub API Key (Stock Data)

### What is it?
Finnhub provides real-time stock market data including prices, company profiles, and financial news.

### How to get it:

1. **Visit**: [https://finnhub.io/register](https://finnhub.io/register)

2. **Sign Up**:
   - Enter your email
   - Create a password
   - Verify your email

3. **Get Your API Key**:
   - After logging in, go to your dashboard
   - Your API key will be displayed at the top
   - Copy it (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

4. **Free Tier Limits**:
   - ✅ 60 API calls per minute
   - ✅ Real-time stock quotes
   - ✅ Company profiles
   - ✅ Company news
   - ✅ Stock search

5. **Add to Backend**:
   ```bash
   # Edit backend/.env
   FINNHUB_API_KEY=paste_your_key_here
   ```

### API Documentation
- [Finnhub Docs](https://finnhub.io/docs/api)
- [API Endpoints](https://finnhub.io/docs/api)

---

## 2. NewsAPI Key (Financial News)

### What is it?
NewsAPI provides access to financial news from various sources.

### How to get it:

1. **Visit**: [https://newsapi.org/register](https://newsapi.org/register)

2. **Sign Up**:
   - Enter your email
   - Create a password
   - Verify your email

3. **Get Your API Key**:
   - After logging in, go to your dashboard
   - Your API key will be displayed
   - Copy it (it looks like: `1234567890abcdef1234567890abcdef`)

4. **Free Tier Limits**:
   - ✅ 100 requests per day
   - ✅ Top headlines
   - ✅ News by category
   - ⚠️ Development only (not for production)

5. **Add to Backend**:
   ```bash
   # Edit backend/.env
   NEWS_API_KEY=paste_your_key_here
   ```

### API Documentation
- [NewsAPI Docs](https://newsapi.org/docs)
- [Endpoints](https://newsapi.org/docs/endpoints)

---

## 3. Firebase Configuration (Auth & Database)

### What is it?
Firebase provides authentication and cloud database services for storing user data and watchlists.

### How to set it up:

1. **Visit**: [https://console.firebase.google.com](https://console.firebase.google.com)

2. **Create a Project**:
   - Click "Add project"
   - Enter project name: "StockScope" (or your choice)
   - Click "Continue"
   - Disable Google Analytics (optional)
   - Click "Create project"

3. **Enable Authentication**:
   - In the left sidebar, click "Authentication"
   - Click "Get started"
   - Click on "Sign-in method" tab
   - Enable "Email/Password"
   - Click "Save"

4. **Enable Firestore Database**:
   - In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to you)
   - Click "Enable"

5. **Get Your Config**:
   - Click the gear icon ⚙️ next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Register app with nickname: "StockScope Web"
   - Copy the `firebaseConfig` object

6. **Add to Frontend**:
   ```javascript
   // Edit frontend/src/utils/firebase.js
   const firebaseConfig = {
     apiKey: "your_api_key",
     authDomain: "your_project.firebaseapp.com",
     projectId: "your_project_id",
     storageBucket: "your_project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

7. **Set Firestore Rules**:
   - Go to Firestore Database
   - Click on "Rules" tab
   - Replace with:
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
   - Click "Publish"

### Firebase Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Authentication](https://firebase.google.com/docs/auth)
- [Firestore](https://firebase.google.com/docs/firestore)

---

## 📝 Quick Setup Checklist

### Backend Setup
- [ ] Get Finnhub API key
- [ ] Get NewsAPI key
- [ ] Create `backend/.env` file
- [ ] Add FINNHUB_API_KEY to `.env`
- [ ] Add NEWS_API_KEY to `.env`

### Frontend Setup
- [ ] Create Firebase project
- [ ] Enable Email/Password authentication
- [ ] Enable Firestore Database
- [ ] Get Firebase config
- [ ] Update `frontend/src/utils/firebase.js`
- [ ] Set Firestore security rules

---

## 🔒 Security Best Practices

### Do's ✅
- Keep your API keys private
- Use environment variables
- Never commit `.env` files to git
- Rotate keys periodically
- Monitor API usage

### Don'ts ❌
- Don't share API keys publicly
- Don't hardcode keys in your code
- Don't commit keys to version control
- Don't use production keys in development

---

## 🐛 Troubleshooting

### "Invalid API Key" Error

**Finnhub:**
- Verify the key is correct (no extra spaces)
- Check if you've exceeded rate limits
- Ensure the key is from the correct account

**NewsAPI:**
- Verify the key is correct
- Check if you've exceeded daily limits (100/day)
- Ensure you're using the correct endpoint

**Firebase:**
- Verify all config values are correct
- Check if Firebase project is active
- Ensure Authentication is enabled

### Rate Limit Exceeded

**Finnhub (60 calls/minute):**
- Wait 1 minute before retrying
- Implement better caching
- Consider upgrading to paid plan

**NewsAPI (100 calls/day):**
- Wait until next day
- Implement aggressive caching
- Consider upgrading to paid plan

### Firebase Errors

**"Permission denied":**
- Check Firestore security rules
- Verify user is authenticated
- Check if user ID matches resource userId

**"Auth domain not authorized":**
- Add your domain to Firebase authorized domains
- For localhost, it should work automatically

---

## 💰 Pricing (Free Tiers)

### Finnhub
- **Free Tier**: 60 calls/minute
- **Paid Plans**: Starting at $9/month
- **Link**: [https://finnhub.io/pricing](https://finnhub.io/pricing)

### NewsAPI
- **Free Tier**: 100 requests/day (development only)
- **Paid Plans**: Starting at $449/month
- **Link**: [https://newsapi.org/pricing](https://newsapi.org/pricing)

### Firebase
- **Free Tier (Spark)**: 
  - 50K reads/day
  - 20K writes/day
  - 10GB storage
  - Unlimited authentication
- **Paid Plans**: Pay as you go
- **Link**: [https://firebase.google.com/pricing](https://firebase.google.com/pricing)

---

## 🚀 Production Considerations

For production deployment, consider:

1. **Upgrade API Plans**: 
   - Higher rate limits
   - Better reliability
   - Priority support

2. **Implement Caching**:
   - Reduce API calls
   - Improve performance
   - Lower costs

3. **Add Monitoring**:
   - Track API usage
   - Monitor errors
   - Set up alerts

4. **Implement Rate Limiting**:
   - Protect your backend
   - Prevent abuse
   - Fair usage

---

## 📞 Support

### Finnhub Support
- Email: support@finnhub.io
- Docs: [https://finnhub.io/docs](https://finnhub.io/docs)

### NewsAPI Support
- Email: support@newsapi.org
- Docs: [https://newsapi.org/docs](https://newsapi.org/docs)

### Firebase Support
- Docs: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- Community: [https://firebase.google.com/support](https://firebase.google.com/docs)

---

**Need Help?** Check the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)



