# Student Deletion System Documentation

## Overview

The Student Deletion System is a secure, multi-step approval workflow that prevents accidental or unauthorized student deletions. No one can delete a student instantly—all deletions require owner approval with comprehensive audit logging.

## Key Features

### 1. Permission-Based Access Control

**Permission Constants:**
- `students.delete.request` - Can request student deletion
- `students.delete.approve` - Can approve deletion requests
- `students.delete.execute` - Can execute approved deletions (Owner only)
- `students.delete.viewRequests` - Can view deletion requests

**Default Role Permissions:**
- **Instructor**: No deletion permissions
- **Manager**: Can request deletion and view requests
- **Owner**: Full deletion permissions (request, approve, execute)

### 2. Multi-Step Deletion Workflow

#### Step 1: Request Submission (Staff)
1. Staff member clicks "Request Deletion" in student profile Danger Zone
2. Confirmation modal shows student name and payment status
3. If paying member, payment warning modal displays billing implications
4. Staff enters deletion reason (minimum 10 characters)
5. Staff re-enters password for security verification
6. System creates `student_deletion_requests` record with status `pending`
7. Audit log entry: `DELETE_REQUESTED`

#### Step 2: Owner Review
1. Owner navigates to Settings → Admin → Deletion Requests
2. Views all pending deletion requests with:
   - Student name and ID
   - Requested by (staff member)
   - Deletion reason
   - Payment status
   - Request date
3. Owner can approve or deny each request

#### Step 3: Approval with Billing Decision (if paying member)
1. Owner clicks "Approve" on a pending request
2. If student is paying member, billing decision modal appears:
   - **Option A**: Cancel subscription (billing stops immediately)
   - **Option B**: Keep subscription active (revoke access, continue billing)
   - **Option C**: Abort deletion (cancel entirely)
3. Owner re-enters password to confirm
4. System performs soft delete:
   - Sets `students.deletedAt` timestamp
   - Sets `students.deletedByUserId`
   - Sets `students.deletionRequestId`
5. Updates request status to `executed`
6. Audit log entries: `DELETE_APPROVED`, `DELETE_EXECUTED`

#### Step 4: Denial (Optional)
1. Owner can deny any pending request
2. Optional reason for denial
3. Request status changes to `denied`
4. Audit log entry: `DELETE_DENIED`

### 3. Security Features

#### Password Re-authentication
- All sensitive actions require password re-entry
- Protects against unauthorized access to unattended computers
- Uses bcrypt for secure password comparison

#### Audit Logging
Complete audit trail for compliance:
- `DELETE_REQUESTED` - Staff requests deletion
- `DELETE_APPROVED` - Owner approves deletion
- `DELETE_DENIED` - Owner denies deletion
- `DELETE_EXECUTED` - Student is soft-deleted
- `DELETE_ANONYMIZED` - Personal data anonymized (24h after deletion)

Each audit log includes:
- Actor (user who performed action)
- Student affected
- Organization context
- Timestamp
- Detailed description
- Metadata (billing decisions, etc.)

#### Soft Deletion
- Students are never hard-deleted
- `deletedAt` timestamp marks deletion time
- `deletedByUserId` tracks who deleted
- `deletionRequestId` links to approval record
- Soft-deleted students excluded from normal queries
- Data preserved for compliance and recovery

### 4. Billing Considerations

**For Paying Members:**
- Deletion request shows warning about active subscription
- Owner must choose billing action before deletion executes
- Three options:
  1. **Cancel Subscription** - Immediate billing stop
  2. **Keep Active** - Access revoked but billing continues
  3. **Abort** - Cancel deletion entirely

**For Non-Paying Members:**
- Deletion proceeds directly to password verification
- No billing decision required

## Database Schema

### student_deletion_requests Table
```sql
CREATE TABLE student_deletion_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orgId INT NOT NULL,
  studentId INT NOT NULL,
  requestedByUserId INT NOT NULL,
  approvedByUserId INT,
  status ENUM('pending','approved','denied','executed','expired'),
  reason TEXT NOT NULL,
  isPayingMemberAtRequestTime INT DEFAULT 0,
  billingDecision ENUM('cancel_subscription','keep_active','abort'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_student (orgId, studentId),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);
```

### audit_logs Table
```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orgId INT NOT NULL,
  actorUserId INT NOT NULL,
  actorName VARCHAR(255),
  eventType ENUM('DELETE_REQUESTED','DELETE_APPROVED','DELETE_DENIED','DELETE_EXECUTED','DELETE_ANONYMIZED'),
  studentId INT,
  studentName VARCHAR(255),
  deletionRequestId INT,
  description TEXT,
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_org_event (orgId, eventType),
  INDEX idx_student (studentId),
  INDEX idx_created (createdAt)
);
```

### students Table Extensions
```sql
ALTER TABLE students ADD COLUMN deletedAt TIMESTAMP;
ALTER TABLE students ADD COLUMN deletedByUserId INT;
ALTER TABLE students ADD COLUMN deletionRequestId INT;
```

