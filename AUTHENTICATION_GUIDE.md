# 🔐 Authentication & Account Creation Guide

**Backend:** https://secure-exam-roxt.onrender.com  
**Frontend:** https://secure-exam-theta.vercel.app

---

## 📋 Quick Start

### Option 1: Use Demo Admin Account (Fastest)

```
Email: admincct7v@secureexam.com
Password: admin@123456
Role: admin
```

This account is pre-created in the system.

### Option 2: Create New Account (Register Flow)

---

## 🔄 Authentication Flow

### Step 1️⃣: Create Account (Registration)

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "John Student",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+919876543210",
  "role": "student"
}
```

**Required Fields:**

- `name` - Full name (string)
- `email` - Email address (unique)
- `password` - Minimum 6 characters
- `phone` - Phone number (with country code)
- `role` - Either `"student"` or `"teacher"`

**Response (Success):**

```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Student",
    "email": "john@example.com",
    "role": "student",
    "phone": "+919876543210"
  }
}
```

---

### Step 2️⃣: Login (Password)

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Step 1 - Verify Password):**

```json
{
  "message": "Password verified. Please enter OTP sent to your phone.",
  "mfaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiresMfa": true,
  "otpSentTo": "*876543210",
  "expiresIn": "10 minutes"
}
```

**What Happens:**

- ✅ System checks email and password
- ✅ Generates MFA OTP code
- ✅ Sends OTP to phone via SMS (or console if demo mode)
- ✅ Returns temporary `mfaToken` (not full access yet)
- ⏳ OTP expires in 10 minutes

---

### Step 3️⃣: Verify MFA (OTP)

**Endpoint:** `POST /api/auth/login/verify-mfa`

**Request Body:**

```json
{
  "mfaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "otp": "123456"
}
```

**Response (Success):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Student",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**What Happens:**

- ✅ System verifies OTP code
- ✅ OTP must match what was sent
- ✅ Returns full `token` (access token)
- ✅ Token expires in 7 days
- ✅ Creates login session

---

## 🔑 How to Get OTP for Testing

### Option 1: Demo Mode (Default)

When server is running without Twilio credentials:

```
Server logs show:
🔐 DEMO MODE - Login MFA Code for john@example.com: 123456
```

**Use OTP:** `123456`

### Option 2: Real SMS (With Twilio)

If `TWILIO_ACCOUNT_SID` is set in environment:

- OTP sent to your phone via SMS
- Check your SMS inbox
- Valid for 10 minutes

### Option 3: Test Account

Use pre-created admin account:

```
Email: admincct7v@secureexam.com
Password: admin@123456
OTP: Check console logs during login
```

---

## 🌐 Google OAuth Login

**Endpoint:** `POST /api/auth/google-login`

**Request Body:**

```json
{
  "token": "google-id-token-from-frontend"
}
```

**How to Use:**

1. Frontend handles Google OAuth flow
2. Google returns ID token
3. Send token to backend
4. Account auto-created if new user
5. Returns access token

---

## 📱 Alternative: Phone Verification

### Step 1: Send OTP to Phone

**Endpoint:** `POST /api/auth/phone/send-code`

**Request Body:**

```json
{
  "phone": "+919876543210"
}
```

**Response:**

```json
{
  "message": "Verification code sent",
  "userId": "507f1f77bcf86cd799439011",
  "otpSentTo": "*876543210",
  "expiresIn": "10 minutes"
}
```

### Step 2: Verify Phone OTP

**Endpoint:** `POST /api/auth/phone/verify-code`

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456"
}
```

**Response:**

```json
{
  "message": "Phone verified",
  "verifiedPhoneUserId": "507f1f77bcf86cd799439011"
}
```

### Step 3: Complete Registration

Use the returned `verifiedPhoneUserId` in register endpoint:

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "John Student",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+919876543210",
  "role": "student",
  "verifiedPhoneUserId": "507f1f77bcf86cd799439011"
}
```

---

## 🔐 Using the Access Token

All authenticated requests need the token in header:

**Header:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example: Get Dashboard Data**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://secure-exam-roxt.onrender.com/api/exams
```

---

## 🧪 Testing with cURL

### Create Account

```bash
curl -X POST https://secure-exam-roxt.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+919876543210",
    "role": "student"
  }'
```

### Login Step 1

```bash
curl -X POST https://secure-exam-roxt.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login Step 2 (Verify OTP)

```bash
curl -X POST https://secure-exam-roxt.onrender.com/api/auth/login/verify-mfa \
  -H "Content-Type: application/json" \
  -d '{
    "mfaToken": "COPY_MFA_TOKEN_FROM_STEP_1",
    "otp": "123456"
  }'
