# DojoFlow Kiosk - tRPC API Documentation

## Students CRUD Operations

All student procedures are under the `students` router namespace.

---

### 1. **students.list** (Query)

**Description:** Retrieve all students from the database.

**Procedure Type:** Query

**Input Schema:** None (no input required)

**Output Schema:**
```typescript
Array<{
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  age: number | null;
  beltRank: string | null;
  status: "Active" | "Inactive" | "On Hold";
  membershipStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**HTTP Endpoint:**
```
GET /api/trpc/students.list?batch=1&input={"0":{}}
```

**Example Response:**
```json
[{
  "result": {
    "data": {
      "json": [
        {
          "id": 90001,
          "firstName": "Emma",
          "lastName": "Smith",
          "email": "emma.smith@yahoo.com",
          "phone": "(802) 858-3817",
          "age": 21,
          "beltRank": "Purple Belt",
          "status": "Inactive",
          "membershipStatus": "Active",
          "createdAt": "2025-11-12T10:30:00.000Z",
          "updatedAt": "2025-11-12T10:30:00.000Z"
        }
      ]
    }
  }
}]
```

---

### 2. **students.create** (Mutation)

**Description:** Create a new student record.

**Procedure Type:** Mutation

**Input Schema:**
```typescript
{
  firstName: string;              // Required
  lastName: string;               // Required
  email?: string;                 // Optional, must be valid email format
  phone?: string;                 // Optional
  age?: number;                   // Optional
  beltRank?: string;              // Optional, defaults to "White"
  status?: string;                // Optional, defaults to "Active"
  membershipStatus?: string;      // Optional, defaults to "Active"
}
```

**Output Schema:**
```typescript
{
  success: boolean;
  id: number | null;  // insertId from database
}
```

**HTTP Endpoint:**
```
POST /api/trpc/students.create?batch=1
Content-Type: application/json

Body: {"0":{"json":{...studentData...}}}
```

**Example Request:**
```json
{
  "0": {
    "json": {
      "firstName": "Sarah",
      "lastName": "Connor",
      "email": "sarah.connor@example.com",
      "phone": "(555) 777-8888",
      "age": 32,
      "beltRank": "White",
      "status": "Active",
      "membershipStatus": "Active"
    }
  }
}
```

**Example Response:**
```json
[{
  "result": {
    "data": {
      "json": {
        "success": true,
        "id": null
      }
    }
  }
}]
```

---

### 3. **students.update** (Mutation)

**Description:** Update an existing student record by ID.

**Procedure Type:** Mutation

**Input Schema:**
```typescript
{
  id: number;                     // Required - student ID to update
  firstName?: string;             // Optional
  lastName?: string;              // Optional
  email?: string;                 // Optional, must be valid email format
  phone?: string;                 // Optional
  age?: number;                   // Optional
  beltRank?: string;              // Optional
  status?: string;                // Optional
  membershipStatus?: string;      // Optional
}
```

**Output Schema:**
```typescript
{
  success: boolean;
}
```

**HTTP Endpoint:**
```
POST /api/trpc/students.update?batch=1
Content-Type: application/json

Body: {"0":{"json":{...updateData...}}}
```

**Example Request:**
```json
{
  "0": {
    "json": {
      "id": 90003,
      "age": 35
    }
  }
}
```

**Example Response:**
```json
[{
  "result": {
    "data": {
      "json": {
        "success": true
      }
    }
  }
}]
```

---

### 4. **students.delete** (Mutation)

**Description:** Delete a student record by ID.

**Procedure Type:** Mutation

**Input Schema:**
```typescript
{
  id: number;  // Required - student ID to delete
}
```

**Output Schema:**
```typescript
{
  success: boolean;
}
```

**HTTP Endpoint:**
```
POST /api/trpc/students.delete?batch=1
Content-Type: application/json

