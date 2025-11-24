# Google Sign-In Button Debug Guide

If the Google Sign-In button isn't appearing, follow these steps to diagnose the issue:

## Step 1: Open Browser DevTools

1. Open your browser to `http://localhost:5173`
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab (look for any red error messages)

## Step 2: Navigate to Google Login Tab

1. Click the **Google** tab on the login page
2. Take a screenshot of the Console tab - look for any errors

## Step 3: Check Network Tab

1. Go to the **Network** tab in DevTools
2. Reload the page (F5)
3. Look for a request to `gsi/client` (from accounts.google.com)
4. It should return 200 (success)
5. If it shows 403 or doesn't appear, the script isn't loading

## Step 4: Check if Google API Loaded

1. Go to **Console** tab
2. Type: `window.google`
3. Press Enter
4. It should show an object. If it shows `undefined`, the Google script didn't load

## Step 5: Check Environment Variable

1. In Console, type: `import.meta.env.VITE_GOOGLE_CLIENT_ID`
2. Press Enter
3. It should show your Client ID (starts with numbers, ends with .apps.googleusercontent.com)
4. If it shows `undefined` or 'YOUR_GOOGLE_CLIENT_ID', the env var isn't being read

## Step 6: Manual Button Render Test

If you see errors in the console, try this in the Console:

```javascript
// Check if Google script loaded
if (window.google) {
  console.log("✓ Google API loaded");

  // Try to find the element
  const element = document.getElementById("google-login-btn");
  console.log("Element found:", !!element);

  // Check Client ID
  console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
} else {
  console.log("✗ Google API not loaded");
}
```

## Common Issues & Solutions

### Issue: "Cannot read property 'renderButton' of undefined"

**Cause**: Google script didn't load or callback has wrong reference
**Solution**: Verify Google Client ID in .env file is correct (no typos)

### Issue: "Element not found for renderButton"

**Cause**: Element with id="google-login-btn" doesn't exist or is hidden
**Solution**:

- Check element exists: `document.getElementById('google-login-btn')` in Console should return the div
- Check it's visible: `document.getElementById('google-login-btn').style.display` should not be 'none'

### Issue: Loading message appears but button never renders

**Cause**: Script is loading but renderButton() isn't being called or is failing silently
**Solution**:

- Check browser console for errors
- Verify callback function (handleGoogleLogin) is defined before useEffect runs
- Check that VITE_GOOGLE_CLIENT_ID env var is injected properly

### Issue: Button renders but click does nothing

**Cause**: Callback function reference is broken
**Solution**: This has been fixed in the latest version - handleGoogleLogin is now defined before useEffect

## Files to Check

After making any changes, verify these files are correct:

1. **client/.env** - Should contain:

   ```
   VITE_API_BASE_URL=http://localhost:4000
   VITE_GOOGLE_CLIENT_ID=161166203060-550dhhhntse9roc3rvfkaa3es5566uen.apps.googleusercontent.com
   ```

2. **client/src/pages/Login.jsx** - Should have:
   - `handleGoogleLogin` function defined BEFORE useEffect (line ~33)
   - useEffect that loads Google script and calls renderButton (line ~53)
   - Google dependency: `[handleGoogleLogin]` in useEffect

## Quick Test After Fixes

1. Save all files
2. Check browser auto-reloaded (should see "Live reload" message in Dev Tools)
3. Go to Console, clear it (Ctrl+Shift+K or click X)
4. Click the Google tab
5. Look for these messages in Console:
   - "Google response:" when button works
   - Or error messages if something failed

## Next Steps if Still Not Working

If the button still doesn't appear after checking all the above:

1. Take a screenshot of the Console tab with any error messages
2. Share the output of: `window.google` (in Console)
3. Share the output of: `import.meta.env.VITE_GOOGLE_CLIENT_ID` (in Console)
4. Share the Network tab screenshot showing the gsi/client request

This will help identify the exact issue!
