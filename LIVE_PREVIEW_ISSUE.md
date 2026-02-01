# Live Preview Issue - Email Templates

## Problem
The live preview panel in the email template editor is not updating when users edit the subject or body HTML. The preview panel shows "Start editing to see live preview" but never updates.

## Investigation Findings

### 1. Component Structure
- File: `/home/ubuntu/dojoflow/client/src/pages/settings/EmailTemplatesSettings.tsx`
- The component has a useEffect hook (lines 87-101) that should trigger preview updates
- The useEffect depends on: `editedSubject`, `editedBodyHtml`, `isEditing`, `selectedTemplate?.templateType`, `showLivePreview`

### 2. Preview Mutation
- The `previewMutation` is defined using `trpc.emailTemplates.preview.useMutation()`
- The mutation is supposed to be called when the user types (with 500ms debounce)
- The mutation should update `renderedPreview` state on success

### 3. Backend Endpoint
- File: `/home/ubuntu/dojoflow/server/emailTemplatesRouter.ts`
- The `preview` endpoint exists and is properly configured (line 400)
- The endpoint is registered in the main router at `/home/ubuntu/dojoflow/server/routers.ts` (line 400)

### 4. Network Monitoring
- Set up network monitoring to intercept preview requests
- **NO preview requests are being made** when editing the template
- This confirms the useEffect is not triggering the mutation

## Root Cause
The useEffect hook is not triggering the preview mutation. Possible reasons:
1. The dependency array might be missing the `previewMutation` function
2. The `showLivePreview` state might be false
3. The `isEditing` state might not be properly set
4. React Query might not be properly initialized

## Attempted Fixes
1. ✅ Added initial preview trigger in `handleEditTemplate` function (lines 117-125)
   - This should trigger preview when the dialog first opens
   - However, this didn't work either, suggesting a deeper issue

## Next Steps
1. Check if `showLivePreview` state is properly initialized (should default to `true`)
2. Verify React Query provider is properly set up in the app
3. Check if the tRPC client is properly configured
4. Add console.log statements to debug the useEffect execution
5. Consider removing the debounce temporarily to see if that's the issue
