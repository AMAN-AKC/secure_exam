# Authentication Setup Guide

This guide helps you set up Google OAuth and Phone SMS authentication for the Secure Exam System.

## Overview

The system now supports three authentication methods:

1. **Password-based Login** - Traditional email/password authentication
2. **Google OAuth** - Sign in with your Google account
3. **Phone SMS Verification** - Verify via SMS code sent to your phone

---

## 1. Setup Google OAuth

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "Secure Exam System"
3. Enable the "Google+ API" and "OAuth 2.0"

### Step 2: Create OAuth 2.0 Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
2. Choose **Web application**
3. Add authorized JavaScript origins:

   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (if using port 3000)
   - Your production domain

4. Add authorized redirect URIs:

   - `http://localhost:5173/login`
   - Your production login URL

5. Copy your **Client ID**

### Step 3: Add to Environment Variables

Create or update `.env` file in the `server/` directory:

```
GOOGLE_CLIENT_ID=your_copied_client_id_here.apps.googleusercontent.com
```

Create or update `.env` file in the `client/` directory:

```
VITE_GOOGLE_CLIENT_ID=your_copied_client_id_here.apps.googleusercontent.com
```

---

## 2. Setup Twilio Phone SMS

### Step 1: Create Twilio Account

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign up for a free Twilio account
3. Verify your phone number

### Step 2: Get Twilio Credentials

1. Go to **Account Settings**
2. Copy your:

   - **Account SID**
   - **Auth Token**

3. Go to **Phone Numbers** → **Manage** → **Active Numbers**
4. Copy a phone number or get a new one (your "from" number for SMS)

### Step 3: Add to Environment Variables

Update `.env` file in the `server/` directory:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** For development/testing, use Twilio's sandbox. For production, verify your phone numbers.

---

## 3. User Flow

### Password Login

- User enters email and password
- System validates against database
- User is authenticated

### Google Login

- User clicks "Sign in with Google"
- Google OAuth dialog appears
- User authenticates with Google
- System receives Google token and user info
- User is created or linked to existing account

### Phone SMS Verification

1. User selects phone authentication
2. User enters phone number and selects role (Student/Teacher)
3. System sends 6-digit OTP via SMS (valid for 10 minutes)
4. User enters the code to verify
5. User is authenticated

---

## 4. Database Schema Updates

The User model now includes:

- `phone`: Phone number (unique)
- `googleId`: Google account ID (unique)
- `isPhoneVerified`: Boolean flag for phone verification
- `isGoogleAuthenticated`: Boolean flag for Google authentication
- `verificationCode`: OTP code sent via SMS
- `verificationCodeExpiry`: When the OTP expires
- `authMethod`: Primary authentication method used

---

## 5. API Endpoints

### Password Authentication

```
POST /api/auth/register
POST /api/auth/login
```

### Google Authentication

```
POST /api/auth/google-login
Body: { token: "google_id_token" }
```

### Phone Authentication

```
POST /api/auth/phone/send-code
Body: { phone: "+1234567890", role: "student" }

POST /api/auth/phone/verify-code
Body: { userId: "...", verificationCode: "123456" }

POST /api/auth/phone/resend-code
Body: { userId: "..." }
```

---

## 6. Testing

### Test Google Login

1. Go to login page
2. Click "Google" tab
3. Select a Google account
4. Should be redirected to appropriate dashboard

### Test Phone SMS

1. Go to login page
2. Click "Phone" tab
3. Enter phone number (with country code, e.g., +1 for USA)
4. Select role
5. Click "Send Code"
6. Receive SMS with 6-digit code
7. Enter code and verify
8. Should be authenticated

### Test Password Login

1. Use existing email/password
2. Should work as before

---

## 7. Troubleshooting

### Google Login Not Working

- Check that Client ID is correctly set in `.env`
- Verify domain is in authorized origins
- Check browser console for CORS errors
- Make sure Google+ API is enabled

### SMS Not Receiving

- Verify phone number format (+country_code format)
- Check Twilio account has credits/is verified
- In sandbox mode, verify receiving phone number
- Check phone number is not blacklisted

### OTP Expired

- OTP is valid for 10 minutes
- User can click "Resend Code" to get new OTP
- Resend has 60-second cooldown

---

## 8. Production Considerations

1. **Use environment secrets** - Never commit .env files
2. **Enable HTTPS** - Required for Google OAuth in production
3. **Verify Twilio numbers** - For mass SMS sending
4. **Rate limiting** - Implement rate limits on auth endpoints
5. **Session management** - Implement logout and session timeout
6. **Two-factor authentication** - Consider adding 2FA for admins

---

## 9. Security Best Practices

✅ Tokens are securely stored with expiration
✅ OTP codes are time-limited (10 minutes)
✅ Phone numbers are unique per account
✅ Google IDs are securely stored
✅ Passwords are hashed with bcrypt
✅ JWT tokens expire after 7 days

---

Need help? Check the error messages in the browser console or server logs.
