# Student Edit Debug Notes

## Issue
User reports that Program, Belt Rank, Membership, and Status fields cannot be edited in the student card.

## Backend API Analysis
The `students.update` procedure in `server/routers.ts` (lines 1221-1303) accepts these fields:
- `program` (z.string().optional().nullable())
- `beltRank` (z.string().optional().nullable())
- `membershipStatus` (z.string().optional().nullable())
- `status` (z.string().optional())

## Frontend Analysis
The `StudentModal.tsx` component:
- Uses `handleFieldChange` to update form state
- Sends `updateData` with: `program`, `membershipStatus`, `beltRank`, `status`
- The mutation is called correctly

## Potential Issues
1. The form state initialization might not be setting the correct values
2. The Select components might not be triggering onValueChange correctly
3. The cleanedData filtering might be removing values

## Next Steps
1. Check if formData is being populated correctly from student data
2. Verify the Select components are working
3. Add console logging to debug the save flow
