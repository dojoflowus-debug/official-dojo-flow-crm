# Credit Deduction Integration Guide

This guide documents how credit deduction has been integrated into DojoFlow CRM routers for SMS, email, and call operations.

## Overview

Credit consumption tracking has been implemented with the following components:

1. **creditConsumptionService.ts** - Core service for credit management
2. **conversationsIntegration.ts** - Helper functions for SMS/Email/Call operations
3. **conversationsRouter.ts** - SMS message sending with credit deduction
4. **automationRouter.ts** - Automation sequences with credit deduction

## Credit Costs

| Operation | Cost | Notes |
|-----------|------|-------|
| AI Chat (Kai) | 1 credit | Per message |
| SMS | 1 credit | Per SMS message |
| Email | 2 credits | Per email |
| Phone Call | 10 credits | Per minute |
| Automation | 1 credit | Per SMS in sequence |
| Data Analysis | 5 credits | Per analysis |

## Integration Points

### 1. SMS Sending (conversationsRouter.ts)

**Location:** `conversationsRouter.ts` - `sendMessage` mutation (lines 118-208)

**Implementation:**
- Added `organizationId` parameter to input schema
- Pre-check: Validates sufficient credit balance before sending
- Post-send: Deducts 1 credit after successful SMS
- Includes metadata logging for audit trail

**Usage:**
```typescript
await trpc.conversations.sendMessage.mutate({
  conversationId: 123,
  content: "Hello, this is a test SMS",
  organizationId: 1, // Required for credit deduction
});
```

**Response:**
```typescript
{
  id: 456, // Message ID
  // Credits deducted automatically if organizationId provided
}
```

### 2. Email Sending (automationRouter.ts)

**Location:** `automationRouter.ts` - `sendNow` mutation (lines 299-382)

**Implementation:**
- Added `organizationId` parameter to input schema
- Pre-check: Calculates total credits needed (SMS + Email) before execution
- Per-operation: Deducts credits immediately after each email send
- Includes sequence tracking and step metadata

**Usage:**
```typescript
await trpc.automation.sendNow.mutate({
  sequenceId: 1,
  enrolledType: "lead",
  enrolledId: 5,
  organizationId: 1, // Required for credit deduction
});
```

**Response:**
```typescript
{
  success: true,
  message: "Successfully sent 2 messages immediately",
  sentCount: 2,
  creditsDeducted: 3, // 1 SMS + 2 Email
}
```

### 3. AI Chat (routers.ts)

**Location:** `routers.ts` - `kai.chat` mutation (lines 3891-3966)

**Status:** ✅ Already integrated

**Implementation:**
- Pre-check: Validates sufficient balance before chat
- Post-response: Deducts 1 credit after successful response
- Includes message metadata and function call tracking

## Credit Balance Checks

All operations perform a pre-check using `checkSufficientBalance()`:

```typescript
const { checkSufficientBalance, CREDIT_COSTS } = await import("./services/creditConsumptionService");
const balanceCheck = await checkSufficientBalance(organizationId, CREDIT_COSTS.SMS);

if (!balanceCheck.sufficient) {
  throw new Error(balanceCheck.message || "Insufficient credits");
}
```

### Alert Levels

- **None** (✅): Balance > 50 credits
- **Warning** (⚠️): Balance 10-50 credits
- **Critical** (🚨): Balance < 10 credits
- **Blocked** (🚫): Balance = 0 credits

## Credit Deduction Process

1. **Pre-Check:** Verify sufficient balance
2. **Operation:** Execute SMS/Email/Call
3. **Deduction:** Subtract credits from balance
4. **Logging:** Record transaction with metadata
5. **Alert:** Trigger alert if balance is low

```typescript
const deductResult = await deductCredits({
  organizationId,
  amount: CREDIT_COSTS.SMS,
  taskType: 'ai_sms',
  description: `SMS to ${phone}: "${message}"`,
  metadata: {
    recipientPhone: phone,
    messageLength: message.length,
    conversationId: convId,
  },
});
```

## Error Handling

### Insufficient Credits

```
Error: Insufficient credits. Required: 1, Available: 0. Please top up your credits.
```

### Low Balance Warning

```
Warning: Low credit balance. 5 credits remaining after this operation.
```

