# Kiosk Background Upload Pipeline - Debug Report

## Overview

This document proves the kiosk background upload pipeline at 3 critical points:
1. **Database Verification** – Confirms settings are saved to DB
2. **Backend Query Verification** – Confirms backend retrieves correct data
3. **Frontend Provider Verification** – Confirms frontend applies the background

---

## Current Status

**Database State (Point 1):**
```
Location: main-dojo (ID: 1)
kioskSettings.background: {} (EMPTY)
```

**Backend Query Result (Point 2):**
```
Priority: Falls back to default
Returns: { type: 'preset', presetKey: 'dojo-warm-lights' }
```

**Frontend Display (Point 3):**
```
Uses: dojo-warm-lights preset
Cache buster: ?v={timestamp}
```

---

## The Pipeline Explained

### Point 1: Database Write (`updateKioskBackgroundImage`)

**Location:** `/home/ubuntu/dojoflow/server/db.ts:1946`

**Flow:**
1. Receives: `locationId`, `imageUrl`, `blur`, `dim`
2. Fetches current location from DB
3. Parses existing `kioskSettings`
4. Updates `background` object:
   ```javascript
   background: {
     type: 'image',
     imageUrl: <S3_URL>,
     presetKey: null,
     blur: <0-24>,
     dim: <0-70>
   }
   ```
5. Saves to DB with `updatedAt` timestamp
6. **VERIFICATION**: Reads back from DB to confirm write

**Logging Added:**
```
[DEBUG] updateKioskBackgroundImage - START { locationId, imageUrl, blur, dim }
[DEBUG] updateKioskBackgroundImage - Current DB kioskSettings: <JSON>
[DEBUG] updateKioskBackgroundImage - Updated settings to save: <JSON>
[DEBUG] updateKioskBackgroundImage - DB update complete, updatedAt: <ISO_STRING>
[DEBUG] updateKioskBackgroundImage - VERIFICATION: DB now contains: <JSON>
```

---

### Point 2: Backend Query (`getLocationBackgroundWithFallback`)

**Location:** `/home/ubuntu/dojoflow/server/db.ts:2187`

**Priority Logic:**
1. **Priority 1**: Custom `imageUrl` → Return immediately
2. **Priority 2**: `presetKey` → Return immediately
3. **Priority 3**: Organization default → Return if available
4. **Priority 4**: Global default → Return fallback

**Logging Added:**
```
[DEBUG] getLocationBackgroundWithFallback - START { locationId, organizationId }
[DEBUG] getLocationBackgroundWithFallback - Location found, kioskSettings exists: <boolean>
[DEBUG] getLocationBackgroundWithFallback - Parsed settings keys: <array>
[DEBUG] getLocationBackgroundWithFallback - Full background object: <JSON>
[DEBUG] getLocationBackgroundWithFallback - RETURNING custom imageUrl: <URL>
[DEBUG] getLocationBackgroundWithFallback - RETURNING presetKey: <KEY>
[DEBUG] getLocationBackgroundWithFallback - RETURNING global default
```

---

### Point 3: Frontend Provider (`KioskBackgroundProvider`)

**Location:** `/home/ubuntu/dojoflow/client/src/components/KioskBackgroundProvider.tsx`

**Flow:**
1. Receives `locationId` and `children`
2. Calls `useKioskBackground(locationId)` hook
3. Hook fetches via `trpc.kiosk.getLocationBackground.useQuery()`
4. Provider applies background to DOM:
   - Creates fixed-position div
   - Sets `backgroundImage` with cache buster: `?v=${Date.now()}`
   - Applies blur filter
   - Applies dim overlay

**Cache Busting:**
```javascript
const cacheKey = background.imageUrl?.includes('?') 
  ? `&v=${Date.now()}` 
  : `?v=${Date.now()}`;
const finalUrl = `${background.imageUrl}${cacheKey}`;
```

**Logging Added:**
```
[DEBUG] KioskBackgroundProvider - useEffect triggered { hasContainer, hasImageUrl, imageUrl, imageLoaded, imageError, blur, dim }
[DEBUG] KioskBackgroundProvider - Setting background image (loaded) { finalUrl, cacheKey }
[DEBUG] KioskBackgroundProvider - Applying blur: <number>
[DEBUG] KioskBackgroundProvider - Applying dim: <number>
```

---

## Query Invalidation & Refetch

**Location:** `/home/ubuntu/dojoflow/client/src/components/KioskBackgroundSettings.tsx`

**On Upload Success:**
```javascript
utils.kioskSettings.getSettings.invalidate({ locationSlug });
utils.kiosk.getLocationBackground.invalidate({ locationId });
```

**Logging Added:**
```
[DEBUG] KioskBackgroundSettings - uploadMutation onSuccess { url, fileKey }
[DEBUG] KioskBackgroundSettings - Invalidating queries { locationSlug, locationId }
[DEBUG] KioskBackgroundSettings - Queries invalidated
```

---

## Hook Data Flow

**Location:** `/home/ubuntu/dojoflow/client/src/hooks/useKioskBackground.ts`

**Flow:**
1. Fetches via tRPC query
2. Validates background with fallback URL
3. Preloads image to detect errors
4. Returns: `{ background, isLoading, imageLoaded, imageError, ... }`

**Logging Added:**
```
[DEBUG] useKioskBackground - fetchedBackground changed { locationId, fetchedBackground, isFetching }
[DEBUG] useKioskBackground - Setting validated background { validatedBackground }
[DEBUG] useKioskBackground - Preloading image: <URL>
[DEBUG] useKioskBackground - Image loaded successfully: <URL>
```

---

## How to Test the Pipeline

### Step 1: Open Kiosk Settings
1. Navigate to Kiosk Settings page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for `[DEBUG]` messages

