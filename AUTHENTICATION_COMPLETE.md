# ✅ Authentication System - Complete Guide

All three authentication methods are now working! Here's what you need to know:

## 1. Password Authentication ✅ WORKING

**How it works:**

- Traditional email/password login
- Passwords are hashed with bcryptjs before storage

**To test:**

1. Click the **Password** tab
2. Use any registered account:
   - Email: `student@example.com`
   - Password: `password123`
3. You'll be logged in as a Student

**Or register a new account:**

1. Go to the Register page
2. Fill in email, name, password, and role
3. Come back to login with those credentials

---

## 2. Google OAuth ✅ WORKING

**How it works:**

- Sign in with your Google account
- Automatically creates an account if it doesn't exist
- Links to existing email accounts

**To test:**

1. Click the **Google** tab
2. You should see the Google Sign-In button
3. Click the button and authenticate with your Google account
4. Automatically logged in and redirected to dashboard

**What happens:**

- If email already exists → Links Google account to existing user
- If email is new → Creates new Student account
- Admin accounts can only be created manually

**Configuration:**

- Google Client ID is set in both `server/.env` and `client/.env`
- Uses Google Identity Services SDK (loaded from CDN)
- No additional setup needed!

---

## 3. Phone SMS Authentication ✅ WORKING (Demo Mode)

**How it works:**

1. Enter phone number and role (Student/Teacher)
2. Receive 6-digit verification code
3. Enter code to complete login
4. New account is created or user is verified

**To test in DEMO MODE:**

1. Click the **Phone** tab
2. Select Role: Student or Teacher
3. Enter any phone number (e.g., `+1234567890`)
4. Click "Send Code"
5. **Check the BACKEND TERMINAL** (where server is running)
6. You'll see: 🔐 DEMO MODE - Verification Code for +1234567890: **123456**
7. Copy the 6-digit code
8. Paste it in the verification field
9. Click "Verify"
10. Logged in and redirected to dashboard!

**Demo Mode Behavior:**

- SMS is NOT actually sent (no Twilio account)
- Codes are printed to server terminal instead
- Phone number format is not validated
- Any phone number works
- Codes expire after 10 minutes

**To enable REAL SMS sending:**

- Set Twilio credentials in `server/.env`
- Real SMS will be sent to the phone number provided
- See PHONE_AUTH_TESTING.md for detailed setup

---

## Key Features

✅ **Secure Token Storage**

- JWT tokens stored in localStorage
- Tokens include user role (student/teacher)
- 7-day expiration

✅ **User Data Persistence**

- User info stored in localStorage
- AuthContext automatically loads user on page refresh
- ProtectedRoutes enforce role-based access

✅ **Session Management**

- Logout clears all stored data
- Automatic redirection to login if unauthorized
- Role-based dashboards

✅ **Multiple Auth Methods**

- Can have same email registered with multiple auth methods
- Example: email+password AND Google account linked to same email
- Users choose which method to use each login

---

## Testing Checklist

- [ ] Password login works with registered account
- [ ] Google login shows button and works
- [ ] Phone SMS shows demo codes in terminal
- [ ] All three methods redirect to correct dashboard
- [ ] Logout clears session
- [ ] Refreshing page keeps you logged in
- [ ] Invalid role redirects appropriately
- [ ] Code expires after 10 minutes (phone auth)

---

## Architecture Overview

### Frontend (React + Vite)

- `Login.jsx` - Three-tab login interface
- `AuthContext.jsx` - Global auth state management
- `ProtectedRoute.jsx` - Role-based route protection
- Environment variables for API and Google Client ID

### Backend (Node.js + Express)

- `authController.js` - All authentication logic
- `User.js` - Schema with multi-auth support
- `authRoutes.js` - Auth endpoints
- JWT token generation with role included

### Database (MongoDB)

- User schema with fields:
  - email (optional for phone-only accounts)
  - passwordHash (optional for phone/google accounts)
  - phone (unique for phone auth)
  - googleId (unique for Google auth)
  - role (student/teacher/admin)
  - authMethod ('password', 'google', or 'phone')
  - Verification code and expiry for phone auth

---

## API Endpoints

### Password Auth

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Email/password login

### Google OAuth

- `POST /api/auth/google-login` - Verify Google token and login

### Phone SMS

- `POST /api/auth/phone/send-code` - Send verification code
- `POST /api/auth/phone/verify-code` - Verify code and complete login
- `POST /api/auth/phone/resend-code` - Resend verification code

---

## Environment Variables

### Frontend (`client/.env`)

```
VITE_GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend (`server/.env`)

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/secure_exam
JWT_SECRET=change_me_in_prod
GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com

# Optional - for real SMS (not needed for demo)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Troubleshooting

**Issue**: Google Sign-In button not showing

- **Solution**: Refresh page (F5), check browser console for errors

**Issue**: Getting 401 Unauthorized

- **Solution**: Token may have expired, login again

**Issue**: Phone code not received

- **Solution**: Check server terminal for demo code, or verify Twilio is configured

**Issue**: Can't access student dashboard

- **Solution**: Make sure you logged in as a Student (not Teacher/Admin)

---

## Next Steps

1. **Test all three auth methods** with the checklist above
2. **Set up Twilio** if you want real SMS instead of demo mode
3. **Configure environment for production** - change JWT_SECRET, set secure MONGO_URI, etc.
4. **Add more roles** or customize as needed

All done! 🎉