```

---

## 📝 Common Issues & Fixes

### Issue: "Required parameter 'to' missing"

**Cause:** User phone number is undefined  
**Fix:** Provide valid phone number during registration  
**Status:** ✅ Fixed in latest deploy

### Issue: "Cannot read properties of undefined"

**Cause:** User phone is null when masking  
**Fix:** System now handles undefined phone gracefully  
**Status:** ✅ Fixed in latest deploy

### Issue: "Email already registered"

**Cause:** Email exists in database  
**Fix:** Use different email or login with existing account

### Issue: "All fields are required"

**Cause:** Missing name, email, password, or phone  
**Fix:** Provide all required fields

### Issue: "Invalid role"

**Cause:** Role is not 'student' or 'teacher'  
**Fix:** Use one of these: `"student"` or `"teacher"`

### Issue: "Password must be at least 6 characters"

**Cause:** Password too short  
**Fix:** Use password with minimum 6 characters

---

## 🎓 User Roles

### Student

- Can take exams
- View results
- Access question bank
- Cannot create exams

### Teacher

- Create exams
- Manage question bank
- Preview exams
- View student results

### Admin

- Full system access
- Manage users
- View audit logs
- System configuration

---

## 🔄 Session Management

### Get Active Sessions

**Endpoint:** `GET /api/auth/sessions`

**Header:**

```
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "sessions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2025-12-09T10:30:00Z",
      "expiresAt": "2025-12-16T10:30:00Z",
      "isActive": true,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### Logout Session

**Endpoint:** `POST /api/auth/sessions/:sessionId/logout`

### Logout All Other Sessions

**Endpoint:** `POST /api/auth/sessions/logout-all-others`

---

## 🔒 Security Features

✅ **MFA (Multi-Factor Authentication)**

- Password + OTP verification required
- OTP valid for 10 minutes
- Rate limited to prevent brute force

✅ **Session Management**

- Each login creates new session
- Sessions expire after 7 days
- Can logout individually or all sessions

✅ **Rate Limiting**

- Register: 3 per hour
- Login: 5 per 15 minutes
- OTP Verify: 10 per 30 minutes
- OTP Send: 5 per 30 minutes

✅ **Phone Verification**

- Optional second factor
- SMS or demo mode
- Auto-verification option

---

## 📊 Complete Login Sequence (Diagram)

```
┌──────────────────────────────────────────────┐
│ 1. User enters email & password              │
│    POST /api/auth/login                      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 2. System verifies password                  │
│    Generates OTP code                        │
│    Sends SMS (or logs to console)            │
│    Returns: mfaToken + otpSentTo            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. User enters OTP from SMS                  │
│    POST /api/auth/login/verify-mfa           │
│    Body: mfaToken + otp                     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 4. System verifies OTP                       │
│    Creates login session                     │
│    Returns: Full access token (7 day exp)   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 5. User logged in! ✅                        │
│    Can access all endpoints                  │
│    Token valid for 7 days                    │
└──────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

| Action            | Endpoint                               | Method | Auth Required |
| ----------------- | -------------------------------------- | ------ | ------------- |
| Register          | `/api/auth/register`                   | POST   | ❌            |
| Login             | `/api/auth/login`                      | POST   | ❌            |
| Verify MFA        | `/api/auth/login/verify-mfa`           | POST   | ❌            |
| Google Login      | `/api/auth/google-login`               | POST   | ❌            |
| Send Phone OTP    | `/api/auth/phone/send-code`            | POST   | ❌            |
| Verify Phone      | `/api/auth/phone/verify-code`          | POST   | ❌            |
| Resend OTP        | `/api/auth/phone/resend-code`          | POST   | ❌            |
| Get Sessions      | `/api/auth/sessions`                   | GET    | ✅            |
| Logout Session    | `/api/auth/sessions/:id/logout`        | POST   | ✅            |
| Logout All Others | `/api/auth/sessions/logout-all-others` | POST   | ✅            |

---

## 📱 Frontend Integration

The frontend should:

1. Show registration form → Call `/api/auth/register`
2. Show login form → Call `/api/auth/login`
3. Show OTP input → Call `/api/auth/login/verify-mfa`
4. Store returned token in localStorage/sessionStorage
5. Include token in all API requests: `Authorization: Bearer TOKEN`

---

**Ready to authenticate!** 🚀

Use demo account or create new one following the flow above.
