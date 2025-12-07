// TIMEZONE FIX GUIDE

## Problem:

Times stored in database are in UTC, but:

- Client displays times in local browser timezone
- Registration times use dayjs (which respects local timezone)
- Server comparisons mix UTC and local times
- Render server timezone ≠ user timezone

## Solution: Always use UTC for storage, convert on display only

### Key Changes:

1. **Server-side**: All dates stored/compared in UTC
2. **Client-side**: Convert UTC to local for display
3. **API responses**: Always send UTC with timezone info
4. **Comparisons**: Compare UTC times consistently

## Implementation Steps:

### 1. Update studentController.js

- Change all `dayjs(exam.availableFrom)` to compare UTC properly
- Use `.utc()` for consistent comparisons
- Store all times as UTC ISO strings

### 2. Update Registration model

- Ensure startTime/endTime are UTC
- Add timezone field for client reference

### 3. Update Client-side

- Parse UTC times from API
- Convert to local time for display
- Send UTC times back to server

### 4. Testing

- Test registration across different timezones
- Verify exam availability windows work globally
- Check result release timing

## Quick Fix - Add UTC Middleware:

```javascript
// Add to server.js before routes
app.use((req, res, next) => {
  // Ensure server always uses UTC
  process.env.TZ = "UTC";
  next();
});
```

## Client Fix - Parse Timezone-Aware:

```javascript
// When displaying times, use:
const formatExamTime = (utcTime) => {
  return new Date(utcTime).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};
```

## What's causing the issue in current code:

1. Line 79 of studentController.js:

   ```javascript
   const now = dayjs(); // Uses LOCAL timezone
   // Should be:
   const now = dayjs.utc(); // Uses UTC always
   ```

2. Line 105 of studentController.js:

   ```javascript
   startTime = now.add(1, "hour"); // Adds to local time
   // Should be:
   startTime = now.utc().add(1, "hour"); // Adds to UTC
   ```

3. Results timing (line 362):
   ```javascript
   if (now >= new Date(exam.examEndTime)) // Mixed UTC/local
   // Should be:
   if (Date.now() >= new Date(exam.examEndTime).getTime()) // Both UTC
   ```

## Files to update:

1. ✅ server/src/controllers/studentController.js - Change all dayjs() to dayjs.utc()
2. ✅ server/src/routes/debugRoutes.js - Use UTC for comparisons
3. ✅ server/src/config/seed.js - Store times as UTC
4. ✅ Client side - Parse and display times correctly
