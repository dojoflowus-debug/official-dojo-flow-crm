# DojoFlow Security & Multi-Tenant Architecture

This document explains the security model and multi-tenant architecture implemented in DojoFlow.

## Authentication Structure

### Public Website (Owner-Only)
- **Route**: `/` (public landing page)
- **Auth Route**: `/owner` (login/signup)
- **Onboarding**: `/owner/onboarding`
- **Dashboard**: `/owner/dashboard`
- **Access**: Only school owners can authenticate from the public website
- **Security**: Owners can login before organization exists; organization is created during onboarding

### Kiosk Interface (Staff & Student Only)
- **Route**: `/kiosk/:locationSlug`
- **Staff Auth**: `/kiosk/:locationSlug/staff-login`
- **Student Auth**: `/kiosk/:locationSlug/student-login`
- **Access**: Staff and students can ONLY authenticate from physical kiosk locations
- **Security**: All kiosk sessions are location-bound and organization-scoped

## Authentication Methods

### Owner Authentication
- Email + Password
- Email + OTP (one-time password)
- Available from: Public website only

### Staff Authentication
- PIN (4-6 digits)
- Email + Verification Code
- QR Code (not yet implemented)
- Available from: Kiosk only

### Student/Parent Authentication
- Phone + Verification Code
- QR Code (not yet implemented)
- Name + Date of Birth (for children under 18)
- Available from: Kiosk only

## Multi-Tenant Security Model

### Session Context
Every authenticated session includes:
```typescript
{
  userId: number;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff" | "user";
  currentOrganizationId: number | null;  // For multi-org users
  locationSlug: string | null;           // For kiosk sessions
}
```

### tRPC Context
The tRPC context automatically extracts:
- `user`: Current authenticated user
- `currentOrganizationId`: Active organization for multi-tenant access control
- `locationSlug`: Physical location for kiosk-bound operations

### Access Control Middleware

#### `protectedProcedure`
- Requires authentication
- Use for: Any operation requiring a logged-in user

#### `orgScopedProcedure`
- Requires authentication + organization context
- Prevents cross-organization access
- Use for: Student management, class scheduling, billing, reports

#### `kioskProcedure`
- Requires location context
- Prevents access outside of physical kiosk locations
- Use for: Check-ins, kiosk-specific features

#### `adminProcedure`
- Requires authentication + admin role
- Use for: System administration, global settings

## Cross-Organization Access Prevention

### Database Queries
All organization-scoped queries MUST include organization filter:
```typescript
// ✅ CORRECT
const students = await db
  .select()
  .from(students)
  .where(eq(students.organizationId, ctx.currentOrganizationId));

// ❌ WRONG - Can access data from other organizations
const students = await db
  .select()
  .from(students);
```

### Organization Membership
- Users can belong to multiple organizations via `organizationUsers` table
- Each user-organization relationship has a role: `owner`, `admin`, `staff`, `instructor`
- Users must select an active organization if they belong to multiple
- All operations are scoped to the active organization

## Role-Based Access Control

### Roles
- **owner**: School owner, full access to organization
- **admin**: Administrator, can manage staff and students
- **staff**: Front desk staff, limited access
- **user**: Student/parent, can only view their own data

### Role Hierarchy
```
owner > admin > staff > user
```

### Permission Model
- Owners can access all features within their organization(s)
- Admins can manage students, classes, and staff (but not billing)
- Staff can check in students, view schedules, basic CRM
- Students/Parents can only view their own portal

## Location-Bound Kiosk Sessions

### Kiosk Configuration
- Each kiosk is tied to a specific location via `locationSlug`
- Kiosk settings are stored in database per location
- Kiosk sessions include `locationSlug` in session data

### Location Validation
- All kiosk operations verify `locationSlug` from session
- Prevents remote access to kiosk features
- Ensures physical presence at location

## Security Best Practices

### For Developers
1. Always use `orgScopedProcedure` for organization-scoped operations
2. Always filter database queries by `ctx.currentOrganizationId`
3. Never expose data from other organizations in API responses
4. Use `kioskProcedure` for kiosk-only features
5. Validate role permissions before sensitive operations

### For Administrators
1. Regularly audit user-organization memberships
2. Remove inactive staff from organization access
3. Use strong PINs for staff (6 digits minimum)
4. Rotate staff QR codes periodically
5. Monitor kiosk access logs

## Testing Security

### Unit Tests
- Test that queries filter by organization ID
- Test that cross-organization access is blocked
- Test that kiosk features require location context
- Test role-based access control

### Integration Tests
- Test multi-organization user switching
- Test kiosk session isolation
- Test organization data isolation

## Future Enhancements

### Planned Features
- [ ] QR code generation for staff and students
- [ ] Two-factor authentication for owners
- [ ] IP whitelisting for kiosk locations
- [ ] Audit logs for all sensitive operations
- [ ] Rate limiting for authentication attempts
- [ ] Session timeout configuration per organization
- [ ] Biometric authentication for kiosk (fingerprint, face)

### Security Roadmap
- [ ] Implement RBAC permissions table
- [ ] Add field-level access control
- [ ] Implement data encryption at rest
- [ ] Add GDPR compliance features (data export, deletion)
- [ ] Implement security headers (CSP, HSTS, etc.)
- [ ] Add penetration testing
- [ ] Implement security monitoring and alerting