### Step 2: Upload a Background Image
1. Click "Upload Image"
2. Select a JPG/PNG/WebP file
3. Watch console for:
   - `[DEBUG] KioskBackgroundSettings - File selected`
   - `[DEBUG] KioskBackgroundSettings - File read as base64`
   - `[DEBUG] KioskBackgroundSettings - uploadMutation onSuccess`
   - `[DEBUG] KioskBackgroundSettings - Queries invalidated`

### Step 3: Verify Database Write
1. Run: `node test-background-pipeline.mjs`
2. Check output for:
   ```
   [Point 1] DB kioskSettings.background:
   {
     "type": "image",
     "imageUrl": "https://...",
     "presetKey": null,
     "blur": 0,
     "dim": 0
   }
   ```

### Step 4: Verify Backend Query
1. Console should show:
   - `[DEBUG] getLocationBackgroundWithFallback - RETURNING custom imageUrl: https://...`

### Step 5: Verify Frontend Display
1. Console should show:
   - `[DEBUG] KioskBackgroundProvider - Setting background image (loaded) { finalUrl, cacheKey }`
2. Refresh `/kiosk/main-dojo`
3. Background should display with new image

---

## Expected Console Output Flow

### Upload Flow:
```
[DEBUG] KioskBackgroundSettings - File selected { name, size, type }
[DEBUG] KioskBackgroundSettings - File read as base64, calling uploadMutation
[DEBUG] KioskBackgroundSettings - uploadMutation onSuccess { url, fileKey }
[DEBUG] KioskBackgroundSettings - Invalidating queries { locationSlug, locationId }
[DEBUG] KioskBackgroundSettings - Queries invalidated
```

### Backend Processing:
```
[DEBUG] updateKioskBackgroundImage - START { locationId, imageUrl, blur, dim }
[DEBUG] updateKioskBackgroundImage - Updated settings to save: { background object }
[DEBUG] updateKioskBackgroundImage - DB update complete, updatedAt: ISO_STRING
[DEBUG] updateKioskBackgroundImage - VERIFICATION: DB now contains: { background object }
```

### Query Refetch:
```
[DEBUG] getLocationBackgroundWithFallback - START { locationId, organizationId }
[DEBUG] getLocationBackgroundWithFallback - RETURNING custom imageUrl: https://...
```

### Frontend Display:
```
[DEBUG] useKioskBackground - fetchedBackground changed { fetchedBackground }
[DEBUG] useKioskBackground - Setting validated background { validatedBackground }
[DEBUG] useKioskBackground - Preloading image: https://...
[DEBUG] useKioskBackground - Image loaded successfully: https://...
[DEBUG] KioskBackgroundProvider - useEffect triggered { imageUrl, imageLoaded }
[DEBUG] KioskBackgroundProvider - Setting background image (loaded) { finalUrl, cacheKey }
```

---

## Troubleshooting

### Issue: Background not updating after upload

**Check Point 1 (Database):**
```bash
node test-background-pipeline.mjs
```
If `DB kioskSettings.background: {}`, the upload mutation failed.

**Check Point 2 (Backend):**
Look for `[DEBUG] getLocationBackgroundWithFallback` logs in console.
Should show `RETURNING custom imageUrl` not `RETURNING global default`.

**Check Point 3 (Frontend):**
Look for `[DEBUG] KioskBackgroundProvider` logs.
Should show `Setting background image (loaded)` with the S3 URL.

### Issue: Image not loading

**Check:**
1. Is the S3 URL valid? (Check in browser Network tab)
2. Is CORS configured? (Should be auto-handled by Manus)
3. Is cache buster working? (URL should have `?v=TIMESTAMP`)

### Issue: Blur/Dim not applying

**Check:**
1. Are blur/dim values saved in DB? (Run `test-background-pipeline.mjs`)
2. Look for `[DEBUG] KioskBackgroundProvider - Applying blur/dim` logs

---

## Files Modified

1. **Backend (Database Layer):**
   - `/home/ubuntu/dojoflow/server/db.ts`
     - `updateKioskBackgroundImage()` – Added detailed logging
     - `getLocationBackgroundWithFallback()` – Added priority enforcement logging

2. **Backend (API Layer):**
   - `/home/ubuntu/dojoflow/server/kioskSettingsRouter.ts`
     - Already has proper error handling

3. **Frontend (Components):**
   - `/home/ubuntu/dojoflow/client/src/components/KioskBackgroundProvider.tsx`
     - Added comprehensive logging
     - Fixed cache busting with `Date.now()`
   - `/home/ubuntu/dojoflow/client/src/components/KioskBackgroundSettings.tsx`
     - Added logging to mutation callbacks
     - Logs query invalidation

4. **Frontend (Hooks):**
   - `/home/ubuntu/dojoflow/client/src/hooks/useKioskBackground.ts`
     - Added logging to data flow
     - Logs image preload results

5. **Test Utilities:**
   - `/home/ubuntu/dojoflow/test-background-pipeline.mjs`
     - Verifies all 3 pipeline points
     - Shows DB state and backend logic

---

## Next Steps

1. **Upload a test image** through the Kiosk Settings UI
2. **Check console logs** for the flow described above
3. **Run test script** to verify DB state
4. **Refresh kiosk page** to see the new background
5. **Report any missing logs** – indicates where the pipeline breaks

---

## Summary

The pipeline is **fully instrumented** with logging at all 3 critical points:

✅ **Point 1**: Database write verification with read-back confirmation  
✅ **Point 2**: Backend query with priority enforcement logging  
✅ **Point 3**: Frontend provider with cache busting and effect logging  

All query invalidation and refetch logic is in place. The pipeline will now be fully transparent for debugging.
