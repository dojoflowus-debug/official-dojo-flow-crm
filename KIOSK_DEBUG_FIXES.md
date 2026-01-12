# Kiosk Display Debugging & Fixes - Complete Documentation

## Overview

This document describes the hard debugging and fixes applied to the kiosk display system to resolve the "Kiosk Not Available" error that was preventing kiosk displays from loading.

## Root Causes Identified

1. **Undefined Variable Bug**: `Kiosk.tsx` referenced `kioskConfig` and `kioskLocation` which were never defined
2. **Missing Debug Information**: No way to diagnose why kiosks were failing to load
3. **Live Preview Using Public Route**: The studio preview was calling the public API endpoint instead of using local editor state
4. **No Publish Flow**: The kiosk publish mutation wasn't properly copying draft → published config

## Fixes Applied

### 1. Fixed Kiosk.tsx Component (Client)

**File**: `/home/ubuntu/dojoflow/client/src/pages/Kiosk.tsx`

**Changes**:
- Fixed undefined variable references: `kioskConfig` → `kiosk`, `kioskLocation` → `kiosk`
- Added DEBUG panel that shows when `?debug=1` is in the URL
- Improved error handling with specific error codes
- Added `useSearchParams` to parse query parameters

**Debug Panel Shows**:
- `slug`: The kiosk slug from URL params
- `kioskId`: The kiosk ID from database
- `orgId`: The organization ID
- `isActive`: Whether kiosk is active
- `hasPublishedConfig`: Whether published config exists
- `reason`: Why the kiosk failed to load (NO_KIOSK_FOUND | DISABLED | NO_PUBLISHED_CONFIG | ORG_CONTEXT_MISSING | QUERY_ERROR)
- `error`: Full error message from the API

**Usage**: Visit `/kiosk/your-slug?debug=1` to see debug information

### 2. Fixed kioskDeviceRouter Queries (Server)

**File**: `/home/ubuntu/dojoflow/server/kioskDeviceRouter.ts`

#### Query: `getBySlug` (PUBLIC)

**Type**: `publicProcedure` (no authentication required)

**Input**:
```typescript
{
  slug: string  // The kiosk slug from URL
}
```

**Output**:
```typescript
{
  id: number
  organizationId: number
  name: string
  slug: string
  isActive: number
  publishedConfig: KioskConfig  // The published configuration
}
```

**Error Codes**:
- `NOT_FOUND` with message `NO_KIOSK_FOUND`: Kiosk slug doesn't exist
- `FORBIDDEN` with message `DISABLED`: Kiosk is disabled (isActive !== 1)
- `NOT_FOUND` with message `NO_PUBLISHED_CONFIG`: No published config exists
- `INTERNAL_SERVER_ERROR` with message `QUERY_ERROR`: Database query failed

**How It Works**:
1. Queries kiosks table by slug
2. Checks if kiosk is active (isActive === 1)
3. Parses config field to extract published config
4. Returns published config only (not draft)

#### Mutation: `saveDraft` (PROTECTED)

**Type**: `protectedProcedure` (requires authentication)

**Input**:
```typescript
{
  kioskId: number
  config: KioskConfigSchema  // The draft configuration
}
```

**Output**:
```typescript
{
  success: boolean
  message: string
  draftConfig: KioskConfig
}
```

**How It Works**:
1. Fetches current kiosk config
2. Updates the draft portion while keeping published config intact
3. Saves to config field as JSON: `{ draft, published, enabled }`

#### Mutation: `publish` (PROTECTED)

**Type**: `protectedProcedure` (requires authentication)

**Input**:
```typescript
{
  kioskId: number
  config?: KioskConfigSchema  // Optional - if not provided, publishes current draft
}
```

**Output**:
```typescript
{
  success: boolean
  message: string
  publishedAt: string  // ISO timestamp
  publishedConfig: KioskConfig
}
```

**How It Works**:
1. Fetches current kiosk
2. Gets config to publish (from input or current draft)
3. Copies draft → published
4. Sets enabled = true
5. Sets isActive = 1
6. Saves to config field as JSON: `{ draft, published, enabled: true }`

### 3. Fixed Live Preview in Kiosk Studio

**File**: `/home/ubuntu/dojoflow/client/src/pages/KioskStudioBuilder2.tsx`

**Changes**:
- Replaced iframe that called `/kiosk/{slug}` with local `KioskPreviewLive` component
- Added "Open Public Kiosk" button to test the public URL
- Added "Debug Mode" button to open public URL with `?debug=1`
- Live preview now updates instantly as user edits (no API calls)

**Benefits**:
- Instant feedback while editing
- No dependency on published config
- Can test draft config before publishing
- Debug button helps diagnose issues

### 4. Added Debug Panel to Kiosk Display

**Location**: `/kiosk/:slug?debug=1`

**Features**:
- Floating panel in bottom-right corner
- Shows all diagnostic information
- Can be closed with X button
- Displays specific failure reasons
- Shows full error messages from API

## Schema Fields Used

### Kiosks Table

