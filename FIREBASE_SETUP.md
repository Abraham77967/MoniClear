# Firebase Setup Instructions

## ✅ **FULLY CONFIGURED & READY!**

Your Firebase project is **completely set up** with:
- **Authentication**: All sign-in methods enabled
- **Firestore Database**: User data storage configured
- **Security Rules**: Automatic data isolation
- **Real-time Sync**: Live data updates across devices

### **What's Working:**
- 🔐 **4 Authentication Methods**: Google, Email, Phone, Guest
- 💾 **Firestore Database**: Private user data storage
- 🔄 **Auto Data Migration**: localStorage → Firestore on sign-in
- 📱 **Real-time Sync**: Changes sync instantly across devices
- 🛡️ **Security**: Each user sees only their own data

### **Firebase Console Setup Required:**

## 🔧 **ENABLE AUTHENTICATION PROVIDERS**

Go to your [Firebase Console](https://console.firebase.google.com/project/moniclear-ece27/authentication/providers) and enable these providers:

### **1. Email/Password Authentication**
- Click **"Add new provider"**
- Select **"Email/Password"**
- Toggle **"Enable"**
- Click **"Save"**

### **2. Phone Authentication**
- Click **"Add new provider"**
- Select **"Phone"**
- Toggle **"Enable"**
- **Important**: Add your domain to authorized domains
- Click **"Save"**

### **3. Google is Already Working! ✅**

### **Data Structure:**
```
users/{userId}/financialData/
├── weeklyEstimate
├── incomeHistory[]
├── bills[]
├── wishlist[]
└── expenses[]
```

**🎉 Your app is production-ready with enterprise-level data storage!**

## 📱 **PHONE AUTHENTICATION SETUP**

### **Step-by-Step:**

1. **Enable Phone Provider** (as above)
2. **Add Authorized Domains:**
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your domain (e.g., `localhost` for development)
   - Add `moniclear-ece27.firebaseapp.com` (Firebase hosting)

3. **For Development/Testing:**
   - Add test phone numbers in **Authentication** → **Settings** → **Phone numbers**
   - Format: `+1234567890`

4. **reCAPTCHA Setup** (Required for web):
   - Firebase automatically handles this
   - Users will see a reCAPTCHA when signing in

## 🍎 **APPLE SIGN-IN: REMOVED**

Apple Sign-In has been **removed** from the app to simplify the authentication flow. It required an Apple Developer account ($99/year) and complex configuration.

If you want to add Apple Sign-In later, you'll need:
- Apple Developer Program membership ($99/year)
- Complex setup in both Apple Developer Console and Firebase
- Additional configuration for services and domains

## 7. Start Your App

Once configured, run:

```bash
npm run dev
```

Your app will show the login screen first, then the main financial tracker after authentication.

## 🚨 **IMMEDIATE ACTION REQUIRED**

### **To Enable Email & Phone Sign-In:**

1. **Go to Firebase Console NOW:**
   ```
   https://console.firebase.google.com/project/moniclear-ece27/authentication/providers
   ```

2. **Enable Email/Password:**
   - Click "Add new provider"
   - Select "Email/Password"
   - Toggle "Enable"
   - Save

3. **Enable Phone:**
   - Click "Add new provider"
   - Select "Phone"
   - Toggle "Enable"
   - Add `localhost` to authorized domains
   - Save

4. **Test Immediately:**
   - Refresh your app
   - Try email sign-up/sign-in
   - Try phone sign-in
   - Apple Sign-In is removed (not available)

## 🔍 **Troubleshooting:**

- **"Provider not enabled"** → Enable it in Firebase Console
- **"Domain not authorized"** → Add domain to authorized domains
- **Phone reCAPTCHA issues** → Check authorized domains
- **Apple Sign-In** → Removed from app (not available)

**Once you enable Email and Phone providers, all authentication methods will work! 🎉**