### Failed Deduction

If deduction fails after operation succeeds:
- Message is still sent
- Error is logged
- Manual review recommended
- Refund may be needed

## Testing

### Unit Tests

Located in `server/__tests__/creditConsumption.test.ts`:
- Credit cost calculations
- Balance checking logic
- Alert level detection
- Mixed operation scenarios
- Credit exhaustion handling

### Integration Tests

Test credit deduction in routers:

```typescript
// Test SMS with credit deduction
const result = await trpc.conversations.sendMessage.mutate({
  conversationId: 1,
  content: "Test message",
  organizationId: 1,
});

// Verify credits were deducted
const balance = await trpc.credits.getBalance.query({ organizationId: 1 });
expect(balance.creditsRemaining).toBeLessThan(initialBalance);
```

## Frontend Integration

### CreditBalanceMonitor Component

Display real-time credit balance:

```typescript
<CreditBalanceMonitor 
  organizationId={1}
  showDetails={true}
  compact={false}
/>
```

**Features:**
- Real-time balance updates (every 30 seconds)
- Color-coded alert levels
- Progress bar showing usage
- Detailed statistics view

### Usage in Operations

Before allowing SMS/Email sending:

```typescript
const { data: balance } = trpc.credits.getBalance.useQuery({ organizationId });

if (balance.creditsRemaining === 0) {
  // Show purchase credits modal
  return <CreditPurchaseModal isOpen={true} />;
}
```

## Database Schema

### aiCreditBalance Table

```sql
CREATE TABLE aiCreditBalance (
  organizationId INT PRIMARY KEY,
  balance INT,
  periodAllowance INT,
  periodUsed INT,
  totalPurchased INT,
  totalUsed INT,
  lowCreditThreshold INT,
  lowCreditAlertSent INT,
  lastResetAt DATETIME,
  nextResetAt DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### aiCreditTransactions Table

```sql
CREATE TABLE aiCreditTransactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organizationId INT,
  type ENUM('deduction', 'purchase', 'allocation', 'refund', 'bonus'),
  amount INT,
  taskType VARCHAR(50),
  description TEXT,
  metadata JSON,
  balanceAfter INT,
  createdAt DATETIME,
  FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
```

## Future Enhancements

1. **Batch Operations** - Deduct credits for bulk SMS/Email sends
2. **Scheduled Operations** - Handle credit deduction for scheduled messages
3. **Refund System** - Automatic refunds for failed operations
4. **Usage Analytics** - Dashboard showing credit consumption trends
5. **Rate Limiting** - Prevent credit exhaustion through rate limiting
6. **Credit Packages** - Different credit packages for different operation types

## Troubleshooting

### Credits not deducting

1. Check `organizationId` is provided in mutation input
2. Verify organization exists in `aiCreditBalance` table
3. Check database connection in logs
4. Review error logs for deduction failures

### Insufficient credits error

1. Verify balance is sufficient for operation
2. Check alert level thresholds
3. Prompt user to purchase credits
4. Show CreditPurchaseModal

### Balance not updating

1. Refresh page or wait 30 seconds for auto-refresh
2. Check database for transaction records
3. Verify TRPC query is working
4. Check browser console for errors

## API Reference

### checkSufficientBalance

```typescript
const result = await checkSufficientBalance(organizationId, requiredCredits);
// Returns: { sufficient, currentBalance, alertLevel, message? }
```

### deductCredits

```typescript
const result = await deductCredits({
  organizationId,
  amount,
  taskType,
  description,
  metadata?,
});
// Returns: { success, newBalance, transactionId?, alertLevel, message?, error? }
```

### addCredits

```typescript
const result = await addCredits({
  organizationId,
  amount,
  source, // 'subscription' | 'top_up' | 'refund' | 'bonus'
  description,
  metadata?,
});
// Returns: { success, newBalance, transactionId?, error? }
```

### getCreditBalance

```typescript
const balance = await getCreditBalance(organizationId);
// Returns: { creditsRemaining, creditsUsed, planAllowance, renewalDate, alertLevel }
```

## Support

For issues or questions about credit integration:
1. Check this guide
2. Review test files for examples
3. Check server logs for errors
4. Contact development team