## TRPC Endpoints

### students.requestDeletion
**Method**: Mutation
**Required Permission**: `students.delete.request`
**Input**:
```typescript
{
  studentId: number;
  reason: string; // min 10 characters
  password: string;
}
```
**Output**:
```typescript
{
  success: boolean;
  requestId: number;
  message: string;
}
```

### students.listDeletionRequests
**Method**: Query
**Required Permission**: `students.delete.viewRequests`
**Input**:
```typescript
{
  status?: 'pending' | 'approved' | 'denied' | 'executed' | 'expired';
}
```
**Output**: Array of deletion requests with student info

### students.approveDeletion
**Method**: Mutation
**Required Permission**: `students.delete.approve`
**Input**:
```typescript
{
  requestId: number;
  password: string;
  billingDecision: 'cancel_subscription' | 'keep_active' | 'abort';
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

### students.denyDeletion
**Method**: Mutation
**Required Permission**: `students.delete.approve`
**Input**:
```typescript
{
  requestId: number;
  reason?: string;
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

## UI Components

### Student Profile Components

#### DeletionConfirmationModal
Initial confirmation modal showing:
- Student name
- Payment status warning (if applicable)
- What happens next
- Confirmation checkbox

#### PaymentWarningModal
Detailed warning for paying members:
- Active subscription notification
- Billing decision options explanation
- Acknowledgment checkbox

#### PasswordReAuthModal
Secure password verification:
- Password input with show/hide toggle
- Security notice
- Error handling

#### StudentDeletionButton
Main button component that orchestrates workflow:
- Permission checking
- Modal state management
- Error handling
- Toast notifications

### Owner Settings Components

#### DeletionRequestsScreen
Main deletion request management interface:
- List of pending requests
- Student name, reason, date
- Approve/Deny buttons
- Status badges
- Empty state handling

#### BillingDecisionModal
Billing decision interface for paying members:
- Three decision options with descriptions
- Clear visual distinction
- Compliance notice

## Usage Examples

### For Staff Members (Manager Role)

1. Navigate to student profile
2. Scroll to "Danger Zone" section
3. Click "Request Deletion"
4. Confirm student name
5. If paying member, review billing warning
6. Enter deletion reason
7. Re-enter password
8. Submit request
9. Receive confirmation toast

### For Owner

1. Navigate to Settings → Admin → Deletion Requests
2. Review pending requests
3. For each request:
   - Read reason and student info
   - If paying member, choose billing action
   - Click "Approve" or "Deny"
   - Re-enter password to confirm
4. View execution status

## Security Considerations

1. **No Instant Deletion**: All deletions require owner approval
2. **Password Verification**: Sensitive actions require password re-entry
3. **Audit Trail**: Complete logging of all deletion events
4. **Soft Deletion**: Data preserved for compliance and recovery
5. **Organization Isolation**: Multi-tenancy enforced at database level
6. **Permission Enforcement**: Role-based access control on all endpoints
7. **Billing Protection**: Extra warnings and decisions for paying members

## Compliance & Recovery

### Audit Trail
- All deletion events logged with timestamps
- Actor identification (who performed action)
- Student identification (who was affected)
- Reason documentation
- Billing decisions recorded

### Data Recovery
- Soft-deleted students can be recovered by updating `deletedAt` to NULL
- Original data preserved in database
- Audit logs show deletion history
- No data is permanently removed immediately

### Anonymization
- 24-hour delay before personal data anonymization
- Allows for recovery window
- Scheduled job anonymizes: name, email, phone
- Audit log entry: `DELETE_ANONYMIZED`

## Testing

Comprehensive test suite covers:
- Permission validation
- Password re-authentication
- Status flow transitions
- Paying member detection
- Billing decision logic
- Audit logging
- Soft delete operations
- Organization isolation

Run tests:
```bash
pnpm test server/studentDeletion.test.ts
```

## Future Enhancements

1. **Bulk Deletion Requests**: Request deletion for multiple students
2. **Scheduled Deletion**: Set deletion for future date
3. **Deletion Reasons Analytics**: Track common deletion reasons
4. **Automatic Anonymization**: Configurable anonymization schedule
5. **Webhook Notifications**: Notify external systems of deletions
6. **Deletion Approval Workflow**: Multi-level approval for large organizations

## Troubleshooting

### "Permission denied" Error
- Verify user role has deletion permissions
- Check organization context
- Confirm user is logged in

### "Invalid password" Error
- Ensure password is correct
- Check caps lock
- Try resetting password if needed

### Deletion Request Not Appearing
- Verify organization context matches
- Check request status filter
- Ensure user has `students.delete.viewRequests` permission

### Soft-Deleted Student Still Visible
- Verify queries include `WHERE deletedAt IS NULL`
- Check student list queries are updated
- Clear application cache

## Support

For issues or questions:
1. Check audit logs for error details
2. Review test suite for usage examples
3. Contact system administrator
4. Submit bug report with request ID
