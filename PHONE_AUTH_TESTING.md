# Phone Authentication - Demo Mode Testing Guide

## How to Test Phone Authentication

Since Twilio credentials are not configured in demo mode, the verification codes are logged to the server terminal instead of being sent via SMS.

### Step-by-Step Testing:

1. **Open the application** at `http://localhost:5173`

2. **Click the "Phone" tab** on the login page

3. **You should see a blue info box** that says:

   ```
   🔐 Demo Mode: Verification codes will appear in the browser console.
   Check the developer console (F12) after requesting a code.
   ```

4. **Fill in the form:**

   - Role: Select "Student" or "Teacher"
   - Phone Number: Enter any phone number (e.g., `+1234567890` or `+919876543210`)
     - Format doesn't matter in demo mode, but include the + and country code

5. **Click "Send Code"**

   - The frontend will show a console message: "✅ Verification code sent! Check the server console (terminal) for the code."

6. **Check the terminal running the backend server**

   - You should see a message like:

   ```
   🔐 DEMO MODE - Verification Code for +1234567890: 123456
   ```

   - Copy this 6-digit code

7. **Enter the code** in the verification field (it will appear after step 5)

   - The code is valid for 10 minutes

8. **Click "Verify"**
   - If the code is correct, you'll be logged in and redirected to your dashboard

## Resending the Code

If you don't see the code in the terminal:

1. Click "Resend Code" button
2. Check the terminal again for the new code
3. There's a 60-second cooldown between resend attempts

## Demo Mode Behavior

- **No SMS is sent** - Instead, codes are printed to the server terminal
- **Any phone number format** works (we don't validate format in demo)
- **Codes expire after 10 minutes**
- **6-digit codes** are randomly generated each time

## Setting Up Real Twilio Integration (Optional)

To enable real SMS sending instead of demo mode:

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Twilio credentials:

   - Account SID
   - Auth Token
   - Twilio Phone Number (the number SMS will be sent from)

3. Update `server/.env`:

   ```
   TWILIO_ACCOUNT_SID=your_actual_account_sid
   TWILIO_AUTH_TOKEN=your_actual_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. Restart the backend server

5. Real SMS will now be sent to phone numbers

## Troubleshooting

### "Verification code required" error

- Make sure you've entered exactly 6 digits
- The input only accepts numbers

### "Verification code expired"

- The code is only valid for 10 minutes
- Click "Resend Code" to get a new one

### Code not appearing in terminal

- Make sure the backend server terminal is visible
- Look for the message with 🔐 emoji
- Check that the phone number format includes the + sign

### "User not found" error

- This shouldn't happen in demo mode
- If it does, refresh the page and try again
