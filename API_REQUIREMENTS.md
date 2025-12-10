# CRM Dashboard - Backend API Requirements

This document lists all API endpoints required for the CRM Dashboard to function properly.

## 1. Dashboard Statistics API

### GET `/api/stats/dashboard`
**Purpose**: Fetch real-time dashboard statistics

**Response Format**:
```json
{
  "total_students": 150,
  "monthly_revenue": 12500,
  "total_leads": 45,
  "todays_classes": [
    {
      "name": "Kids Karate - Beginner",
      "time": "4:00 PM",
      "enrolled": 12
    },
    {
      "name": "Adult BJJ - Advanced",
      "time": "6:30 PM",
      "enrolled": 8
    }
  ]
}
```

## 2. Kiosk Statistics APIs

### GET `/api/kiosk/checkin/recent`
**Purpose**: Fetch recent check-ins from kiosk

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "student_name": "John Doe",
      "timestamp": "2025-11-09T14:30:00Z"
    }
  ]
}
```

### GET `/api/kiosk/visitor/recent`
**Purpose**: Fetch recent visitors from kiosk

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "timestamp": "2025-11-09T15:00:00Z"
    }
  ]
}
```

### GET `/api/kiosk/waiver/recent`
**Purpose**: Fetch recent waiver sign-ups

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mike Johnson",
      "timestamp": "2025-11-09T13:45:00Z"
    }
  ]
}
```

## 3. Kai AI Chat API

### POST `/api/kai/chat`
**Purpose**: Send messages to Kai AI assistant and receive intelligent responses

**Request Format**:
```json
{
  "message": "How many students do we have?",
  "conversation_id": "dashboard",
  "context": {}
}
```

**Response Format** (Standard):
```json
{
  "response": "You currently have 150 active students in your dojo."
}
```

**Response Format** (With Student Lookup):
```json
{
  "response": "I found John Doe's information. Here are the details:",
  "action_result": {
    "type": "student_lookup",
    "student": {
      "first_name": "John",
      "last_name": "Doe",
      "belt_rank": "Blue Belt",
      "status": "Active",
      "email": "john.doe@example.com",
      "phone": "(555) 123-4567",
      "age": 25,
      "membership_status": "Premium"
    }
  }
}
```

## 4. Text-to-Speech API

### POST `/api/tts`
**Purpose**: Convert text to speech using ElevenLabs API (Bella voice)

**Request Format**:
```json
{
  "text": "Hello! I'm Kai, your AI assistant."
}
```

**Response Format**: 
- Returns audio blob (audio/mpeg)
- Binary audio data that can be played directly

**Fallback**: If this API fails, the dashboard will fallback to browser's Web Speech API

## Implementation Notes

### Required Features:
1. **Student Lookup**: Kai should be able to search students by name, phone, email
2. **Context Awareness**: Kai should remember the current student context for follow-up questions
3. **Action Results**: Kai should return structured data (like student cards) along with text responses
4. **Voice Integration**: ElevenLabs TTS with Bella voice for natural speech output

### Optional Enhancements:
- Conversation history persistence
- Multi-turn dialogue context
- Real-time stats updates via WebSocket
- Student profile deep-linking

## Current Status

❌ **All APIs are currently NOT implemented** - The dashboard is ported as-is and will show errors when trying to fetch data.

To make the dashboard fully functional, you need to:
1. Implement all backend API endpoints listed above
2. Set up database schema for students, leads, classes, kiosk data
3. Configure ElevenLabs API key for TTS
4. Implement Kai AI logic (can use OpenAI, Claude, or custom LLM)
