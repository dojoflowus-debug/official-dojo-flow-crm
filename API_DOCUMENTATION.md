# DojoFlow Kiosk - API Documentation

## Overview
This document provides comprehensive documentation for accessing the DojoFlow CRM data through working API endpoints. While the frontend dashboard has rendering issues, all backend APIs are fully functional and return correct data.

---

## Working API Endpoints

### Dashboard Stats
**Endpoint:** `GET /api/trpc/dashboard.stats`

**Response:**
```json
{
  "result": {
    "data": {
      "studentCount": 24,
      "revenue": 12500,
      "leadCount": 15,
      "classes": [
        {
          "id": 1,
          "name": "Little Dragons (Ages 4-6)",
          "time": "09:00 AM",
          "instructor": "Sensei Mike"
        },
        // ... 9 more classes
      ]
    }
  }
}
```

**Test Command:**
```bash
curl -s 'http://localhost:3000/api/trpc/dashboard.stats' | jq
```

---

### Kiosk Check-Ins
**Endpoint:** `GET /api/trpc/kiosk.checkIns`

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "studentId": 5,
        "timestamp": "2025-11-12T14:30:00.000Z"
      },
      // ... 17 more check-ins
    ]
  }
}
```

**Test Command:**
```bash
curl -s 'http://localhost:3000/api/trpc/kiosk.checkIns' | jq
```

---

### Kiosk Visitors
**Endpoint:** `GET /api/trpc/kiosk.visitors`

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "name": "John Visitor",
        "timestamp": "2025-11-12T10:00:00.000Z"
      },
      // ... 7 more visitors
    ]
  }
}
```

**Test Command:**
```bash
curl -s 'http://localhost:3000/api/trpc/kiosk.visitors' | jq
```

---

### Kiosk Waivers
**Endpoint:** `GET /api/trpc/kiosk.waivers`

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "name": "Sarah Waiver",
        "timestamp": "2025-11-12T11:00:00.000Z"
      },
      // ... 11 more waivers
    ]
  }
}
```

**Test Command:**
```bash
curl -s 'http://localhost:3000/api/trpc/kiosk.waivers' | jq
```

---

## Database Direct Access

### Check Students Count
```bash
cd /home/ubuntu/dojoflow-kiosk
npx tsx -e "import { db } from './server/db'; import { students } from './drizzle/schema'; (async () => { const result = await db.select().from(students); console.log('Total students:', result.length); process.exit(0); })()"
```

### Check Leads Count
```bash
cd /home/ubuntu/dojoflow-kiosk
npx tsx -e "import { db } from './server/db'; import { leads } from './drizzle/schema'; (async () => { const result = await db.select().from(leads); console.log('Total leads:', result.length); process.exit(0); })()"
```

### View All Students
```bash
cd /home/ubuntu/dojoflow-kiosk
npx tsx -e "import { db } from './server/db'; import { students } from './drizzle/schema'; (async () => { const result = await db.select().from(students); console.log(JSON.stringify(result, null, 2)); process.exit(0); })()"
```

---

## Re-seeding Database

To refresh the database with today's data, run:

```bash
cd /home/ubuntu/dojoflow-kiosk
npx tsx server/seed.ts
```

This will create:
- 30 students with realistic profiles
- 10 classes with schedules
- 18 check-ins for today
- 15 leads across pipeline stages
- 8 new visitors
- 12 waiver signatures

---

## Working Pages

### Kai AI Dashboard
**URL:** https://3000-irsc894q9xht7gijx14lw-a8283e50.manusvm.computer/kai-dashboard

**Features:**
- Voice and text input for AI queries
- OpenAI GPT-4 powered conversational AI
- PlasmaKai visual interface
- Navigation menu to all sections

**Example Queries:**
- "How many students do we have?"
- "Find Emma Smith"
- "What's our monthly revenue?"
- "Show me today's class schedule"

---

## Known Issues

### Dashboard Display Problem
**Issue:** CRMDashboard and DataDashboard components crash with React rendering errors

**Symptoms:**
- Blank white screen at `/dashboard` and `/crm-dashboard`
- Console error: "An error occurred in the <a> component"
- tRPC queries not returning data to React components

**Workaround:**
- Use Kai AI Dashboard for interface interactions
- Access data directly via API endpoints (documented above)
- Query database directly using tsx scripts

**Root Cause:**
React component tree has rendering errors that prevent dashboard components from loading. The issue is not with the backend or tRPC server, but with the frontend React component architecture.

---

## Development Commands

### Start Dev Server
```bash
cd /home/ubuntu/dojoflow-kiosk
# Server starts automatically, or restart with:
pnpm dev
```

### Run Database Migrations
```bash
cd /home/ubuntu/dojoflow-kiosk
pnpm db:push
```

### Check Server Logs
```bash
tail -f /home/ubuntu/dojoflow-kiosk/server.log
```

---

## Data Summary

**Current Database State:**
- **Students:** 30 total, 24 active
- **Leads:** 15 across various pipeline stages
- **Classes:** 10 scheduled classes
- **Check-ins Today:** 18
- **Visitors Today:** 8
- **Waivers Today:** 12
- **Monthly Revenue:** $12,500

---

## Next Steps

1. **Fix Frontend Rendering Issues**
   - Debug React component tree errors
   - Review tRPC client configuration
   - Consider adding React Error Boundaries
   - Test with React DevTools

2. **Alternative Approaches**
   - Build dashboard using direct REST API calls instead of tRPC
   - Use a different routing library (React Router instead of Wouter)
   - Simplify component structure to isolate the error

3. **Immediate Workarounds**
   - Use Kai AI Dashboard for user interactions
   - Build custom admin scripts using the working API endpoints
   - Access data via database queries until frontend is fixed

---

## Support

For backend API issues or database problems, check:
- Server logs: `/home/ubuntu/dojoflow-kiosk/server.log`
- Database connection: Verify `DATABASE_URL` in environment
- API responses: Use curl commands documented above

For frontend rendering issues:
- Browser console: Check for React errors
- Network tab: Verify API calls are being made
- React DevTools: Inspect component tree and state
