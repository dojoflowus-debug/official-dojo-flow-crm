# Website Lead Integration Guide - CORRECTED

This guide explains how to integrate your Manus-built website with DojoFlow's lead pipeline using the correct tRPC endpoint paths.

## ⚠️ Important: Correct Endpoint Path

The tRPC endpoints use the format: `/api/trpc/{router}.{procedure}`

**Base URL:** `https://dojoflow.manus.space` (or your DojoFlow domain)

## API Endpoints

### 1. Submit Lead

**Endpoint:** `POST /api/trpc/publicLead.submitLead`

**Full URL:** `https://dojoflow.manus.space/api/trpc/publicLead.submitLead`

**Request Format (JSON-RPC 2.0):**
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
      "message": "Interested in kids classes",
      "source": "Website Chatbot"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": {
      "success": true,
      "leadId": 12345,
      "status": "Intro Scheduled",
      "message": "Lead created successfully. Appointment scheduled for 2024-02-15 at 14:00"
    }
  }
}
```

### 2. Get Available Appointment Slots

**Endpoint:** `GET /api/trpc/publicLead.getAvailableSlots`

**Full URL:** `https://dojoflow.manus.space/api/trpc/publicLead.getAvailableSlots?input={...}`

**Query Parameters (URL-encoded JSON):**
```
email=sensei@mydojomartialarts.com
password=your-password
programId=1 (optional)
date=2024-02-15 (optional)
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": {
      "success": true,
      "slots": [
        { "time": "09:00", "label": "9:00 AM" },
        { "time": "10:00", "label": "10:00 AM" },
        { "time": "14:00", "label": "2:00 PM" },
        { "time": "16:00", "label": "4:00 PM" },
        { "time": "18:00", "label": "6:00 PM" },
        { "time": "19:00", "label": "7:00 PM" }
      ],
      "message": "Available appointment slots retrieved successfully"
    }
  }
}
```

### 3. Validate Credentials

**Endpoint:** `GET /api/trpc/publicLead.validateCredentials`

**Full URL:** `https://dojoflow.manus.space/api/trpc/publicLead.validateCredentials?input={...}`

**Query Parameters:**
```
email=sensei@mydojomartialarts.com
password=your-password
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": {
      "valid": true,
      "message": "Credentials are valid",
      "organizationId": 1080001
    }
  }
}
```

## Implementation Examples

### JavaScript/TypeScript - Correct Implementation

```typescript
// services/leadService.ts

const API_BASE_URL = 'https://dojoflow.manus.space';

interface LeadData {
  firstName: string;
  lastName: string;
  phone: string;
  programInterest: string;
  appointmentDate?: string;
  appointmentTime?: string;
  message?: string;
}

export const leadService = {
  async submitLead(
    email: string,
    password: string,
    leadData: LeadData
  ): Promise<{ success: boolean; leadId?: number; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trpc/publicLead.submitLead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'publicLead.submitLead',
            params: {
              input: {
                email,
                password,
                ...leadData,
                source: 'Website Chatbot',
              },
            },
          }),
        }
      );

      const result = await response.json();

      // Check for tRPC errors
      if (result.error) {
        return {
          success: false,
          message: result.error.message || 'Failed to submit lead',
        };
      }

      // Check for successful response
      if (result.result?.data?.success) {
        return {
          success: true,
          leadId: result.result.data.leadId,
          message: result.result.data.message,
        };
      }

      return {
        success: false,
        message: 'Unexpected response format',
      };
    } catch (error) {
      console.error('Lead submission error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  async getAvailableSlots(
    email: string,
    password: string
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({ email, password }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/trpc/publicLead.getAvailableSlots?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.error) {
        console.error('Error fetching slots:', result.error.message);
        return [];
      }

      return result.result?.data?.slots || [];
    } catch (error) {
      console.error('Error fetching slots:', error);
      return [];
    }
  },

  async validateCredentials(
    email: string,
    password: string
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({ email, password }),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/trpc/publicLead.validateCredentials?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.error) {
        return {
          valid: false,
          message: result.error.message || 'Validation failed',
        };
      }

      return result.result?.data || { valid: false, message: 'Validation failed' };
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, message: 'Network error' };
    }
  },
};
```

### Usage in Chatbot

```typescript
// components/ChatbotWidget.tsx

import { leadService } from '@/services/leadService';

const DOJOFLOW_EMAIL = import.meta.env.VITE_DOJOFLOW_EMAIL;
const DOJOFLOW_PASSWORD = import.meta.env.VITE_DOJOFLOW_PASSWORD;

async function handleSubmitLead() {
  const result = await leadService.submitLead(
    DOJOFLOW_EMAIL,
    DOJOFLOW_PASSWORD,
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234567',
      programInterest: 'Karate',
      appointmentDate: '2024-02-15',
      appointmentTime: '14:00',
      message: 'Interested in classes',
    }
  );

  if (result.success) {
    console.log('Lead submitted successfully:', result.leadId);
    showSuccessMessage(result.message);
  } else {
    console.error('Failed to submit lead:', result.message);
    showErrorMessage(result.message);
  }
}
```

## Testing with cURL

### Test Lead Submission

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
        "programInterest": "Karate",
        "message": "Test lead"
      }
    }
  }'
```

### Test Credentials

```bash
curl "https://dojoflow.manus.space/api/trpc/publicLead.validateCredentials?input=%7B%22email%22%3A%22sensei%40mydojomartialarts.com%22%2C%22password%22%3A%22your-password%22%7D"
```

### Test Available Slots

```bash
curl "https://dojoflow.manus.space/api/trpc/publicLead.getAvailableSlots?input=%7B%22email%22%3A%22sensei%40mydojomartialarts.com%22%2C%22password%22%3A%22your-password%22%7D"
```

## Environment Variables

Add these to your website's `.env` file:

```env
VITE_DOJOFLOW_EMAIL=sensei@mydojomartialarts.com
VITE_DOJOFLOW_PASSWORD=your-secure-password
VITE_DOJOFLOW_API_URL=https://dojoflow.manus.space
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Wrong endpoint path | Use `/api/trpc/publicLead.submitLead` not `/api/leads/submit` |
| Invalid JSON-RPC | Wrong request format | Use `jsonrpc: "2.0"` and `params: { input: {...} }` |
| 401 Unauthorized | Wrong credentials | Verify email and password are correct |
| "User does not have an associated organization" | Account not linked to org | Ensure account is set up in DojoFlow |
| CORS errors | Cross-origin request blocked | Configure CORS on DojoFlow server |

## Debugging Tips

1. **Check Network Tab**: Open browser DevTools → Network tab → look for the `/api/trpc/publicLead.submitLead` request
2. **Inspect Response**: Click the request and check the Response tab for error details
3. **Check Console**: Look for JavaScript errors in the Console tab
4. **Test Credentials First**: Always validate credentials before submitting leads
5. **Use cURL**: Test the endpoint directly with cURL to isolate issues

## Security Best Practices

⚠️ **Important:**

1. **Never hardcode credentials** in client-side code
2. **Use environment variables** for email and password
3. **Use HTTPS only** for all API calls
4. **Validate on backend** - never trust client-side validation alone
5. **Implement rate limiting** to prevent abuse
6. **Use CORS properly** - only allow your website domain
7. **Rotate credentials regularly** - change password periodically

## Support

For issues:
1. Check this guide's "Common Issues" section
2. Test with cURL to verify the endpoint works
3. Check DojoFlow's server logs for detailed error messages
4. Contact DojoFlow support with the full error response
