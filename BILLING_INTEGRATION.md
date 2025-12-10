# Billing Integration System

## Overview

This document describes the comprehensive billing integration system implemented for DojoFlow Kiosk, supporting both **Stripe** and **PC Bancard** payment processors.

## Features

### Payment Processor Options

1. **Stripe** (Recommended)
   - Quick 5-minute setup
   - Accepts all major credit cards (Visa, Mastercard, Amex, Discover)
   - Transparent pricing: 2.9% + $0.30 per transaction
   - No monthly fees or minimums
   - Instant activation
   - Test mode available with card: 4242 4242 4242 4242

2. **PC Bancard**
   - Traditional merchant account with competitive rates
   - Dedicated account representative: Randy Sinclair (682-218-1669)
   - Requires document submission
   - Processing time: 2-3 business days

## Database Schema

### Tables Created

1. **billing_applications** - Stores merchant account applications
   - Provider (pcbancard/stripe)
   - Status (draft/submitted/under_review/approved/rejected/requires_info)
   - Business information fields
   - Contact information
   - Operational details

2. **billing_documents** - Stores S3 URLs for uploaded documents
   - Application ID reference
   - Document type (drivers_license/voided_check/state_ein/address_verification/bank_letter)
   - S3 storage information
   - Verification status

3. **payment_methods** - Tracks configured payment processors
   - Provider information
   - API credentials (encrypted)
   - Active/primary status
   - Transaction fee configuration

4. **billing_transactions** - Records all payment transactions
   - Transaction identification
   - Customer information
   - Amount and currency
   - Payment status
   - Card details (last 4, brand)

## PC Bancard Application Requirements

### Required Documents

1. **Driver's License**
   - Copy of business owner's driver's license

2. **Voided Check**
   - Must match bank account on application
   - Shows account number and routing number

3. **State EIN #**
   - Copy of state Employer Identification Number

4. **Business Address Verification**
   - Document proving business address matches application

5. **Bank Letter**
   - Letter from bank stating account is in good standing
   - Must be in company's name
   - Must show account # and routing # matching application and voided check

### Important Notes

- Business address must match application
- Bank account information must match across all documents
- Processing time: 2-3 business days after submission

## User Flows

### Setup Payment Processor

1. Navigate to `/billing`
2. Click "Setup Payment Processor" if none configured
3. Choose between Stripe or PC Bancard at `/billing/setup`

### Stripe Setup

1. Click "Setup Stripe" from payment options
2. Navigate to `/billing/stripe-setup`
3. Click "Connect Stripe Account"
4. Complete Stripe verification (handled by Stripe)
5. Start accepting payments immediately

### PC Bancard Application

1. Click "Apply for PC Bancard" from payment options
2. Navigate to `/billing/pcbancard-application`
3. Fill out application form:
   - Business information
   - Contact information (owner and manager)
   - Operational details
   - Special instructions
4. Upload all 5 required documents
5. Submit application
6. Wait 2-3 business days for processing
7. Check application status at `/billing/applications`

### View Applications

1. Navigate to `/billing/applications`
2. View all submitted applications with status
3. Track processing progress
4. Click on application to view details

## API Endpoints (tRPC)

### Billing Router

- `createPCBancardApplication` - Create new PC Bancard application
- `uploadDocument` - Upload document to S3
- `submitApplication` - Submit application for review
- `getApplications` - Get all applications for current user
- `getApplication` - Get application by ID with documents
- `getPaymentMethods` - Get all configured payment methods
- `getActivePaymentMethod` - Get currently active payment method
- `createPaymentMethod` - Add new payment method
- `getTransactions` - Get recent transactions
- `createTransaction` - Record new transaction

## File Structure

### Frontend Pages

- `/client/src/pages/Billing.tsx` - Main billing dashboard
- `/client/src/pages/BillingSetup.tsx` - Payment processor selection
- `/client/src/pages/PCBancardApplication.tsx` - PC Bancard application form
- `/client/src/pages/StripeSetup.tsx` - Stripe setup page
- `/client/src/pages/BillingApplications.tsx` - Application list and status

### Backend

- `/server/billingRouter.ts` - Billing API endpoints
- `/drizzle/schema.ts` - Database schema definitions

### Assets

- `/client/public/logos/stripe.svg` - Stripe logo
- `/client/public/logos/pcbancard.jpg` - PC Bancard logo

## Routes

- `/billing` - Main billing dashboard
- `/billing/setup` - Payment processor selection
- `/billing/pcbancard-application` - PC Bancard application form
- `/billing/stripe-setup` - Stripe setup page
- `/billing/applications` - Application list and status

## Environment Variables

### Stripe (Automatically Configured)

- `STRIPE_SECRET_KEY` - Stripe API secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (frontend)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Database

- `DATABASE_URL` - MySQL database connection string

## Testing

### Stripe Test Mode

- Use test card: `4242 4242 4242 4242`
- Any future expiration date
- Any 3-digit CVC
- Test payments immediately without verification

### PC Bancard Testing

- Submit test application with sample documents
- Check application status at `/billing/applications`
- Verify document uploads to S3

## Security Considerations

1. **Document Storage**
   - All documents uploaded to S3
   - S3 URLs stored in database
   - File validation on upload

2. **API Credentials**
   - Payment method credentials stored encrypted
   - Never expose API keys to frontend
   - Use environment variables for sensitive data

3. **User Authentication**
   - Applications linked to user accounts
   - Only authenticated users can submit applications
   - Users can only view their own applications

## Future Enhancements

1. **Document Verification Workflow**
   - Admin panel for reviewing documents
   - Approve/reject documents
   - Request additional information

2. **Stripe Payment Processing**
   - Implement Stripe Checkout Sessions
   - Handle webhook events
   - Process subscription payments

3. **Transaction Management**
   - Real-time transaction tracking
   - Refund processing
   - Invoice generation

4. **Reporting**
   - Revenue reports
   - Transaction history
   - Payment method performance

## Support

For issues with:
- **Stripe**: Check Settings → Payment in management UI
- **PC Bancard**: Contact Randy Sinclair at 682-218-1669
- **Technical Issues**: Review Stripe Dashboard → Developers → Webhooks

## Stripe Sandbox Claim

⚠️ **Important**: Stripe test sandbox must be claimed before 2026-01-17T04:30:25.000Z

Claim URL: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU1VlS3hBZHloSHlOU25KLDE3NjQwNDUwMjUv1003hxPrHQg