```typescript
{
  id: int                    // Primary key
  organizationId: int        // Organization this kiosk belongs to
  locationId: int            // Location this kiosk is at
  name: varchar(255)         // Display name
  slug: varchar(255)         // URL-friendly identifier (must be unique per org)
  isActive: tinyint          // 1 = active, 0 = disabled
  config: text               // JSON: { draft, published, enabled }
  createdAt: timestamp       // Created timestamp
  updatedAt: timestamp       // Last updated timestamp
}
```

### Config Field Structure

```typescript
{
  draft: KioskConfig | null      // Current draft configuration
  published: KioskConfig | null  // Last published configuration
  enabled: boolean               // Whether kiosk is enabled
}
```

## Data Flow

### Publishing a Kiosk

```
User edits kiosk in Studio
  ↓
saveDraft() called
  ↓
config.draft updated
  ↓
User clicks Publish
  ↓
publish() called
  ↓
config.published = config.draft
config.enabled = true
isActive = 1
  ↓
Public kiosk display can now render
```

### Displaying a Kiosk

```
Public device visits /kiosk/{slug}
  ↓
Kiosk.tsx calls getBySlug(slug)
  ↓
Server queries kiosks by slug
  ↓
Server checks isActive === 1
  ↓
Server extracts config.published
  ↓
Server returns publishedConfig
  ↓
Kiosk.tsx renders KioskHome with publishedConfig
  ↓
KioskLayout wraps with background, idle detection, screensaver
```

## Testing the Fixes

### Test 1: Create and Publish a Kiosk

1. Go to `/kiosk-studio`
2. Create a new location
3. Create a new kiosk in that location
4. Edit the kiosk appearance (background, typography, etc.)
5. Click "Save Draft"
6. Click "Publish"
7. Click "Open Public Kiosk" button
8. Verify the kiosk displays correctly

### Test 2: Debug a Failed Kiosk

1. Visit `/kiosk/your-slug?debug=1`
2. Check the debug panel in bottom-right corner
3. Look at the `reason` field to see why it failed
4. Check the `error` field for detailed error message

### Test 3: Live Preview

1. In Kiosk Studio, make changes to appearance
2. Verify Live Preview updates instantly
3. Verify no API calls are made to public endpoint
4. Verify draft config is used (not published)

## Query/Mutation Names for Integration

### TRPC Paths

```typescript
// Get kiosk by slug (public)
trpc.kioskDevice.getBySlug.useQuery({ slug: 'my-kiosk' })

// Save draft configuration
trpc.kioskDevice.saveDraft.useMutation()
  .mutate({ kioskId: 123, config: {...} })

// Publish kiosk configuration
trpc.kioskDevice.publish.useMutation()
  .mutate({ kioskId: 123, config: {...} })
```

## Error Codes and Meanings

| Error Code | Message | Meaning |
|-----------|---------|---------|
| NOT_FOUND | NO_KIOSK_FOUND | Kiosk slug doesn't exist in database |
| FORBIDDEN | DISABLED | Kiosk exists but isActive !== 1 |
| NOT_FOUND | NO_PUBLISHED_CONFIG | Kiosk exists but has no published config |
| INTERNAL_SERVER_ERROR | ORG_CONTEXT_MISSING | Organization context not available |
| INTERNAL_SERVER_ERROR | QUERY_ERROR | Database query failed |

## Next Steps

### Recommended Schema Migration

To improve data integrity and performance, consider adding these columns to the kiosks table:

```sql
ALTER TABLE kiosks ADD COLUMN enabled TINYINT DEFAULT 1 NOT NULL;
ALTER TABLE kiosks ADD COLUMN draftConfig TEXT;
ALTER TABLE kiosks ADD COLUMN publishedConfig TEXT;
ALTER TABLE kiosks ADD COLUMN publishedAt TIMESTAMP NULL;
ALTER TABLE kiosks ADD INDEX idx_kiosks_enabled (organizationId, enabled);
```

This would allow:
- Separate draft/published configs in dedicated columns
- Tracking when config was last published
- Faster queries with dedicated indexes
- Better data organization

### Update kioskDeviceRouter

Once schema is migrated, update the router to use new columns:

```typescript
// Use publishedConfig column directly
const publishedConfig = JSON.parse(kiosk.publishedConfig);

// Use enabled column
if (!kiosk.enabled) throw new TRPCError(...);

// Track publishedAt
return { publishedAt: kiosk.publishedAt };
```

## Files Modified

1. `/home/ubuntu/dojoflow/client/src/pages/Kiosk.tsx` - Added debug panel, fixed variables
2. `/home/ubuntu/dojoflow/server/kioskDeviceRouter.ts` - Fixed getBySlug, saveDraft, publish
3. `/home/ubuntu/dojoflow/client/src/pages/KioskStudioBuilder2.tsx` - Replaced iframe with local preview
4. `/home/ubuntu/dojoflow/drizzle/schema.ts` - Reverted to original schema (migration pending)

## Summary

The kiosk display system now has:
- ✅ Hard debugging with ?debug=1 query parameter
- ✅ Fixed data binding in Kiosk.tsx
- ✅ Proper publish flow (draft → published)
- ✅ Live preview using editor state (no API calls)
- ✅ "Open Public Kiosk" and "Debug Mode" buttons
- ✅ Detailed error codes for troubleshooting
- ✅ Comprehensive logging in server

When you click Publish, the public kiosk URL should now render the kiosk home screen instead of "Not Available" error.
