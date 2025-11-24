# 📱 Twilio Setup - Real SMS Phone OTP Authentication

## Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email address
4. You'll get a free Twilio account with $15 trial credit

## Step 2: Get Your Credentials

1. After signup, go to https://console.twilio.com
2. On the **Dashboard**, you'll see:
   - **Account SID** (looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** (looks like: `your_auth_token_here`)
3. **IMPORTANT:** Click the eye icon next to Auth Token to reveal it

## Step 3: Get a Twilio Phone Number

1. Go to **Phone Numbers** in the left sidebar
2. Click "Get a number"
3. Select your country
4. Choose a number (Twilio gives you a random one, but you can search for a specific one)
5. Click "Buy" (costs nothing during trial)
6. You'll get a phone number like: `+1234567890`

## Step 4: Update Your .env File

Edit `server/.env` and fill in these values:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Replace with your actual credentials from Twilio dashboard.

## Step 5: Verify Your Personal Phone Number

For testing during trial period, Twilio requires you to verify numbers that will RECEIVE SMS:

1. In Twilio Console, go to **Verified Caller IDs** (or **Phone Numbers** → **Verified Numbers**)
2. Add your personal phone number (the one you'll use to receive test OTPs)
3. You'll get a verification code via SMS
4. Enter it to verify

## Step 6: Restart the Backend

```bash
cd c:\Users\amanc\Desktop\secure_exam\server
npm run dev
```

The backend will automatically use real Twilio credentials when it detects them in `.env`

## Step 7: Test Phone Authentication

1. Open http://localhost:5173
2. Click the **Phone** tab
3. Enter:
   - **Role:** Student or Teacher
   - **Phone:** Your verified phone number (e.g., +1 123 456 7890)
4. Click "Send Code"
5. **Check your phone for a real SMS message** with the 6-digit code
6. Enter the code on the page
7. Click "Verify"
8. ✅ You're logged in with real SMS authentication!

---

## Twilio Trial Limitations & Solutions

### ❌ Problem: "You must add a verified phone number"

**Solution:**

- Go to Twilio Console → Verified Caller IDs
- Add and verify your personal phone number
- Wait for SMS verification code
- Then try again

### ❌ Problem: "Phone number is not a valid E.164 format"

**Solution:**

- Use format: `+1` (country code) + number
- Examples:
  - USA: `+12125550000`
  - UK: `+441632960000`
  - India: `+919876543210`
  - Canada: `+14165552000`

### ❌ Problem: "Insufficient Funds"

**Solution:**

- You have $15 free credit during trial
- Each SMS costs ~$0.0075
- You can send ~2000 test SMS with free credit
- Upgrade to paid if you need more

### ⚠️ Trial Account Restrictions:

- **Can only send SMS to verified numbers** (your phone)
- **Cannot send to random numbers**
- After trial, you can send to any number
- Free trial lasts until you upgrade

---

## Environment File Example

Here's what your `server/.env` should look like:

```dotenv
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/secure_exam
JWT_SECRET=change_me_in_prod
ENCRYPTION_KEY=12345678901234567890123456789012
ENCRYPTION_IV=1234567890123456
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com

# Twilio SMS - Real Credentials
TWILIO_ACCOUNT_SID=ACe1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=your_actual_auth_token_here_1234567890
TWILIO_PHONE_NUMBER=+12025551234
```

---

## How It Works After Setup

### Frontend Flow:

1. User enters phone number and role
2. Clicks "Send Code"
3. Backend receives request

### Backend Flow:

1. Generates random 6-digit OTP
2. Creates/finds user in database
3. **Real Twilio Integration:**
   - If Twilio credentials are configured → Sends real SMS
   - If not configured → Logs code to terminal (demo mode)
4. Returns success to frontend

### User Completes Login:

1. Receives SMS on their phone with 6-digit code
2. Enters code in app
3. Backend verifies code
4. Issues JWT token
5. User logged in! ✅

---

## Testing Checklist

After setting up Twilio:

- [ ] Twilio account created
- [ ] Account SID copied
- [ ] Auth Token revealed and copied
- [ ] Twilio phone number obtained
- [ ] Personal phone number verified in Twilio
- [ ] `server/.env` updated with all credentials
- [ ] Backend restarted (`npm run dev`)
- [ ] Opened http://localhost:5173
- [ ] Clicked Phone tab
- [ ] Entered verified phone number
- [ ] Clicked "Send Code"
- [ ] Received real SMS on phone ✅
- [ ] Entered 6-digit code
- [ ] Clicked "Verify"
- [ ] Successfully logged in ✅

---

## Troubleshooting

### "Failed to send SMS" Error

1. Check credentials in `server/.env` are correct
2. Make sure there are no extra spaces
3. Verify the phone number is in E.164 format (+country code + number)
4. Check that the phone number is verified in Twilio trial account
5. Restart backend server

### SMS Not Arriving

1. Check that you've verified the number in Twilio console
2. Wait 30-60 seconds (SMS can be slow)
3. Check spam/junk folder
4. Try resending the code

### "Invalid Auth Token"

1. Go back to Twilio console
2. Copy the Auth Token again (click eye icon)
3. Make sure you copied the entire token
4. Update `server/.env`
5. Restart backend

---

## Upgrade to Paid (Optional)

Once your trial expires or you want production use:

1. Go to https://www.twilio.com/console/billing/overview
2. Add a payment method
3. Upgrade to paid account
4. No code changes needed - everything keeps working!
5. Can now send SMS to any number worldwide

---

## Cost Estimate

- **Outbound SMS:** ~$0.0075 per message
- **Inbound SMS:** ~$0.0075 per message
- **Phone Number Rental:** ~$1 per month
- **Example:** 1000 OTP logins = ~$7.50

---

## Security Best Practices

✅ **Already Implemented:**

- OTP codes are 6-digit random
- Codes expire after 10 minutes
- Codes are hashed before storage (we should add this)
- Only one code valid at a time per user

**To Improve (Optional):**

- Add rate limiting (max 3 attempts per 15 minutes)
- Add IP-based restrictions
- Log all login attempts
- Send security alerts for new device logins

---

Ready to set up real SMS? Start with **Step 1** above! 🚀
