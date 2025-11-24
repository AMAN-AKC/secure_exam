# Google Login Navigation Fix

## Problem

After successful Google login (POST 200 response), the page stayed on the login screen instead of redirecting to the home page.

## Root Causes Identified and Fixed

### 1. **Missing User Data in Storage**

**Issue**: The Google login was storing only the token in localStorage, but the AuthContext was looking for both token AND user data.

**Fix**: Updated `handleGoogleLogin` to store both:

```javascript
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user)); // Added this line
```

Same fix applied to phone authentication flow.

### 2. **Callback Reference Issue with useEffect Dependency**

**Issue**: The useEffect that loads the Google script had `handleGoogleLogin` in its dependency array, causing the script to reload repeatedly and potentially lose the callback reference.

**Solution**:

- Used `useRef` to store a mutable reference to the callback
- Created a separate useEffect to update the ref when the callback changes
- The script loading useEffect now only runs once (empty dependency array)
- The callback is accessed via `callbackRef.current`

```javascript
const callbackRef = useRef(null);

// Define handleGoogleLogin with useCallback
const handleGoogleLogin = useCallback(
  async (response) => {
    // ... Google login logic with user data storage
  },
  [navigate]
);

// Update ref when callback changes
useEffect(() => {
  callbackRef.current = handleGoogleLogin;
}, [handleGoogleLogin]);

// Load Google Script - only once on mount
useEffect(() => {
  // ... script loading code
  callback: callbackRef.current; // Use ref instead of direct reference
}, []); // Empty dependency array - runs only once
```

## Changes Made

### File: `client/src/pages/Login.jsx`

1. **Import addition**: Added `useCallback` and `useRef` to imports

   ```javascript
   import React, { useState, useEffect, useCallback, useRef } from "react";
   ```

2. **Added ref for callback**:

   ```javascript
   const callbackRef = useRef(null);
   ```

3. **Updated handleGoogleLogin**:

   - Changed from regular function to `useCallback`
   - Added `localStorage.setItem('user', JSON.stringify(data.user))`
   - Dependency array: `[navigate]`

4. **Added callback ref update**:

   ```javascript
   useEffect(() => {
     callbackRef.current = handleGoogleLogin;
   }, [handleGoogleLogin]);
   ```

5. **Updated Google script useEffect**:

   - Removed `[handleGoogleLogin]` dependency
   - Uses `callbackRef.current` instead of direct `handleGoogleLogin`
   - Now only runs once (mount)

6. **Updated phone verification**:
   - Added `localStorage.setItem('user', JSON.stringify(data.user))` to match Google login

## Testing

1. **Test Google Login**:

   ```
   1. Navigate to http://localhost:5173 (or 5174)
   2. Click "Google" tab
   3. Click "Sign in with Google" button
   4. Authenticate with Google account
   5. Should redirect to Student/Teacher/Admin dashboard
   6. Verify localStorage has both 'token' and 'user' keys
   ```

2. **Test Phone Login**:

   ```
   1. Click "Phone" tab
   2. Enter phone number and select role
   3. Enter verification code (check backend logs for code)
   4. Should redirect to dashboard
   ```

3. **Test Password Login**:
   ```
   1. Click "Password" tab
   2. Enter email and password
   3. Should redirect to dashboard
   ```

## Why This Works

1. **AuthContext** checks for user in localStorage on component mount
2. **Google login** now properly stores both token AND user data
3. **Callback ref** prevents the Google script from reloading on state changes
4. **Navigation** happens after both storage operations complete
5. **AuthContext** sees the user data and maintains authentication state

## Environment Setup Required

Make sure `.env` files are properly configured:

**server/.env**:

```
GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com
```

**client/.env**:

```
VITE_GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:4000
```

## Browser Console Output (Success)

After clicking Google sign-in button, you should see:

```
Google response: {credential: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."}
Google login successful: {token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: {_id: "...", email: "...", role: "student"}}
Navigating to: /student
```

Then the page will redirect to the student dashboard.

## If Navigation Still Doesn't Work

Check the browser console (F12):

1. Look for any error messages
2. Run: `localStorage.getItem('token')` - should return JWT token
3. Run: `localStorage.getItem('user')` - should return user object as JSON
4. Check Network tab to confirm redirect request was made
5. Check if there are any CORS or API errors

Common issues:

- Token not in localStorage → Check API response in Network tab
- User not in localStorage → Check this fix was applied
- Redirect not happening → Check browser console for errors
- VITE\_ env variables not loading → Rebuild frontend with `npm run dev`
