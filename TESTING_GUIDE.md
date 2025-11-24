# Testing Authentication Methods

## Current Status

✅ Backend Server: Running on http://localhost:4000
✅ Frontend: Running on http://localhost:5173
⚠️ Google OAuth: Requires configuration
⚠️ Phone SMS: Requires Twilio credentials

---

## How to Test

### 1. Password-Based Login (✅ Works Now)

This authentication method requires no configuration.

**Steps:**

1. Go to http://localhost:5173/login
2. Click on **Password** tab
3. Use any test email and password:
   - Email: `test@example.com`
   - Password: `password123`
4. Create an account at http://localhost:5173/register first if needed

---

### 2. Google OAuth (⚠️ Requires Setup)

**Prerequisites:**

1. Get a Google Client ID:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials (Web Application)
   - Add `http://localhost:5173` to authorized origins
   - Copy the Client ID

2. Add to `.env` files:

   - **server/.env**: `GOOGLE_CLIENT_ID=your_client_id_here`
   - **client/.env**: `VITE_GOOGLE_CLIENT_ID=your_client_id_here`

3. Restart both servers after adding .env variables

**Testing Steps:**

1. Go to http://localhost:5173/login
2. Click on **Google** tab
3. Click the Google Sign-In button
4. Select your Google account
5. You should be authenticated and redirected to dashboard

---

### 3. Phone SMS Verification (⚠️ Requires Twilio Setup)

**Prerequisites:**

1. Create Twilio Account:

   - Go to [Twilio Console](https://www.twilio.com/console)
   - Sign up for free trial
   - Verify your personal phone number

2. Get Twilio Credentials:

   - Copy Account SID
   - Copy Auth Token
   - Get a Twilio phone number or use sandbox

3. Add to server/.env:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Restart server

**Testing Steps:**

1. Go to http://localhost:5173/login
2. Click on **Phone** tab
3. Enter your phone number (with country code: +1 for USA)
4. Select role (Student or Teacher)
5. Click "Send Code"
6. Check your SMS for the 6-digit code
7. Enter the code and click "Verify"
8. You should be authenticated

---

## Quick Test Checklist

- [ ] Password login works
- [ ] Password registration works
- [ ] Existing results show correctly
- [ ] "View Details" button displays result modal
- [ ] Google login button appears (once configured)
- [ ] Phone tab available for testing

---

## Troubleshooting

### Google Sign-In not showing

**Solution:** Check browser console (F12) for errors. Common issues:

- `VITE_GOOGLE_CLIENT_ID` not set → Set it in client/.env and restart
- CORS error → Add localhost:5173 to Google Cloud authorized origins
- Script not loading → Check if Google API endpoint is reachable

### Phone SMS not sending

**Solution:**

- Verify Twilio credentials are correct
- In Twilio sandbox, only verified numbers can receive SMS
- Check phone number format (+country_code required)
- Check Twilio account has credits

### "Verification code expired"

**Solution:** OTP is valid for 10 minutes. Click "Resend Code" to get a new one.

---

## Testing Credentials

For **password-based testing**, you can use:

- **Student Account**: email: `student@example.com`, password: `password123`
- **Teacher Account**: email: `teacher@example.com`, password: `password123`

Or create new accounts at: http://localhost:5173/register

---

## API Endpoints for Testing

You can test API endpoints using curl or Postman:

```bash
# Password Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Google Login
curl -X POST http://localhost:4000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"token":"google_id_token_here"}'

# Send Phone Code
curl -X POST http://localhost:4000/api/auth/phone/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+12345678900","role":"student"}'

# Verify Phone Code
curl -X POST http://localhost:4000/api/auth/phone/verify-code \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_id_here","verificationCode":"123456"}'
```

---

## Next Steps

1. ✅ Test password-based authentication
2. ⏭️ Set up Google OAuth credentials
3. ⏭️ Test Google login
4. ⏭️ (Optional) Set up Twilio for SMS testing
5. ⏭️ Test phone verification

All three authentication methods are now implemented and ready to use!