Body: {"0":{"json":{"id": studentId}}}
```

**Example Request:**
```json
{
  "0": {
    "json": {
      "id": 90002
    }
  }
}
```

**Example Response:**
```json
[{
  "result": {
    "data": {
      "json": {
        "success": true
      }
    }
  }
}]
```

---

## Additional Student Procedures

### 5. **students.lookupByPhone** (Mutation)

**Description:** Search for a student by phone number (partial match).

**Input Schema:**
```typescript
{
  phone: string;  // Required - phone number to search
}
```

**Output Schema:**
```typescript
{
  student: Student | null;
  message?: string;  // Only present if student not found
}
```

---

### 6. **students.searchStudents** (Mutation)

**Description:** Search students by query string.

**Input Schema:**
```typescript
{
  query: string;  // Required - search query
}
```

**Output Schema:**
```typescript
{
  students: Student[];
}
```

---

### 7. **students.stats** (Query)

**Description:** Get dashboard statistics for students.

**Input Schema:** None

**Output Schema:**
```typescript
{
  total: number;
  active: number;
  overdue: number;
  newThisMonth: number;
}
```

---

## tRPC Batch Format

All tRPC endpoints use the batch format for consistency:

**Query Format:**
```
GET /api/trpc/[procedure]?batch=1&input={"0":{}}
```

**Mutation Format:**
```
POST /api/trpc/[procedure]?batch=1
Content-Type: application/json

{"0":{"json":{...inputData...}}}
```

**Response Format:**
```json
[{
  "result": {
    "data": {
      "json": {...responseData...}
    }
  }
}]
```

---

## Database Schema

**Table:** `students`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | int | PRIMARY KEY, AUTO_INCREMENT | - |
| `firstName` | varchar(255) | NOT NULL | - |
| `lastName` | varchar(255) | NOT NULL | - |
| `email` | varchar(320) | NULLABLE | null |
| `phone` | varchar(20) | NULLABLE | null |
| `age` | int | NULLABLE | null |
| `beltRank` | varchar(100) | NULLABLE | null |
| `status` | enum | NOT NULL | "Active" |
| `membershipStatus` | varchar(100) | NULLABLE | null |
| `createdAt` | timestamp | NOT NULL | CURRENT_TIMESTAMP |
| `updatedAt` | timestamp | NOT NULL | CURRENT_TIMESTAMP ON UPDATE |

**Status Enum Values:** `"Active"`, `"Inactive"`, `"On Hold"`

---

## Error Handling

All procedures may throw errors with the following structure:

```json
{
  "error": {
    "json": {
      "message": "Error message",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400,
        "stack": "...",
        "path": "students.create"
      }
    }
  }
}
```

Common error codes:
- `-32600`: Invalid Request (BAD_REQUEST)
- `-32603`: Internal Error (INTERNAL_SERVER_ERROR)

---

## Testing with curl

**List all students:**
```bash
curl 'http://localhost:3000/api/trpc/students.list?batch=1&input=%7B%220%22%3A%7B%7D%7D'
```

**Create a student:**
```bash
curl -X POST 'http://localhost:3000/api/trpc/students.create?batch=1' \
  -H 'Content-Type: application/json' \
  -d '{"0":{"json":{"firstName":"John","lastName":"Doe","email":"john@example.com","age":25}}}'
```

**Update a student:**
```bash
curl -X POST 'http://localhost:3000/api/trpc/students.update?batch=1' \
  -H 'Content-Type: application/json' \
  -d '{"0":{"json":{"id":90001,"age":26}}}'
```

**Delete a student:**
```bash
curl -X POST 'http://localhost:3000/api/trpc/students.delete?batch=1' \
  -H 'Content-Type: application/json' \
  -d '{"0":{"json":{"id":90001}}}'
```

---

## Frontend Integration

The Students Management page at `/students.html` demonstrates vanilla JavaScript integration:

```javascript
// Fetch all students
const response = await fetch('/api/trpc/students.list?batch=1&input=%7B%220%22%3A%7B%7D%7D');
const data = await response.json();
const students = data[0].result.data.json;

// Create student
const response = await fetch('/api/trpc/students.create?batch=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ "0": { json: studentData } })
});

// Update student
const response = await fetch('/api/trpc/students.update?batch=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ "0": { json: { id: studentId, ...updates } } })
});

// Delete student
const response = await fetch('/api/trpc/students.delete?batch=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ "0": { json: { id: studentId } } })
});
```

---

**Last Updated:** November 12, 2025  
**API Version:** 1.0  
**Base URL:** `http://localhost:3000/api/trpc` (development)
