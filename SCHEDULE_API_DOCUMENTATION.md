# DojoFlow Schedule API Documentation

This document describes all available API endpoints for fetching class schedules and availability in DojoFlow.

## Base URL

All endpoints are tRPC procedures accessible at:
```
POST /api/trpc/classes.<procedure>
```

## Authentication

- **Public endpoints**: Available without authentication
- **Protected endpoints**: Require user authentication
- **Organization filtering**: Automatically filters to current organization

## Available Endpoints

### 1. Get All Classes

**Endpoint**: `classes.getAll`

**Method**: Query (GET)

**Authentication**: Public

**Description**: Retrieves all active classes for the current organization, ordered by day of week and time.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "classes.getAll",
  "params": {}
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": [
      {
        "id": 1,
        "organizationId": 120001,
        "name": "Beginner Karate",
        "dayOfWeek": "Monday",
        "time": "17:00",
        "capacity": 20,
        "enrolled": 15,
        "instructor": "John Sensei",
        "instructorId": 5,
        "program": "Karate",
        "level": "Beginner",
        "room": "Studio A",
        "ageRange": "6-12",
        "locationId": 1,
        "startDate": "2026-01-01",
        "endDate": "2026-12-31",
        "duration": 60,
        "recurringPattern": "weekly",
        "notes": "Great for beginners",
        "isActive": 1,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 2. Get Classes by Location

**Endpoint**: `classes.getByLocation`

**Method**: Query (GET)

**Authentication**: Public

**Description**: Retrieves all active classes at a specific location.

**Request Parameters**:
- `locationId` (number, required): The location ID

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "classes.getByLocation",
  "params": {
    "input": {
      "locationId": 1
    }
  }
}
```

**Response**: Same format as `getAll`, filtered by location

### 3. Get Classes by Day of Week

**Endpoint**: `classes.getByDay`

**Method**: Query (GET)

**Authentication**: Public

**Description**: Retrieves all active classes for a specific day of the week, optionally filtered by location.

**Request Parameters**:
- `dayOfWeek` (string, required): Day name (e.g., "Monday", "Tuesday", etc.)
- `locationId` (number, optional): Filter by location

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "classes.getByDay",
  "params": {
    "input": {
      "dayOfWeek": "Monday",
      "locationId": 1
    }
  }
}
```

**Response**: Same format as `getAll`, filtered by day and optionally location

### 4. Get Available Times (For Chatbot Scheduling)

**Endpoint**: `classes.getAvailableTimes`

**Method**: Query (GET)

**Authentication**: Public

**Description**: Retrieves classes with available spots (not at full capacity), useful for lead scheduling in chatbots. Returns only essential information.

**Request Parameters**:
- `locationId` (number, optional): Filter by location
- `program` (string, optional): Filter by program (e.g., "Karate", "Judo")

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "classes.getAvailableTimes",
  "params": {
    "input": {
      "locationId": 1,
      "program": "Karate"
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": [
      {
        "id": 1,
        "name": "Beginner Karate",
        "dayOfWeek": "Monday",
        "time": "17:00",
        "program": "Karate",
        "level": "Beginner",
        "instructor": "John Sensei",
        "availableSpots": 5,
        "capacity": 20,
        "enrolled": 15
      }
    ]
  }
}
```

### 5. Get Instructors

**Endpoint**: `classes.getInstructors`

**Method**: Query (GET)

**Authentication**: Public

**Description**: Retrieves all active instructors/team members for the organization (roles: instructor, coach, trainer, manager, owner).

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "classes.getInstructors",
  "params": {}
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": [
      {
        "id": 5,
        "name": "John Sensei",
        "role": "instructor",
        "email": "john@dojo.com",
        "phone": "555-1234567",
        "photoUrl": "https://example.com/john.jpg"
      }
    ]
  }
}
```

## Usage Examples

### Example 1: Get Available Times for Chatbot

```javascript
// Fetch available class times for lead scheduling
const response = await fetch('https://dojo-flow.ai/api/trpc/classes.getAvailableTimes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'classes.getAvailableTimes',
    params: {
      input: {
        program: 'Karate'
      }
    }
  })
});

const result = await response.json();
console.log(result.result.data); // Array of available classes
```

### Example 2: Get Monday Classes

```javascript
const response = await fetch('https://dojo-flow.ai/api/trpc/classes.getByDay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'classes.getByDay',
    params: {
      input: {
        dayOfWeek: 'Monday'
      }
    }
  })
});

const result = await response.json();
console.log(result.result.data);
```

### Example 3: Get All Classes

```javascript
const response = await fetch('https://dojo-flow.ai/api/trpc/classes.getAll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'classes.getAll',
    params: {}
  })
});

const result = await response.json();
console.log(result.result.data);
```

## cURL Examples

### Get Available Times
```bash
curl -X POST https://dojo-flow.ai/api/trpc/classes.getAvailableTimes \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "classes.getAvailableTimes",
    "params": {
      "input": {
        "program": "Karate"
      }
    }
  }'
```

### Get All Classes
```bash
curl -X POST https://dojo-flow.ai/api/trpc/classes.getAll \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "classes.getAll",
    "params": {}
  }'
```

### Get Monday Classes
```bash
curl -X POST https://dojo-flow.ai/api/trpc/classes.getByDay \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "classes.getByDay",
    "params": {
      "input": {
        "dayOfWeek": "Monday"
      }
    }
  }'
```

## Integration with Chatbot

For your website chatbot lead scheduling, use the `classes.getAvailableTimes` endpoint:

```typescript
// In your chatbot service
async function getAvailableClassTimes(program?: string, locationId?: number) {
  const response = await fetch('/api/trpc/classes.getAvailableTimes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random(),
      method: 'classes.getAvailableTimes',
      params: {
        input: {
          program,
          locationId
        }
      }
    })
  });

  const result = await response.json();
  return result.result.data;
}

// Use in chatbot
const availableTimes = await getAvailableClassTimes('Karate');
// Display availableTimes to lead for scheduling
```

## Response Format

All responses follow the tRPC JSON-RPC 2.0 format:

**Success**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": [...]
  }
}
```

**Error**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal server error"
  }
}
```

## Common Filtering Patterns

### Get Beginner Classes
```json
{
  "method": "classes.getAll",
  "params": {}
}
// Then filter client-side by level: "Beginner"
```

### Get Classes for Kids (6-12)
```json
{
  "method": "classes.getAll",
  "params": {}
}
// Then filter client-side by ageRange: "6-12"
```

### Get Classes with Available Spots
```json
{
  "method": "classes.getAvailableTimes",
  "params": {
    "input": {
      "program": "Karate"
    }
  }
}
// Only returns classes where enrolled < capacity
```

## Notes

- All endpoints automatically filter to the current organization
- Classes are ordered by day of week and time
- Only active classes (isActive = 1) are returned
- The `getAvailableTimes` endpoint is optimized for chatbot use cases
- All timestamps are in ISO 8601 format
- Capacity and enrollment are tracked per class

## Next Steps

1. **Integrate into Chatbot**: Use `classes.getAvailableTimes` to display available appointment slots
2. **Add Appointment Booking**: Create an appointment booking endpoint to reserve class spots
3. **Add Calendar Sync**: Sync class schedules with external calendar systems
4. **Add Notifications**: Send reminders for upcoming classes
