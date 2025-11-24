# Google OAuth Setup - Step-by-Step Verification

## ✅ Step 1: Create Google Cloud Project

- [ ] Go to https://console.cloud.google.com/
- [ ] Click project selector (top-left dropdown)
- [ ] Click "NEW PROJECT"
- [ ] Enter name: "Secure Exam System" (or any name)
- [ ] Click "CREATE"
- [ ] Wait for project to be created (takes ~1 minute)
- [ ] Select the new project

---

## ✅ Step 2: Configure OAuth Consent Screen

- [ ] In left menu → **APIs & Services** → **OAuth consent screen**
- [ ] Choose **External** (for testing/development)
- [ ] Click **CREATE**
- [ ] Fill in required fields:
  - **App name**: "Secure Exam System"
  - **User support email**: (your email)
  - **Developer contact email**: (your email)
  - **Authorized domains**: Leave blank for localhost development
- [ ] Click **SAVE AND CONTINUE**
- [ ] Click **ADD OR REMOVE SCOPES** → Search for **email**, **profile**, **openid** → Select them
- [ ] Click **SAVE AND CONTINUE**
- [ ] Review and click **BACK TO DASHBOARD**

---

## ✅ Step 3: Create OAuth 2.0 Credentials (Client ID)

- [ ] In left menu → **APIs & Services** → **Credentials**
- [ ] Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- [ ] If prompted: Enable Google+ API → Click **ENABLE** (or skip, it's not required)
- [ ] Choose **Web application**
- [ ] Give it a name: "Secure Exam - Vite Dev"
- [ ] Under **Authorized JavaScript origins** → Click **+ ADD URI**
  - Add: `http://localhost:5173`
  - Add: `http://localhost:3000` (optional, if you use port 3000)
- [ ] Under **Authorized redirect URIs** → Click **+ ADD URI**
  - Add: `http://localhost:5173/login` (where your login page is)
- [ ] Click **CREATE**
- [ ] Copy your **Client ID** (you'll need this)

---

## ✅ Step 4: Add to Environment Files

### server/.env

```env
GOOGLE_CLIENT_ID=YOUR_COPIED_CLIENT_ID_HERE.apps.googleusercontent.com
```

### client/.env

```env
VITE_GOOGLE_CLIENT_ID=YOUR_COPIED_CLIENT_ID_HERE.apps.googleusercontent.com
```

Replace `YOUR_COPIED_CLIENT_ID_HERE` with your actual Client ID from Google Console.

---

## ✅ Step 5: Restart Servers

```bash
# Kill both servers (Ctrl+C in each terminal)

# Terminal 1 - Backend
cd c:\Users\amanc\Desktop\secure_exam\server
npm run dev

# Terminal 2 - Frontend
cd c:\Users\amanc\Desktop\secure_exam\client
npm run dev
```

---

## ✅ Step 6: Test Google Login

1. Go to http://localhost:5173/login
2. Click on **Google** tab
3. You should see "Google Sign-In" button load
4. Click it and sign in with your Google account
5. You should be redirected to dashboard

---

## ⚠️ Common Issues & Fixes

| Issue                                        | Solution                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| **Google button not appearing**              | Check .env files have correct Client ID, restart servers                |
| **"Invalid origin" error**                   | Make sure `http://localhost:5173` is in "Authorized JavaScript origins" |
| **"Redirect URI mismatch"**                  | Add `http://localhost:5173/login` to "Authorized redirect URIs"         |
| **Still seeing "Loading Google Sign-In..."** | Open DevTools (F12) → Console tab → check for errors                    |

---

## 📝 Current Status

**Your Environment Files:**

### server/.env (current)

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/secure_exam
JWT_SECRET=change_me_in_prod
ENCRYPTION_KEY=12345678901234567890123456789012
ENCRYPTION_IV=1234567890123456
NODE_ENV=development
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1234567890
```

### client/.env (current)

```
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## ✅ Ready to Go?

Once you have your Client ID from Google Console:

1. Update both `.env` files
2. Restart servers
3. Test at http://localhost:5173/login

**Need help? Check browser console (F12 → Console tab) for specific error messages.**
