# Quick Reference: DojoFlow Lead API

## 🎯 Correct Endpoint

```
POST https://dojoflow.manus.space/api/trpc/publicLead.submitLead
```

## 📝 Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "publicLead.submitLead",
  "params": {
    "input": {
      "email": "sensei@mydojomartialarts.com",
      "password": "your-password",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "555-1234567",
      "programInterest": "Karate",
      "appointmentDate": "2024-02-15",
      "appointmentTime": "14:00",
      "message": "Optional message"
    }
  }
}
```

## ✅ Success Response

```json
{
  "result": {
    "data": {
      "success": true,
      "leadId": 12345,
      "status": "Intro Scheduled",
      "message": "Lead created successfully..."
    }
  }
}
```

## ❌ Error Response

```json
{
  "error": {
    "code": -32600,
    "message": "Invalid email or password"
  }
}
```

## 🔗 Other Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trpc/publicLead.validateCredentials` | GET | Verify email/password |
| `/api/trpc/publicLead.getAvailableSlots` | GET | Get appointment slots |
| `/api/trpc/publicLead.submitLead` | POST | Submit a lead |

## 🚀 Quick Test (cURL)

```bash
curl -X POST https://dojoflow.manus.space/api/trpc/publicLead.submitLead \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "publicLead.submitLead",
    "params": {
      "input": {
        "email": "sensei@mydojomartialarts.com",
        "password": "your-password",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "555-1234567",
        "programInterest": "Karate"
      }
    }
  }'
```

## 📋 Required Fields

- `email` - DojoFlow account email
- `password` - DojoFlow account password
- `firstName` - Lead's first name
- `lastName` - Lead's last name
- `phone` - Lead's phone number
- `programInterest` - Program name (e.g., "Karate", "Judo")

## 🎁 Optional Fields

- `appointmentDate` - YYYY-MM-DD format
- `appointmentTime` - HH:mm format (24-hour)
- `message` - Additional notes from lead
- `source` - Lead source (default: "Website Chatbot")

## 📊 Lead Status

- **No appointment** → Status: "New Lead"
- **With appointment** → Status: "Intro Scheduled"

## 🔑 Environment Variables

```env
VITE_DOJOFLOW_EMAIL=sensei@mydojomartialarts.com
VITE_DOJOFLOW_PASSWORD=your-secure-password
VITE_DOJOFLOW_API_URL=https://dojoflow.manus.space
```

## 💡 Key Points

1. **tRPC Format**: Always use `jsonrpc: "2.0"` and `params: { input: {...} }`
2. **Endpoint Path**: `/api/trpc/{router}.{procedure}` format
3. **Authentication**: Email/password sent with each request
4. **Multi-tenant**: Leads automatically routed to user's organization
5. **Automation**: New leads trigger DojoFlow automation rules

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| 404 Not Found | Check endpoint path is `/api/trpc/publicLead.submitLead` |
| Invalid JSON-RPC | Verify `jsonrpc: "2.0"` and proper params structure |
| Invalid credentials | Check email and password are correct |
| CORS error | Configure CORS on your website |
| Network timeout | Check internet connection and DojoFlow server status |

## 📚 Full Documentation

See `WEBSITE_LEAD_INTEGRATION_CORRECTED.md` for complete documentation with examples.
