# DojoFlow Deployment Guide

**Version:** 1.0  
**Last Updated:** December 23, 2024  
**Author:** Manus AI  
**Target Audience:** DevOps Engineers, System Administrators, Technical Leads

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Pre-Deployment Requirements](#pre-deployment-requirements)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup & Migration](#database-setup--migration)
6. [Third-Party Integrations](#third-party-integrations)
7. [Application Deployment](#application-deployment)
8. [Security Configuration](#security-configuration)
9. [Multi-Tenant Architecture](#multi-tenant-architecture)
10. [Monitoring & Observability](#monitoring--observability)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [Scaling Considerations](#scaling-considerations)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Executive Summary

DojoFlow is a comprehensive multi-tenant SaaS platform for martial arts school management, featuring AI-powered insights, student tracking, billing automation, and kiosk check-in systems. This document provides complete deployment instructions for production environments.

**Key Features:**
- Multi-tenant architecture supporting unlimited organizations
- AI-powered virtual assistant (Kai) with voice capabilities
- Real-time student tracking with geolocation
- Automated billing and subscription management via Stripe
- Kiosk mode for in-person check-ins
- SMS/Email notifications via Twilio and SendGrid
- Voice synthesis via ElevenLabs
- File storage via AWS S3

**Technology Stack:**
- **Frontend:** React 19, Tailwind CSS 4, Vite
- **Backend:** Node.js 22, Express 4, tRPC 11
- **Database:** MySQL/TiDB (serverless-compatible)
- **Authentication:** JWT-based sessions with OAuth support
- **Storage:** AWS S3 (or S3-compatible services)
- **Real-time:** Server-Sent Events (SSE) for live updates

---

## System Architecture Overview

DojoFlow follows a modern three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  - Public Landing Page                                       │
│  - Owner Dashboard (Multi-org management)                    │
│  - Staff Interface (Organization-scoped)                     │
│  - Student Portal (Self-service)                             │
│  - Kiosk Interface (Location-bound)                          │
│  - Platform Admin CRM (Internal operations)                  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer (tRPC)                   │
│  - Authentication Routers (Owner/Staff/Student/Platform)     │
│  - Feature Routers (Students/Classes/Billing/Kai/etc.)       │
│  - Middleware (orgScopedProcedure, kioskProcedure)           │
│  - Credit Consumption System                                 │
│  - File Intelligence & LLM Integration                       │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer (MySQL)                      │
│  - Organizations & Users (Multi-tenant core)                 │
│  - Students, Classes, Staff (Operational data)               │
│  - Billing & Subscriptions (Stripe integration)              │
│  - AI Credit Transactions (Usage tracking)                   │
│  - Kai Conversations & Messages (Chat history)               │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services Layer                     │
│  - Stripe (Payments & Subscriptions)                         │
│  - Twilio (SMS & Voice)                                      │
│  - SendGrid (Email)                                          │
│  - ElevenLabs (Text-to-Speech)                               │
│  - AWS S3 (File Storage)                                     │
│  - OpenAI/Gemini (LLM for Kai)                               │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation Model

DojoFlow implements **organization-level tenancy** with the following isolation guarantees:

| Resource Type | Isolation Method | Enforcement Point |
|---------------|------------------|-------------------|
| Database Queries | `WHERE organizationId = ?` | Middleware (orgScopedProcedure) |
| File Storage | S3 key prefix: `org-{id}/` | Application layer |
| Sessions | JWT with `currentOrganizationId` | Context builder |
| Kiosk Access | Location-bound sessions | kioskProcedure middleware |
| Platform Admin | `globalRole = 'platform_admin'` | platformAdminProcedure |

---

## Pre-Deployment Requirements

### Hardware Requirements

**Minimum Production Configuration:**
- **CPU:** 4 vCPUs (x86_64 or ARM64)
- **RAM:** 8 GB
- **Storage:** 50 GB SSD (application + logs)
- **Network:** 1 Gbps uplink

**Recommended Production Configuration:**
- **CPU:** 8 vCPUs
- **RAM:** 16 GB
- **Storage:** 100 GB SSD
- **Network:** 10 Gbps uplink

**Database Server (if self-hosted):**
- **CPU:** 4+ vCPUs
- **RAM:** 16+ GB
- **Storage:** 200+ GB SSD with provisioned IOPS
- **Backup Storage:** 500+ GB (retention policy dependent)

### Software Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 22.13.0+ | LTS recommended |
| npm/pnpm | pnpm 9.0+ | Package manager |
| MySQL/TiDB | 8.0+ / 7.5+ | Serverless TiDB recommended |
| Git | 2.40+ | Version control |
| SSL Certificate | Valid TLS 1.3 | Let's Encrypt or commercial CA |

### Network Requirements

**Inbound Ports:**
- **443 (HTTPS):** Public web traffic
- **80 (HTTP):** Redirect to HTTPS only

**Outbound Access Required:**
- **Stripe API:** `api.stripe.com:443`
- **Twilio API:** `api.twilio.com:443`
- **SendGrid API:** `api.sendgrid.com:443`
- **ElevenLabs API:** `api.elevenlabs.io:443`
- **OpenAI API:** `api.openai.com:443`
- **AWS S3:** `s3.amazonaws.com:443` (or your S3-compatible endpoint)
- **Database:** Your MySQL/TiDB endpoint (port 3306 or 4000)

### Domain Requirements

You will need the following DNS records configured:

| Record Type | Hostname | Purpose |
|-------------|----------|---------|
| A / AAAA | `dojoflow.com` | Main application |
| A / AAAA | `www.dojoflow.com` | WWW redirect |
| CNAME | `kiosk.dojoflow.com` | Kiosk subdomain (optional) |
| CNAME | `admin.dojoflow.com` | Platform admin (optional) |
| TXT | `_dmarc.dojoflow.com` | Email authentication |
| TXT | `dojoflow.com` | SPF record for SendGrid |

---

## Environment Configuration

DojoFlow uses environment variables for all configuration. The application expects a `.env` file in the project root with the following structure:

### Core Application Settings

```bash
# Node Environment
NODE_ENV=production

# Application URL
VITE_APP_URL=https://dojoflow.com
VITE_APP_TITLE=DojoFlow
VITE_APP_LOGO=/logo-dark.png

# Server Configuration
PORT=3000
HOST=0.0.0.0
```

### Database Configuration

```bash
# MySQL/TiDB Connection String
# Format: mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
DATABASE_URL=mysql://dojoflow_user:STRONG_PASSWORD_HERE@db.example.com:3306/dojoflow_prod?ssl={"rejectUnauthorized":true}

# Connection Pool Settings (optional)
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
```

**Important:** For TiDB Serverless, use the connection string provided in your TiDB Cloud dashboard. Enable SSL for all production databases.

### Authentication & Security

```bash
# JWT Secret (MUST be cryptographically random, 64+ characters)
# Generate with: openssl rand -base64 64
JWT_SECRET=YOUR_RANDOM_64_CHAR_SECRET_HERE

# Session Configuration
SESSION_COOKIE_NAME=dojoflow_session
SESSION_MAX_AGE=2592000000
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# OAuth Configuration (if using Manus OAuth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your_manus_app_id

# Owner Information
OWNER_OPEN_ID=owner_unique_id
OWNER_NAME=Your Name
```

### Stripe Integration

```bash
# Stripe API Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# Stripe Webhook Secret (from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Product/Price IDs (create in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_starter_monthly
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_monthly
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly
```

**Stripe Setup Steps:**
1. Create a Stripe account at https://stripe.com
2. Navigate to Developers → API Keys
3. Copy your Secret Key and Publishable Key
4. Create webhook endpoint pointing to `https://dojoflow.com/api/webhooks/stripe`
5. Subscribe to events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
6. Copy the webhook signing secret

### Twilio Integration (SMS & Voice)

```bash
# Twilio Credentials (from https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Twilio Verify Service (for OTP)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Twilio Setup Steps:**
1. Create account at https://twilio.com
2. Purchase a phone number with SMS and Voice capabilities
3. Create a Verify Service for OTP functionality
4. Copy Account SID, Auth Token, Phone Number, and Verify Service SID

### SendGrid Integration (Email)

```bash
# SendGrid API Key (from https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Configuration
SENDGRID_FROM_EMAIL=noreply@dojoflow.com
SENDGRID_FROM_NAME=DojoFlow

# Email Templates (optional - create in SendGrid)
SENDGRID_WELCOME_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_RECEIPT_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_REMINDER_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**SendGrid Setup Steps:**
1. Create account at https://sendgrid.com
2. Verify your domain (Settings → Sender Authentication)
3. Create API key with "Mail Send" permissions
4. Configure SPF and DKIM records in your DNS

### ElevenLabs Integration (Text-to-Speech)

```bash
# ElevenLabs API Key (from https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Voice Configuration
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
```

**ElevenLabs Setup Steps:**
1. Create account at https://elevenlabs.io
2. Navigate to Profile → API Keys
3. Generate new API key
4. Select voice ID from Voice Library (default: Rachel)

### OpenAI/LLM Integration

```bash
# OpenAI API Key (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Or use Manus Built-in Forge API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### AWS S3 Storage

```bash
# S3 Configuration
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=dojoflow-production

# S3-Compatible Storage (alternative)
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_FORCE_PATH_STYLE=false
```

**S3 Setup Steps:**
1. Create AWS account and IAM user with S3 permissions
2. Create S3 bucket with private ACL
3. Configure CORS policy to allow uploads from your domain
4. Enable versioning and lifecycle policies for backups

**Example S3 CORS Policy:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://dojoflow.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Google Maps Integration

```bash
# Google Maps API Key (from https://console.cloud.google.com)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Google Maps Setup Steps:**
1. Create project in Google Cloud Console
2. Enable Maps JavaScript API, Geocoding API, Places API
3. Create API key with domain restrictions
4. Set daily quota limits to prevent abuse

### Analytics Configuration

```bash
# Analytics (optional)
VITE_ANALYTICS_WEBSITE_ID=your_analytics_id
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
```

---

## Database Setup & Migration

DojoFlow uses Drizzle ORM for database management with MySQL/TiDB as the primary database.

### Database Schema Overview

The application uses **37 database tables** organized into the following categories:

**Core Multi-Tenant Tables:**
- `organizations` - Tenant organizations
- `users` - User accounts (shared across orgs)
- `organization_users` - User-org relationships with roles
- `locations` - Physical locations per organization

**Student Management:**
- `students` - Student profiles with contact info
- `student_notes` - Notes and observations
- `student_documents` - Uploaded files and waivers
- `student_messages` - Student-instructor messaging

**Class Management:**
- `classes` - Class schedules and programs
- `class_sessions` - Individual class instances
- `class_enrollments` - Student enrollments
- `class_reminders` - Automated reminder system
- `floor_plans` - Room layouts for spot assignments
- `floor_plan_spots` - Individual spots in floor plans
- `session_spot_assignments` - Student spot assignments

**Billing & Subscriptions:**
- `programs` - Martial arts programs offered
- `membership_plans` - Pricing tiers
- `class_entitlements` - Access rules per plan
- `one_time_fees` - Registration and certification fees
- `discounts` - Promotional offers
- `add_ons` - Optional purchases
- `platform_subscriptions` - Platform-level billing (SaaS)
- `ai_credit_transactions` - AI usage tracking

**Staff & Operations:**
- `team_members` - Staff profiles
- `directed_messages` - Staff messaging
- `staff_messages` - Internal communications
- `merchandise_items` - Inventory items
- `student_merchandise` - Fulfillment tracking
- `stock_usage_history` - Inventory analytics

**Leads & Marketing:**
- `leads` - Prospective students
- `lead_activities` - Activity timeline
- `lead_scoring_rules` - Automated scoring

**AI & Automation:**
- `kai_conversations` - Chat threads
- `kai_messages` - Individual messages
- `enrollments` - Smart enrollment forms
- `documents` - File library

**Platform Admin (Internal):**
- `platform_subscriptions` - Organization billing
- `usage_events` - Billable action tracking
- `platform_onboarding_progress` - Wizard state
- `feature_flags` - Per-org feature toggles
- `account_flags` - Risk indicators

**Configuration:**
- `dojo_settings` - Organization settings
- `kiosk_settings` - Kiosk configuration

### Initial Database Setup

**Step 1: Create Database**

For self-hosted MySQL:
```sql
CREATE DATABASE dojoflow_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dojoflow_user'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON dojoflow_prod.* TO 'dojoflow_user'@'%';
FLUSH PRIVILEGES;
```

For TiDB Serverless:
- Create database via TiDB Cloud console
- Copy connection string to `DATABASE_URL`

**Step 2: Run Migrations**

```bash
# Install dependencies
pnpm install

# Generate migration files (if schema changed)
pnpm db:generate

# Apply migrations to database
pnpm db:push
```

**Step 3: Verify Schema**

```bash
# Connect to database
mysql -h db.example.com -u dojoflow_user -p dojoflow_prod

# List tables
SHOW TABLES;

# Verify key tables exist
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM users;
```

### Seeding Initial Data

**Create Platform Admin User:**

```sql
-- Insert platform admin user
INSERT INTO users (id, email, name, globalRole, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin@dojoflow.com',
  'Platform Administrator',
  'platform_admin',
  NOW(),
  NOW()
);

-- Set password (use bcrypt hash)
-- Generate hash: node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
UPDATE users 
SET passwordHash = '$2b$10$BCRYPT_HASH_HERE'
WHERE email = 'admin@dojoflow.com';
```

**Create Default Programs:**

```sql
INSERT INTO programs (id, organizationId, name, type, ageMin, ageMax, description, createdAt, updatedAt)
VALUES
  ('prog-001', 'org-001', 'Kids Karate', 'karate', 4, 12, 'Traditional karate for children', NOW(), NOW()),
  ('prog-002', 'org-001', 'Teen Martial Arts', 'mixed', 13, 17, 'Mixed martial arts for teens', NOW(), NOW()),
  ('prog-003', 'org-001', 'Adult Karate', 'karate', 18, 99, 'Adult karate program', NOW(), NOW()),
  ('prog-004', 'org-001', 'Little Dragons', 'karate', 3, 5, 'Pre-school martial arts', NOW(), NOW());
```

**Create Default Membership Plans:**

```sql
INSERT INTO membership_plans (id, organizationId, name, description, monthlyPrice, billingCycle, termLength, registrationFee, createdAt, updatedAt)
VALUES
  ('plan-001', 'org-001', 'Starter', 'Basic membership', 14900, 'monthly', 'month_to_month', 5000, NOW(), NOW()),
  ('plan-002', 'org-001', 'Professional', 'Most popular', 19900, 'monthly', 'month_to_month', 5000, NOW(), NOW()),
  ('plan-003', 'org-001', 'Elite', 'Unlimited access', 29900, 'monthly', 'month_to_month', 0, NOW(), NOW());
```

### Database Backup Strategy

**Automated Backups:**

```bash
#!/bin/bash
# /opt/dojoflow/scripts/backup-db.sh

BACKUP_DIR="/var/backups/dojoflow"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dojoflow_$TIMESTAMP.sql.gz"

# Create backup
mysqldump -h db.example.com -u dojoflow_user -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  dojoflow_prod | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://dojoflow-backups/database/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "dojoflow_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Cron Schedule:**
```cron
# Daily backup at 2 AM
0 2 * * * /opt/dojoflow/scripts/backup-db.sh >> /var/log/dojoflow/backup.log 2>&1
```

**Restore Procedure:**

```bash
# Download backup from S3
aws s3 cp s3://dojoflow-backups/database/dojoflow_20241223_020000.sql.gz .

# Restore database
gunzip < dojoflow_20241223_020000.sql.gz | mysql -h db.example.com -u dojoflow_user -p dojoflow_prod

# Verify restoration
mysql -h db.example.com -u dojoflow_user -p dojoflow_prod -e "SELECT COUNT(*) FROM organizations;"
```

---

## Third-Party Integrations

### Stripe Payment Processing

**Webhook Configuration:**

DojoFlow requires the following Stripe webhook events:

| Event | Purpose |
|-------|---------|
| `customer.subscription.created` | Allocate initial credits |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Handle cancellations |
| `invoice.payment_succeeded` | Renew credits on payment |
| `invoice.payment_failed` | Suspend service on failure |
| `checkout.session.completed` | Complete onboarding flow |

**Webhook Endpoint:** `https://dojoflow.com/api/webhooks/stripe`

**Testing Webhooks Locally:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

**Production Webhook Setup:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://dojoflow.com/api/webhooks/stripe`
4. Select events listed above
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Twilio SMS & Voice

**Phone Number Configuration:**

Your Twilio phone number must have the following capabilities enabled:
- SMS (send and receive)
- Voice (inbound and outbound)
- MMS (optional, for image attachments)

**Webhook Configuration:**

| Webhook Type | URL | Method |
|--------------|-----|--------|
| SMS Incoming | `https://dojoflow.com/api/webhooks/twilio/sms` | POST |
| Voice Incoming | `https://dojoflow.com/api/webhooks/twilio/voice` | POST |
| Status Callback | `https://dojoflow.com/api/webhooks/twilio/status` | POST |

**Verify Service Setup:**

```bash
# Create Verify Service via Twilio CLI
twilio api:verify:v2:services:create \
  --friendly-name "DojoFlow OTP" \
  --code-length 6

# Copy the Service SID to TWILIO_VERIFY_SERVICE_SID
```

**Rate Limiting:**

Configure rate limits in Twilio Console to prevent abuse:
- Max 5 verification attempts per phone number per hour
- Max 10 SMS per phone number per day (for notifications)

### SendGrid Email Delivery

**Domain Authentication:**

Add the following DNS records (values from SendGrid dashboard):

```
# SPF Record
TXT @ v=spf1 include:sendgrid.net ~all

# DKIM Records (3 records)
CNAME s1._domainkey.dojoflow.com s1.domainkey.u12345678.wl123.sendgrid.net
CNAME s2._domainkey.dojoflow.com s2.domainkey.u12345678.wl123.sendgrid.net
CNAME em1234.dojoflow.com u12345678.wl123.sendgrid.net

# DMARC Record
TXT _dmarc.dojoflow.com v=DMARC1; p=quarantine; rua=mailto:dmarc@dojoflow.com
```

**Email Templates:**

DojoFlow uses dynamic templates for transactional emails. Create the following templates in SendGrid:

1. **Welcome Email** (sent on student registration)
2. **Class Reminder** (sent 24 hours before class)
3. **Payment Receipt** (sent after successful payment)
4. **Password Reset** (sent when user requests reset)
5. **Waiver Confirmation** (sent after waiver signing)

**Suppression Management:**

Configure suppression groups for different email types:
- Marketing emails (can unsubscribe)
- Transactional emails (cannot unsubscribe)
- Class reminders (can disable in settings)

### ElevenLabs Text-to-Speech

**Voice Selection:**

DojoFlow uses the following voice for Kai:
- **Voice ID:** `21m00Tcm4TlvDq8ikWAM` (Rachel - professional female voice)
- **Model:** `eleven_monolingual_v1`
- **Stability:** 0.5
- **Similarity Boost:** 0.75

**Usage Limits:**

Monitor your ElevenLabs quota:
- Free tier: 10,000 characters/month
- Starter: 30,000 characters/month
- Creator: 100,000 characters/month
- Pro: 500,000 characters/month

**Cost Optimization:**

To reduce TTS costs:
1. Cache generated audio files in S3 for 30 days
2. Reuse audio for identical messages
3. Limit voice responses to premium users only
4. Implement character count warnings in UI

### AWS S3 File Storage

**Bucket Structure:**

```
dojoflow-production/
├── org-{organizationId}/
│   ├── students/
│   │   ├── photos/
│   │   └── documents/
│   ├── staff/
│   │   └── photos/
│   ├── waivers/
│   │   └── signed-pdfs/
│   ├── merchandise/
│   │   └── product-images/
│   └── kai-audio/
│       └── tts-cache/
└── platform/
    └── logos/
```

**Lifecycle Policies:**

```json
{
  "Rules": [
    {
      "Id": "DeleteOldTTSCache",
      "Status": "Enabled",
      "Prefix": "org-*/kai-audio/tts-cache/",
      "Expiration": {
        "Days": 30
      }
    },
    {
      "Id": "TransitionOldDocuments",
      "Status": "Enabled",
      "Prefix": "org-*/students/documents/",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

**IAM Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::dojoflow-production",
        "arn:aws:s3:::dojoflow-production/*"
      ]
    }
  ]
}
```

---

## Application Deployment

### Build Process

**Step 1: Clone Repository**

```bash
# Clone from GitHub
git clone https://github.com/dojoflowus-debug/official-dojo-flow-crm.git dojoflow
cd dojoflow
```

**Step 2: Install Dependencies**

```bash
# Install Node.js dependencies
pnpm install --frozen-lockfile

# Verify installation
pnpm list --depth=0
```

**Step 3: Build Application**

```bash
# Set production environment
export NODE_ENV=production

# Build frontend assets
pnpm run build

# Verify build output
ls -lh dist/
```

**Build Output:**
- `dist/` - Frontend static assets (HTML, CSS, JS)
- `server/` - Backend Node.js application
- `drizzle/` - Database migrations

### Deployment Options

#### Option 1: Traditional Server Deployment

**Using PM2 Process Manager:**

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dojoflow',
    script: 'server/_core/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/dojoflow/error.log',
    out_file: '/var/log/dojoflow/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
```

**Nginx Reverse Proxy Configuration:**

```nginx
# /etc/nginx/sites-available/dojoflow.com

upstream dojoflow_backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    keepalive 64;
}

server {
    listen 80;
    server_name dojoflow.com www.dojoflow.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dojoflow.com www.dojoflow.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dojoflow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dojoflow.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/dojoflow_access.log;
    error_log /var/log/nginx/dojoflow_error.log;

    # Client upload size
    client_max_body_size 10M;

    # Static files
    location / {
        proxy_pass http://dojoflow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API endpoints (longer timeout)
    location /api/ {
        proxy_pass http://dojoflow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://dojoflow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

**Enable and Start Nginx:**

```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/dojoflow.com /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

#### Option 2: Docker Deployment

**Dockerfile:**

```dockerfile
# /home/ubuntu/dojoflow/Dockerfile

FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "--loader", "tsx", "server/_core/index.ts"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  dojoflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - dojoflow-network
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: dojoflow_prod
      MYSQL_USER: dojoflow_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
      - ./backups:/backups
    networks:
      - dojoflow-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - dojoflow-network
    depends_on:
      - dojoflow
    restart: unless-stopped

volumes:
  db-data:

networks:
  dojoflow-network:
    driver: bridge
```

**Deploy with Docker:**

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f dojoflow

# Check status
docker-compose ps

# Stop services
docker-compose down
```

#### Option 3: Manus Hosting (Recommended)

DojoFlow is designed to work seamlessly with Manus built-in hosting:

**Advantages:**
- Zero-configuration deployment
- Automatic SSL certificates
- Built-in CDN and edge caching
- Custom domain support
- Automatic backups
- One-click rollbacks

**Deployment Steps:**

1. Save a checkpoint in Manus UI
2. Click "Publish" button in Management UI header
3. Configure custom domain (optional) in Settings → Domains
4. Monitor deployment status in Dashboard panel

**Custom Domain Setup:**

1. Go to Settings → Domains in Management UI
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `app.dojoflow.com`)
4. Add CNAME record to your DNS:
   ```
   CNAME app.dojoflow.com → your-app.manus.space
   ```
5. Wait for SSL certificate provisioning (5-10 minutes)

---

## Security Configuration

### SSL/TLS Certificates

**Let's Encrypt with Certbot:**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dojoflow.com -d www.dojoflow.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Auto-renewal cron job (already installed by certbot)
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

**UFW (Uncomplicated Firewall):**

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming
sudo ufw default deny incoming

# Allow all outgoing
sudo ufw default allow outgoing

# Check status
sudo ufw status verbose
```

### Rate Limiting

**Nginx Rate Limiting:**

```nginx
# Add to http block in nginx.conf

# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/m;

# Apply to locations
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}

location /api/auth/ {
    limit_req zone=auth_limit burst=3 nodelay;
    # ... rest of config
}

location /api/upload {
    limit_req zone=upload_limit burst=1 nodelay;
    # ... rest of config
}
```

### Content Security Policy

**CSP Headers (add to Nginx):**

```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.stripe.com https://api.twilio.com https://api.sendgrid.com https://api.elevenlabs.io https://api.openai.com;
    frame-src 'self' https://js.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
" always;
```

### Database Security

**MySQL Security Hardening:**

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disallow root login remotely
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Reload privilege tables
FLUSH PRIVILEGES;

-- Enable SSL connections only
GRANT ALL PRIVILEGES ON dojoflow_prod.* TO 'dojoflow_user'@'%' REQUIRE SSL;
```

**Connection Encryption:**

Ensure your `DATABASE_URL` includes SSL parameters:
```
mysql://user:pass@host:3306/db?ssl={"rejectUnauthorized":true}
```

### Secrets Management

**Using Environment Variables (Production):**

Never commit `.env` files to version control. Use one of these methods:

**Option 1: System Environment Variables**
```bash
# /etc/environment (system-wide)
export DATABASE_URL="mysql://..."
export JWT_SECRET="..."
export STRIPE_SECRET_KEY="..."
```

**Option 2: Docker Secrets**
```yaml
# docker-compose.yml
services:
  dojoflow:
    secrets:
      - db_password
      - jwt_secret
      - stripe_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  stripe_key:
    file: ./secrets/stripe_key.txt
```

**Option 3: AWS Secrets Manager**
```bash
# Store secret
aws secretsmanager create-secret \
  --name dojoflow/production/database-url \
  --secret-string "mysql://..."

# Retrieve in application startup
aws secretsmanager get-secret-value \
  --secret-id dojoflow/production/database-url \
  --query SecretString --output text
```

### Security Checklist

- [ ] All environment variables use strong, random values
- [ ] JWT_SECRET is 64+ characters and cryptographically random
- [ ] Database uses SSL/TLS encryption
- [ ] All API keys are production keys (not test keys)
- [ ] Stripe webhook secret is configured
- [ ] CORS is configured to allow only your domain
- [ ] Rate limiting is enabled on all public endpoints
- [ ] CSP headers are configured
- [ ] HTTPS is enforced (no HTTP access)
- [ ] Firewall allows only necessary ports
- [ ] Database user has minimal required permissions
- [ ] Automated backups are enabled and tested
- [ ] Security headers are configured (HSTS, X-Frame-Options, etc.)
- [ ] File uploads are validated and size-limited
- [ ] SQL injection protection via parameterized queries (Drizzle ORM)
- [ ] XSS protection via React's built-in escaping
- [ ] Session cookies are httpOnly, secure, and sameSite=strict

---

## Multi-Tenant Architecture

DojoFlow implements a **shared database, shared schema** multi-tenancy model with organization-level isolation.

### Tenant Isolation Strategy

**Database Level:**
- All tables include `organizationId` column
- Queries automatically filtered by middleware
- Foreign key constraints enforce referential integrity within tenants

**Application Level:**
- Session includes `currentOrganizationId`
- `orgScopedProcedure` middleware enforces organization context
- `kioskProcedure` additionally enforces location binding

**File Storage Level:**
- S3 keys prefixed with `org-{organizationId}/`
- Pre-signed URLs include organization validation

### Organization Management

**Creating New Organization (Onboarding Flow):**

1. Owner signs up at `/owner` (email + password)
2. Email verification with OTP
3. Complete onboarding wizard:
   - School profile (name, address, timezone)
   - Select pricing plan
   - Workspace creation (automatic)
4. Organization created with initial credits
5. Owner redirected to dashboard

**Adding Users to Organization:**

```typescript
// Staff invitation flow
await trpc.organization.inviteStaff.mutate({
  email: 'instructor@example.com',
  role: 'instructor',
  locationId: 'loc-001'
});

// Student self-registration
await trpc.studentPortal.register.mutate({
  organizationId: 'org-001',
  email: 'student@example.com',
  name: 'John Doe',
  program: 'Kids Karate'
});
```

### Cross-Organization Access Prevention

**Middleware Enforcement:**

```typescript
// server/_core/trpc.ts

export const orgScopedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.currentOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No organization context'
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.currentOrganizationId
    }
  });
});
```

**Query Filtering:**

```typescript
// All queries automatically filtered
const students = await db.query.students.findMany({
  where: eq(students.organizationId, ctx.organizationId)
});
```

**Testing Isolation:**

```bash
# Create test script to verify isolation
cat > test-isolation.ts << 'EOF'
import { db } from './server/db';
import { students } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function testIsolation() {
  // Create student in org A
  const studentA = await db.insert(students).values({
    organizationId: 'org-a',
    firstName: 'Alice',
    email: 'alice@orga.com'
  });

  // Try to query from org B context
  const result = await db.query.students.findMany({
    where: eq(students.organizationId, 'org-b')
  });

  console.assert(result.length === 0, 'Isolation violated!');
  console.log('✓ Isolation test passed');
}

testIsolation();
EOF

tsx test-isolation.ts
```

### Platform Admin Access

Platform administrators have special `globalRole = 'platform_admin'` and can access all organizations:

**Platform Admin Routes:**
- `/admin` - Platform admin login
- `/admin/organizations` - List all organizations
- `/admin/organizations/:id` - Organization details
- `/admin/usage` - Platform-wide usage statistics

**Access Control:**

```typescript
export const platformAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.globalRole !== 'platform_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Platform admin access required'
    });
  }
  
  return next({ ctx });
});
```

---

## Monitoring & Observability

### Application Logging

**Log Levels:**
- **ERROR:** Application errors, exceptions, failed operations
- **WARN:** Deprecated features, unusual conditions, recoverable errors
- **INFO:** Startup messages, configuration, major state changes
- **DEBUG:** Detailed diagnostic information (development only)

**Log Format (JSON):**

```json
{
  "timestamp": "2024-12-23T10:30:45.123Z",
  "level": "INFO",
  "service": "dojoflow",
  "organizationId": "org-001",
  "userId": "user-123",
  "message": "Student enrolled in class",
  "metadata": {
    "studentId": "student-456",
    "classId": "class-789",
    "action": "enrollment"
  }
}
```

**Winston Logger Configuration:**

```typescript
// server/_core/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dojoflow' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/dojoflow/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/dojoflow/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-12-23T10:30:45.123Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "stripe": "healthy",
    "twilio": "healthy",
    "sendgrid": "healthy",
    "s3": "healthy"
  }
}
```

**Implementation:**

```typescript
// server/routers.ts
export const systemRouter = router({
  health: publicProcedure.query(async () => {
    const checks = {
      database: await checkDatabase(),
      stripe: await checkStripe(),
      twilio: await checkTwilio(),
      sendgrid: await checkSendgrid(),
      s3: await checkS3()
    };

    const allHealthy = Object.values(checks).every(c => c === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      checks
    };
  })
});
```

### Performance Monitoring

**Key Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | < 200ms | > 500ms |
| Database Query Time (p95) | < 100ms | > 300ms |
| Error Rate | < 0.1% | > 1% |
| CPU Usage | < 70% | > 85% |
| Memory Usage | < 80% | > 90% |
| Disk Usage | < 70% | > 85% |
| Active Sessions | N/A | Monitor trends |
| AI Credit Balance | > 100 | < 50 |

**PM2 Monitoring:**

```bash
# Real-time monitoring
pm2 monit

# List processes with metrics
pm2 list

# Show detailed metrics
pm2 show dojoflow

# Enable PM2 web dashboard
pm2 web
```

### Error Tracking

**Sentry Integration (Optional):**

```bash
# Install Sentry SDK
pnpm add @sentry/node @sentry/tracing
```

```typescript
// server/_core/sentry.ts
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});

export { Sentry };
```

### Database Monitoring

**Slow Query Log:**

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

**Query Performance Analysis:**

```bash
# Analyze slow queries
mysqldumpslow -s t -t 10 /var/log/mysql/slow-query.log

# Monitor active queries
mysql -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -e "
  SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
  FROM information_schema.TABLES
  WHERE table_schema = 'dojoflow_prod'
  ORDER BY (data_length + index_length) DESC;
"
```

---

## Backup & Disaster Recovery

### Backup Strategy

**3-2-1 Backup Rule:**
- **3** copies of data
- **2** different storage media
- **1** off-site backup

**Backup Schedule:**

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Database Full | Daily 2 AM | 30 days | S3 + Local |
| Database Incremental | Every 6 hours | 7 days | S3 |
| File Storage (S3) | Continuous | 90 days | S3 Versioning |
| Application Code | On commit | Indefinite | GitHub |
| Configuration | Weekly | 90 days | S3 + Git |

### Automated Backup Script

```bash
#!/bin/bash
# /opt/dojoflow/scripts/full-backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/dojoflow"
S3_BUCKET="s3://dojoflow-backups"

echo "Starting full backup at $TIMESTAMP"

# 1. Database backup
echo "Backing up database..."
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  dojoflow_prod | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# 2. Application files
echo "Backing up application files..."
tar -czf $BACKUP_DIR/app_$TIMESTAMP.tar.gz \
  /opt/dojoflow \
  --exclude=/opt/dojoflow/node_modules \
  --exclude=/opt/dojoflow/dist

# 3. Configuration files
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz \
  /etc/nginx/sites-available/dojoflow.com \
  /opt/dojoflow/.env \
  /opt/dojoflow/ecosystem.config.js

# 4. Upload to S3
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR $S3_BUCKET/$(date +%Y/%m/%d)/

# 5. Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# 6. Verify backup integrity
echo "Verifying backup integrity..."
gunzip -t $BACKUP_DIR/db_$TIMESTAMP.sql.gz
tar -tzf $BACKUP_DIR/app_$TIMESTAMP.tar.gz > /dev/null

echo "Backup completed successfully at $(date)"

# 7. Send notification
curl -X POST https://dojoflow.com/api/internal/backup-notification \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"success\", \"timestamp\": \"$TIMESTAMP\"}"
```

### Disaster Recovery Procedures

**Scenario 1: Database Corruption**

```bash
# 1. Stop application
pm2 stop dojoflow

# 2. Download latest backup from S3
aws s3 cp s3://dojoflow-backups/2024/12/23/db_20241223_020000.sql.gz .

# 3. Restore database
gunzip < db_20241223_020000.sql.gz | mysql -h $DB_HOST -u $DB_USER -p dojoflow_prod

# 4. Verify data integrity
mysql -h $DB_HOST -u $DB_USER -p dojoflow_prod -e "
  SELECT COUNT(*) FROM organizations;
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM students;
"

# 5. Restart application
pm2 start dojoflow

# 6. Verify application health
curl https://dojoflow.com/api/health
```

**Scenario 2: Complete Server Failure**

```bash
# 1. Provision new server
# 2. Install dependencies (Node.js, MySQL, Nginx, PM2)
# 3. Clone repository
git clone https://github.com/dojoflowus-debug/official-dojo-flow-crm.git dojoflow
cd dojoflow

# 4. Restore configuration
aws s3 cp s3://dojoflow-backups/latest/config.tar.gz .
tar -xzf config.tar.gz -C /

# 5. Restore database
aws s3 cp s3://dojoflow-backups/latest/db.sql.gz .
gunzip < db.sql.gz | mysql -h $DB_HOST -u $DB_USER -p dojoflow_prod

# 6. Install and build application
pnpm install --frozen-lockfile
pnpm run build

# 7. Start application
pm2 start ecosystem.config.js

# 8. Update DNS (if IP changed)
# Point dojoflow.com A record to new server IP

# 9. Verify SSL certificate
sudo certbot --nginx -d dojoflow.com -d www.dojoflow.com

# 10. Monitor logs
pm2 logs dojoflow
```

**Recovery Time Objective (RTO):** 2 hours  
**Recovery Point Objective (RPO):** 6 hours

### Backup Verification

**Monthly Backup Test:**

```bash
#!/bin/bash
# /opt/dojoflow/scripts/test-backup.sh

# 1. Create test database
mysql -e "CREATE DATABASE dojoflow_test;"

# 2. Restore latest backup to test database
LATEST_BACKUP=$(aws s3 ls s3://dojoflow-backups/ --recursive | sort | tail -n 1 | awk '{print $4}')
aws s3 cp s3://dojoflow-backups/$LATEST_BACKUP - | gunzip | mysql dojoflow_test

# 3. Verify table counts
PROD_COUNT=$(mysql dojoflow_prod -e "SELECT COUNT(*) FROM students;" -sN)
TEST_COUNT=$(mysql dojoflow_test -e "SELECT COUNT(*) FROM students;" -sN)

if [ "$PROD_COUNT" -eq "$TEST_COUNT" ]; then
  echo "✓ Backup verification passed"
else
  echo "✗ Backup verification failed: count mismatch"
  exit 1
fi

# 4. Cleanup
mysql -e "DROP DATABASE dojoflow_test;"
```

---

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration (Nginx):**

```nginx
upstream dojoflow_cluster {
    least_conn;
    server app1.internal:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app2.internal:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app3.internal:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name dojoflow.com;

    location / {
        proxy_pass http://dojoflow_cluster;
        proxy_next_upstream error timeout http_500 http_502 http_503;
        # ... rest of proxy config
    }
}
```

**Session Persistence:**

DojoFlow uses JWT tokens stored in cookies, so sessions are stateless and work across multiple servers without sticky sessions.

### Vertical Scaling

**Resource Limits (PM2):**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dojoflow',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '2G', // Restart if memory exceeds 2GB
    node_args: '--max-old-space-size=2048'
  }]
};
```

### Database Scaling

**Read Replicas:**

```bash
# Configure read replica in DATABASE_URL
DATABASE_URL=mysql://user:pass@primary.db.com:3306/dojoflow_prod
DATABASE_READ_URL=mysql://user:pass@replica.db.com:3306/dojoflow_prod
```

**Connection Pooling:**

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const db = drizzle(poolConnection);
```

### Caching Strategy

**Redis Cache (Optional):**

```bash
# Install Redis
sudo apt-get install redis-server

# Install Redis client
pnpm add ioredis
```

```typescript
// server/_core/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'dojoflow:'
});

export async function getCached<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

**Cache Invalidation:**

```typescript
// Invalidate cache on data changes
export const studentsRouter = router({
  update: orgScopedProcedure
    .input(z.object({ id: z.string(), data: z.object({}) }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.update(students).set(input.data).where(eq(students.id, input.id));
      
      // Invalidate cache
      await redis.del(`student:${input.id}`);
      await redis.del(`students:org:${ctx.organizationId}`);
      
      return result;
    })
});
```

### CDN Configuration

**CloudFront Distribution (for S3 assets):**

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name dojoflow-production.s3.amazonaws.com \
  --default-root-object index.html \
  --comment "DojoFlow Static Assets"

# Invalidate cache after deployment
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Performance Optimization

**Database Indexing:**

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_students_org_status ON students(organizationId, status);
CREATE INDEX idx_classes_org_day ON classes(organizationId, dayOfWeek);
CREATE INDEX idx_enrollments_student ON class_enrollments(studentId);
CREATE INDEX idx_kai_messages_conv ON kai_messages(conversationId, createdAt);

-- Composite indexes for complex queries
CREATE INDEX idx_students_search ON students(organizationId, firstName, lastName, email);
CREATE INDEX idx_leads_pipeline ON leads(organizationId, stage, createdAt);
```

**Query Optimization:**

```typescript
// Bad: N+1 query problem
const students = await db.query.students.findMany();
for (const student of students) {
  const enrollments = await db.query.class_enrollments.findMany({
    where: eq(class_enrollments.studentId, student.id)
  });
}

// Good: Single query with join
const students = await db.query.students.findMany({
  with: {
    enrollments: {
      with: {
        class: true
      }
    }
  }
});
```

---

## Troubleshooting Guide

### Common Issues

#### Issue 1: Database Connection Timeout

**Symptoms:**
- Error: `Error: connect ETIMEDOUT`
- Application fails to start
- Health check shows database as unhealthy

**Diagnosis:**
```bash
# Test database connectivity
mysql -h $DB_HOST -u $DB_USER -p -e "SELECT 1;"

# Check firewall rules
sudo ufw status

# Verify DATABASE_URL format
echo $DATABASE_URL
```

**Solutions:**
1. Verify database server is running
2. Check firewall allows port 3306
3. Verify credentials in DATABASE_URL
4. Enable SSL if required by database
5. Increase connection timeout in pool config

#### Issue 2: Stripe Webhook Signature Verification Failed

**Symptoms:**
- Error: `Webhook signature verification failed`
- Subscriptions not activating
- Credits not allocated

**Diagnosis:**
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook endpoint
curl -X POST https://dojoflow.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "ping"}'
```

**Solutions:**
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
2. Ensure webhook endpoint is publicly accessible
3. Check Nginx is not modifying request body
4. Verify Stripe CLI is forwarding to correct URL
5. Check application logs for detailed error message

#### Issue 3: S3 Upload Permission Denied

**Symptoms:**
- Error: `Access Denied` when uploading files
- Student photos not saving
- Waiver PDFs not generated

**Diagnosis:**
```bash
# Test S3 access
aws s3 ls s3://dojoflow-production/

# Verify credentials
aws sts get-caller-identity

# Test upload
echo "test" | aws s3 cp - s3://dojoflow-production/test.txt
```

**Solutions:**
1. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
2. Check IAM policy allows s3:PutObject
3. Verify bucket name in environment variables
4. Check bucket CORS policy allows your domain
5. Ensure bucket region matches AWS_REGION

#### Issue 4: Kai Not Responding

**Symptoms:**
- Chat messages sent but no response
- Loading indicator stuck
- Error: `Insufficient credits`

**Diagnosis:**
```bash
# Check credit balance
curl https://dojoflow.com/api/trpc/credits.getBalance

# Check LLM API key
echo $OPENAI_API_KEY

# Test LLM connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Solutions:**
1. Verify organization has sufficient AI credits
2. Check OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY is valid
3. Verify LLM API endpoint is accessible
4. Check application logs for detailed error
5. Ensure conversation exists in database

#### Issue 5: Email Not Sending

**Symptoms:**
- Welcome emails not received
- Class reminders not sent
- Error: `SendGrid API error`

**Diagnosis:**
```bash
# Test SendGrid API
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@dojoflow.com"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'

# Check SendGrid dashboard for bounces
```

**Solutions:**
1. Verify SENDGRID_API_KEY is valid
2. Check sender email is verified in SendGrid
3. Verify domain authentication (SPF, DKIM)
4. Check recipient email is not on suppression list
5. Ensure email templates exist if using template IDs

### Debug Mode

**Enable Verbose Logging:**

```bash
# Set environment variable
export DEBUG=dojoflow:*
export LOG_LEVEL=debug

# Restart application
pm2 restart dojoflow

# Tail logs
pm2 logs dojoflow --lines 100
```

**Database Query Logging:**

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';

export const db = drizzle(poolConnection, {
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery(query, params) {
      console.log('Query:', query);
      console.log('Params:', params);
    }
  } : undefined
});
```

### Performance Profiling

**Node.js CPU Profiling:**

```bash
# Generate CPU profile
node --prof server/_core/index.ts

# Process profile
node --prof-process isolate-0x*.log > profile.txt

# Analyze profile.txt for bottlenecks
```

**Memory Leak Detection:**

```bash
# Install clinic.js
npm install -g clinic

# Run memory profiling
clinic doctor -- node server/_core/index.ts

# Open generated HTML report
```

---

## Post-Deployment Checklist

### Pre-Launch Verification

- [ ] All environment variables configured and validated
- [ ] Database migrations applied successfully
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall rules configured (allow 80, 443, deny all others)
- [ ] Nginx reverse proxy configured and tested
- [ ] PM2 process manager running with auto-restart
- [ ] Health check endpoint returning 200 OK
- [ ] Stripe webhook endpoint verified
- [ ] Twilio phone number configured with webhooks
- [ ] SendGrid domain authentication completed
- [ ] S3 bucket accessible with correct permissions
- [ ] Backup script scheduled and tested
- [ ] Monitoring and alerting configured
- [ ] DNS records configured and propagated
- [ ] Custom domain pointing to server
- [ ] Rate limiting enabled on all public endpoints
- [ ] Security headers configured (CSP, HSTS, etc.)

### Functional Testing

- [ ] Owner can sign up and complete onboarding
- [ ] Staff can login and access dashboard
- [ ] Students can register and access portal
- [ ] Kiosk check-in flow works at physical location
- [ ] Kai chat responds to queries
- [ ] Voice output plays correctly
- [ ] File uploads work (photos, documents, waivers)
- [ ] Class scheduling and enrollment works
- [ ] Billing and Stripe checkout works
- [ ] SMS notifications send successfully
- [ ] Email notifications send successfully
- [ ] Merchandise fulfillment tracking works
- [ ] Floor plan visualization renders correctly
- [ ] Lead pipeline and scoring works
- [ ] Platform admin can access all organizations

### Performance Testing

- [ ] API response times < 200ms (p95)
- [ ] Database queries < 100ms (p95)
- [ ] Page load times < 2 seconds
- [ ] No memory leaks after 24 hours
- [ ] CPU usage < 70% under normal load
- [ ] Concurrent user load test passed (100+ users)
- [ ] File upload speed acceptable (< 5s for 5MB)
- [ ] Search and filtering responsive (< 500ms)

### Security Audit

- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] Rate limiting tested and working
- [ ] Authentication tokens expire correctly
- [ ] Password reset flow secure
- [ ] File upload validation working
- [ ] Organization isolation verified
- [ ] Secrets not exposed in client code
- [ ] HTTPS enforced (no HTTP access)
- [ ] Security headers present in responses
- [ ] Third-party API keys not logged

### Documentation

- [ ] Deployment runbook created
- [ ] Backup and restore procedures documented
- [ ] Incident response plan created
- [ ] On-call rotation established
- [ ] Monitoring dashboard configured
- [ ] Admin credentials securely stored
- [ ] API documentation generated
- [ ] User guides published
- [ ] Training materials created for staff

### Go-Live

- [ ] Announce maintenance window to users
- [ ] Final backup before go-live
- [ ] Deploy to production
- [ ] Verify all services healthy
- [ ] Monitor error rates for 1 hour
- [ ] Announce successful launch
- [ ] Monitor for 24 hours
- [ ] Conduct post-launch retrospective

---

## Appendix

### Environment Variables Reference

Complete list of all environment variables:

```bash
# Core Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
VITE_APP_URL=https://dojoflow.com
VITE_APP_TITLE=DojoFlow
VITE_APP_LOGO=/logo-dark.png

# Database
DATABASE_URL=mysql://user:pass@host:3306/db?ssl={"rejectUnauthorized":true}
DB_POOL_MIN=5
DB_POOL_MAX=20

# Authentication
JWT_SECRET=64_char_random_secret
SESSION_COOKIE_NAME=dojoflow_session
SESSION_MAX_AGE=2592000000
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# OAuth (Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your_app_id
OWNER_OPEN_ID=owner_id
OWNER_NAME=Owner Name

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
TWILIO_VERIFY_SERVICE_SID=VAxxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@dojoflow.com
SENDGRID_FROM_NAME=DojoFlow

# ElevenLabs
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# OpenAI / LLM
OPENAI_API_KEY=sk-proj-xxx
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=xxx
VITE_FRONTEND_FORGE_API_KEY=xxx
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# AWS S3
AWS_ACCESS_KEY_ID=AKIAxxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=dojoflow-production

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaxxx

# Analytics
VITE_ANALYTICS_WEBSITE_ID=xxx
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com

# Logging
LOG_LEVEL=info
DEBUG=dojoflow:*

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=xxx

# Sentry (Optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Support Resources

**Official Documentation:**
- GitHub Repository: https://github.com/dojoflowus-debug/official-dojo-flow-crm
- Issue Tracker: https://github.com/dojoflowus-debug/official-dojo-flow-crm/issues

**Third-Party Documentation:**
- Stripe API: https://stripe.com/docs/api
- Twilio API: https://www.twilio.com/docs
- SendGrid API: https://docs.sendgrid.com
- ElevenLabs API: https://elevenlabs.io/docs
- OpenAI API: https://platform.openai.com/docs
- Drizzle ORM: https://orm.drizzle.team/docs
- tRPC: https://trpc.io/docs

**Community Support:**
- Discord: [Create community server]
- Stack Overflow: Tag `dojoflow`

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2024  
**Maintained By:** DojoFlow Engineering Team

For questions or issues with this deployment guide, please open an issue on GitHub or contact support@dojoflow.com.
