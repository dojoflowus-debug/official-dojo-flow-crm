# Map Dark Mode Debug Notes

## Current Status
- The Map.tsx component has dark mode styles defined
- The StudentsSplitScreen passes isDarkMode prop to MapView
- isDarkMode is calculated from theme === 'dark' || theme === 'cinematic'

## Issue
The map styles are not being applied because:
1. When using `mapId` option, Google Maps ignores inline `styles` option
2. The mapId is set to "DEMO_MAP_ID" which conflicts with custom styles

## Solution
Remove the mapId option when using custom styles, OR use a cloud-based map style ID.

## Code Changes Made
1. Map.tsx - Removed mapId option to allow inline styles to work
2. StudentsSplitScreen.tsx - Fixed isDarkMode to include cinematic theme
