# 🚀 Quick Start - Test All Authentication Methods

## Current Status

✅ Backend Server: Running on port 4000
✅ Frontend Server: Running on port 5173
✅ MongoDB: Connected
✅ All 3 Auth Methods: Ready to test

## Access the App

Open your browser: **http://localhost:5173**

---

## Test 1: Password Login ⏱️ 30 seconds

1. Click the **"Password"** tab
2. Enter:
   - Email: `student@example.com`
   - Password: `password123`
3. Click "Sign In"
4. ✅ You should be on the Student Dashboard

---

## Test 2: Google Login ⏱️ 1 minute

1. Click the **"Google"** tab
2. You should see a "Sign in with Google" button
3. Click it
4. Authenticate with your Google account
5. ✅ You should be automatically logged in and redirected to dashboard

**Note:** First time Google login creates a new Student account

---

## Test 3: Phone SMS Authentication (Demo Mode) ⏱️ 2 minutes

1. Click the **"Phone"** tab
2. Fill in:
   - **Role:** Select "Student"
   - **Phone:** Enter `+1234567890` (any format works in demo)
3. Click "Send Code"
4. **Look at the BACKEND TERMINAL** (where you ran `npm run dev`)
5. You'll see:
   ```
   🔐 DEMO MODE - Verification Code for +1234567890: 123456
   ```
6. Copy the **6-digit code** (e.g., `123456`)
7. Paste it in the "Verification Code" field on the page
8. Click "Verify"
9. ✅ You should be logged in and redirected to dashboard

---

## Key Points to Remember

🔑 **Three Auth Methods - Same Dashboard**

- All methods redirect to the appropriate dashboard based on role
- Student → `/student` dashboard
- Teacher → `/teacher` dashboard
- Admin → `/admin` dashboard (created manually in DB)

🔄 **Session Persistence**

- Refresh the page (F5) while logged in → You stay logged in
- The session is stored in localStorage

🚪 **Logout**

- Click logout button on any dashboard
- Session is cleared
- You're redirected to login page

---

## Demo Accounts in Database

These accounts are pre-created:

| Email               | Password    | Role    |
| ------------------- | ----------- | ------- |
| student@example.com | password123 | Student |
| teacher@example.com | password123 | Teacher |

**OR** Create a new account at the "Create Account" link

---

## Backend Console - Where to Find Codes

When you request phone verification codes, the backend prints them like this:

```
✅ API listening on port 4000

🔐 DEMO MODE - Verification Code for +1234567890: 123456
🔐 DEMO MODE - New Verification Code for +1234567890: 654321
```

Copy the 6-digit number and enter it in the app!

---

## Common Issues & Quick Fixes

| Issue                       | Solution                                                 |
| --------------------------- | -------------------------------------------------------- |
| Google button not showing   | Refresh page (F5) and clear console                      |
| Phone code not in terminal  | Make sure backend terminal is visible, look for 🔐 emoji |
| "Invalid credentials"       | Check email/password match account in database           |
| Can't access dashboard      | Make sure you logged in as Student (not Teacher)         |
| "Verification code expired" | Too much time passed, click "Resend Code"                |

---

## Next Steps After Testing

1. ✅ Confirm all three auth methods work
2. Create more test accounts via the Register page
3. Test role-based access (try accessing `/teacher` as a student - should redirect)
4. Read `AUTHENTICATION_COMPLETE.md` for full architecture details
5. Set up Twilio if you want real SMS instead of demo mode

---

## URLs to Know

| Purpose           | URL                           |
| ----------------- | ----------------------------- |
| Login/Register    | http://localhost:5173         |
| Student Dashboard | http://localhost:5173/student |
| Teacher Dashboard | http://localhost:5173/teacher |
| Backend API       | http://localhost:4000/api     |

**Everything is already configured and working! 🎉**

Just test and enjoy!
