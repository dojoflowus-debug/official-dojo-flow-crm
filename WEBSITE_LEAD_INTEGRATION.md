# Website Lead Integration Guide

This guide explains how to integrate your Manus-built website with DojoFlow's lead pipeline.

## Overview

The website can send leads directly to DojoFlow using the public lead submission API. Leads are automatically categorized based on whether an appointment is scheduled:

- **No Appointment** → "New Lead" status
- **Appointment Scheduled** → "Intro Scheduled" status with appointment date/time

## API Endpoints

### 1. Submit Lead

**Endpoint:** `POST /api/trpc/publicLead.submitLead`

**Authentication:** Email + Password (from DojoFlow account)

**Request Body:**
```json
{
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
```

**Required Fields:**
- `email` - DojoFlow account email
- `password` - DojoFlow account password
- `firstName` - Lead's first name
- `lastName` - Lead's last name
- `phone` - Lead's phone number
- `programInterest` - Program they're interested in (e.g., "Karate", "Judo")

**Optional Fields:**
- `appointmentDate` - Date in YYYY-MM-DD format
- `appointmentTime` - Time in HH:mm format (24-hour)
- `message` - Additional message from the lead
- `source` - Source of the lead (default: "Website Chatbot")

**Response:**
```json
{
  "success": true,
  "leadId": 12345,
  "status": "Intro Scheduled",
  "message": "Lead created successfully. Appointment scheduled for 2024-02-15 at 14:00"
}
```

### 2. Get Available Appointment Slots

**Endpoint:** `GET /api/trpc/publicLead.getAvailableSlots`

**Authentication:** Email + Password

**Query Parameters:**
- `email` - DojoFlow account email
- `password` - DojoFlow account password
- `programId` (optional) - Filter by program
- `date` (optional) - Filter by date (YYYY-MM-DD)

**Response:**
```json
{
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
```

### 3. Validate Credentials

**Endpoint:** `GET /api/trpc/publicLead.validateCredentials`

**Query Parameters:**
- `email` - DojoFlow account email
- `password` - DojoFlow account password

**Response:**
```json
{
  "valid": true,
  "message": "Credentials are valid",
  "organizationId": 1080001
}
```

## Implementation Example (JavaScript/TypeScript)

### Basic Lead Submission

```typescript
async function submitLead(leadData: {
  firstName: string;
  lastName: string;
  phone: string;
  programInterest: string;
  appointmentDate?: string;
  appointmentTime?: string;
  message?: string;
}) {
  const email = 'sensei@mydojomartialarts.com';
  const password = 'your-password'; // Store securely in environment variables
  
  try {
    const response = await fetch('/api/trpc/publicLead.submitLead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...leadData,
        source: 'Website Chatbot',
      }),
    });
    
    const result = await response.json();
    
    if (result.result?.data?.success) {
      console.log('Lead submitted:', result.result.data);
      return result.result.data;
    } else {
      console.error('Error:', result.error?.message);
      throw new Error(result.error?.message || 'Failed to submit lead');
    }
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}
```

### Get Available Slots

```typescript
async function getAvailableSlots() {
  const email = 'sensei@mydojomartialarts.com';
  const password = 'your-password';
  
  try {
    const response = await fetch(
      `/api/trpc/publicLead.getAvailableSlots?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const result = await response.json();
    
    if (result.result?.data?.success) {
      return result.result.data.slots;
    } else {
      throw new Error(result.error?.message || 'Failed to get slots');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Validate Credentials

```typescript
async function validateCredentials(email: string, password: string) {
  try {
    const response = await fetch(
      `/api/trpc/publicLead.validateCredentials?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const result = await response.json();
    return result.result?.data || { valid: false };
  } catch (error) {
    console.error('Validation error:', error);
    return { valid: false };
  }
}
```

## Chatbot Integration

### Step 1: Validate Account

When the chatbot loads, validate the DojoFlow credentials:

```typescript
const isValid = await validateCredentials(email, password);
if (!isValid.valid) {
  showError('Invalid DojoFlow credentials. Please check your email and password.');
  return;
}
```

### Step 2: Collect Lead Information

The chatbot should collect:
1. First Name
2. Last Name
3. Phone Number
4. Program Interest
5. Optional: Appointment Date & Time
6. Optional: Message

### Step 3: Show Available Slots

If the user wants to schedule an appointment:

```typescript
const slots = await getAvailableSlots();
// Display slots to user for selection
```

### Step 4: Submit Lead

Once all information is collected:

```typescript
const result = await submitLead({
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234567',
  programInterest: 'Karate',
  appointmentDate: selectedDate,
  appointmentTime: selectedTime,
  message: userMessage,
});

if (result.success) {
  showConfirmation(result.message);
}
```

## Lead Status Mapping

| Status | Meaning | Trigger |
|--------|---------|---------|
| New Lead | Lead submitted without appointment | No appointment date/time |
| Intro Scheduled | Lead with appointment booked | Appointment date & time provided |

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid email or password" | Wrong credentials | Verify email and password in DojoFlow |
| "User does not have an associated organization" | Account not set up | Ensure account is properly configured in DojoFlow |
| "Database not available" | Server error | Retry after a few seconds |

## Security Considerations

⚠️ **Important:**

1. **Never hardcode credentials** - Store email and password in environment variables
2. **Use HTTPS only** - All API calls must use HTTPS
3. **Validate on backend** - Always validate credentials server-side
4. **Rate limiting** - Implement rate limiting to prevent abuse
5. **CORS** - Configure CORS properly for your website domain

## Testing

### Test with cURL

```bash
curl -X POST https://dojoflow.manus.space/api/trpc/publicLead.submitLead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sensei@mydojomartialarts.com",
    "password": "your-password",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-1234567",
    "programInterest": "Karate",
    "message": "Test lead"
  }'
```

### Test Credentials

```bash
curl "https://dojoflow.manus.space/api/trpc/publicLead.validateCredentials?email=sensei@mydojomartialarts.com&password=your-password"
```

## FAQ

**Q: Can I submit leads without an appointment?**
A: Yes! Leads without appointments go to "New Lead" status. Appointments are optional.

**Q: What happens to the leads in DojoFlow?**
A: Leads appear in the Lead Pipeline with the status "New Lead" or "Intro Scheduled" depending on whether an appointment was set.

**Q: Can I customize the appointment slots?**
A: Currently, default slots are provided. You can customize them by editing the `getAvailableSlots` function in `publicLeadRouter.ts`.

**Q: How do I change the account credentials?**
A: Update the email and password in your website's environment variables and re-deploy.

**Q: Is there a lead limit?**
A: No, you can submit unlimited leads. However, implement rate limiting on your website to prevent abuse.

## Support

For issues or questions, contact the DojoFlow support team or check the DojoFlow documentation.
