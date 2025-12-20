# Kai Student Search Issue - Debug Analysis

## Problem
Kai is not finding students or pulling student cards when asked to search for them.

## Root Causes Found

### 1. Wrong Component Being Used (FIXED)
- **Issue**: `/kai` route was mapped to `KaiDashboard` instead of `KaiCommand`
- **Location**: `client/src/App.tsx` line 135
- **Fix Applied**: Changed route to use `KaiCommand` component
- **Status**: ✅ FIXED

### 2. LLM Not Calling Functions (CURRENT ISSUE)
- **Issue**: The LLM is responding conversationally instead of calling the search functions
- **Symptoms**: 
  - Query "search for all students" → conversational response, no function call
  - Query "find student Emma" → starts response but appears to hang/timeout
- **Expected**: LLM should call `search_students` or `find_student` functions

## What We've Implemented

### Backend Changes
1. **Updated System Prompt** (`server/services/openai.ts`)
   - Added instructions about data query tools
   - Added UI block format examples: `[STUDENT:123:John Smith]`
   - Listed all available functions

2. **Added New Tool Definitions** (`server/services/openai.ts`)
   - `search_students`: Search by name/email/phone
   - `get_student`: Get full details by ID
   - `list_at_risk_students`: Find inactive/on-hold students
   - `list_late_payments`: Find students with overdue payments
   - `search_leads`: Search leads
   - `get_lead`: Get lead details

3. **Implemented Function Handlers** (`server/routers.ts`)
   - Added cases in `executeCRMFunction` for all new tools
   - Each handler queries the database and returns structured data

4. **Updated Response Formatter** (`server/routers.ts`)
   - `formatFunctionResults` now formats responses with UI block markers
   - Example: `I found [STUDENT:42:Sarah Johnson]. She's a blue belt...`

## Current Behavior
- Kai receives the query
- LLM generates a conversational response
- **No function calls are being made**
- No UI blocks are being generated

## Possible Causes

### Theory 1: LLM Not Recognizing Intent
The LLM might not be matching user queries to the available functions. The function descriptions might need to be more explicit.

### Theory 2: Tool Choice Setting
The `tool_choice: 'auto'` setting might be too conservative. The LLM might prefer to respond conversationally rather than call functions.

### Theory 3: System Prompt Conflict
The system prompt might be giving conflicting signals - telling Kai to be conversational while also telling it to use tools.

### Theory 4: Missing Context
The LLM might need more context about when to use functions vs when to respond conversationally.

## Next Steps to Try

1. **Check LLM Logs**: See if function calls are being attempted but failing
2. **Test with `tool_choice: 'required'`**: Force the LLM to call a function
3. **Simplify System Prompt**: Make it more directive about using functions
4. **Add Examples**: Include few-shot examples in the system prompt
5. **Test Backend Directly**: Call `executeCRMFunction` directly to verify handlers work

## Database Status
- ✅ Students exist in database (confirmed via SQL query)
- ✅ 5 students found in test query
- ✅ Database connection working

## Files Modified
- `/home/ubuntu/dojoflow/client/src/App.tsx` - Fixed routing
- `/home/ubuntu/dojoflow/server/services/openai.ts` - Updated system prompt and tools
- `/home/ubuntu/dojoflow/server/routers.ts` - Added function handlers and formatter
