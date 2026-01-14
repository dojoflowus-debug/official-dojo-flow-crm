# Billing Structure Implementation

## Overview
The billing system has been refactored to properly separate Programs, Plans, Entitlements, Fees, Discounts, and Add-ons.

## Database Schema

### 1. Programs Table (`programs`)
Membership tracks like "Kids Karate", "Black Belt Club", "Free Trial"
- `id`, `name`, `description`
- `termLength` (months)
- `eligibility` (open | invitation_only)
- `ageRange` (e.g., "4-12", "13-17")
- `showOnKiosk` (boolean)

### 2. Membership Plans Table (`membership_plans`)
Pricing tiers: $149/mo, $199/mo, $249/mo
- `id`, `name`, `description`
- `monthlyAmount` (cents)
- `billingCycle` (monthly | weekly | annual)
- `termLength` (months)
- `registrationFee` (cents)
- `downPayment` (cents)
- `isPopular` (boolean)

### 3. Class Entitlements Table (`class_entitlements`)
What classes members can attend
- `id`, `name`, `description`
- `classesPerWeek` (e.g., 2, 3)
- `classesPerMonth` (e.g., 8, 12)
- `isUnlimited` (boolean)
- `allowedClassTypes` (JSON array)
- `allowedDurations` (JSON array: [30, 60])

### 4. One-Time Fees Table (`one_time_fees`)
Registration, certification, equipment fees
- `id`, `name`, `description`
- `amount` (cents)
- `feeType` (registration | uniform | testing | certification | equipment)
- `chargeWhen` (signup | testing_event | certification_event | manual)
- `isRequired` (boolean)

### 5. Discounts Table (`discounts`)
Rule-based promotions
- `id`, `name`, `description`
- `discountType` (percentage | fixed_amount | waive_fee)
- `discountValue` (percentage or cents)
- `appliesTo` (registration_fee | monthly_fee | all_fees)
- `requiresApproval` (boolean)
- `maxUses`, `currentUses`

### 6. Add-ons Table (`add_ons`)
Optional purchases: workshops, camps, merchandise
- `id`, `name`, `description`
- `price` (cents)
- `addOnType` (workshop | camp | tournament | private_lesson | merchandise)
- `pricingType` (one_time | per_session | per_month)
- `maxCapacity`, `currentEnrollment`
- `imageUrl`

## UI Implementation

### Billing Structure Page (`/billing/structure`)
**File**: `client/src/pages/BillingStructure.tsx`

Six tabs with custom navigation (not using shadcn Tabs due to state issues):
1. **Programs** - List view with badges (Kiosk, Invitation Only)
2. **Plans** - Grid of pricing cards with Popular badge
3. **Entitlements** - List view with Unlimited badge
4. **Fees** - List view with Required badge and charge timing
5. **Discounts** - List view with discount type and approval status
6. **Add-ons** - Grid of cards with capacity tracking

Each section has:
- Header with description
- "Add [Item]" button (placeholder)
- Data display with proper formatting
- "Edit" buttons (placeholder)

## Backend API

### Billing Router (`server/billingRouter.ts`)
- `billing.getPrograms` - Get all programs

### Additional Routers
- `membershipPlans.getAll` - Get all membership plans
- `classEntitlements.getAll` - Get all class entitlements
- `oneTimeFees.getAll` - Get all one-time fees
- `discounts.getAll` - Get all discounts
- `addOns.getAll` - Get all add-ons

## Sample Data
Sample data has been seeded for all 6 sections:
- 5 programs (Kids Karate, Teen Martial Arts, Adult Self Defense, Competition Team, Little Ninjas)
- 6 membership plans (Starter $149, Standard $199, Unlimited $249, Family $399, Free Trial $0, Black Belt Club $299)
- 5 class entitlements (2x/week, 3x/week, Unlimited, Trial, Black Belt Club)
- 5 one-time fees (Registration $99, Uniform $75, Belt Testing $50, Certification $250, Sparring Gear $125)
- 5 discounts (LA Fitness Match, Family $50 off, Paid-in-Full waiver, Referral 10% off, Military 15% off)
- 6 add-ons (Weapons Workshop $75, Summer Camp $299, Tournament $50, Private Lesson $75, T-Shirt $25, Breaking Boards $35)

## Integration Points (TODO)

### Kiosk Enrollment (`client/src/pages/KioskNewStudent.tsx`)
**Current State**: Simple interest checkboxes (karate, jiuJitsu, kickboxing, kidsProgram)

**Needed Changes**:
1. Replace interest checkboxes with Program selector
2. Add Membership Plan selector (filtered by selected Program)
3. Add Class Entitlement selector (linked to Plan)
4. Display applicable Fees with checkboxes
5. Add Discount code/selection
6. Show pricing summary with breakdown

### Enrollment Form (`client/src/pages/EnrollmentForm.tsx`)
**Needed Changes**:
1. Add Program selection step
2. Add Plan selection step with pricing comparison
3. Add Entitlement selection
4. Add Fees selection/review
5. Add Discount application
6. Update payment step with full breakdown

### Student Registration (`client/src/pages/StudentRegister.tsx`)
**Needed Changes**:
1. Update program selection step to use new Programs table
2. Link to Membership Plans
3. Show Entitlements based on selected Plan

## Database Relationships (Future Enhancement)

Consider adding junction tables to link:
- `program_plans` - Which Plans are available for each Program
- `plan_entitlements` - Which Entitlements come with each Plan
- `program_fees` - Which Fees apply to each Program
- `student_enrollments` - Track which Program/Plan/Entitlement each student has

## Pricing Logic Examples

### Example 1: Free Trial
- Program: "Free Trial"
- Plan: "Free Trial" ($0/month)
- Entitlement: "Trial Access" (2x/week, 4x/month)
- Fees: Registration waived, Uniform optional
- Duration: 2 weeks

### Example 2: Standard Kids Karate
- Program: "Kids Karate"
- Plan: "Standard Plan" ($199/month)
- Entitlement: "3x Per Week" (12x/month)
- Fees: Registration $99, Uniform $75
- Discounts: Family discount available ($50 off registration for 2nd member)

### Example 3: Black Belt Club
- Program: "Black Belt Club"
- Plan: "Black Belt Club" ($299/month)
- Entitlement: "Black Belt Club Access" (Unlimited)
- Fees: Registration waived, Down Payment $500
- Term: 36 months
- Includes: Advanced training, certification track

## Next Steps

1. **Create CRUD modals** for each section (Programs, Plans, Entitlements, Fees, Discounts, Add-ons)
2. **Integrate with Kiosk** - Update KioskNewStudent to use new structure
3. **Integrate with Enrollment** - Update EnrollmentForm to use new structure
4. **Add relationship tables** - Link Programs to Plans, Plans to Entitlements
5. **Implement pricing calculator** - Show real-time pricing as user selects options
6. **Add validation** - Ensure required fees are included, discounts are valid
7. **Create enrollment summary** - Show complete breakdown before payment
8. **Add to student records** - Store Program/Plan/Entitlement with each student

## Files Modified

### Database
- `drizzle/schema.ts` - Added 6 new tables
- `scripts/migrate-billing.sql` - Migration script
- `scripts/seed-billing.sql` - Sample data

### Frontend
- `client/src/pages/BillingStructure.tsx` - New billing structure page (WORKING)
- `client/src/pages/BillingNew.tsx` - Old version (has useState import issue, replaced by BillingStructure)
- `client/src/App.tsx` - Updated route to use BillingStructure

### Backend
- `server/billingRouter.ts` - Added getPrograms endpoint
- Additional routers needed for membershipPlans, classEntitlements, oneTimeFees, discounts, addOns

## Known Issues

1. **Duplicate data** - Seed script ran multiple times, creating duplicates (not critical for demo)
2. **Missing CRUD operations** - Edit/Add buttons are placeholders
3. **No relationship enforcement** - Programs/Plans/Entitlements not linked yet
4. **Kiosk not integrated** - Still using old interest checkboxes
5. **Enrollment not integrated** - Still using old program selection

## Testing Checklist

- [x] Programs tab displays correctly
- [x] Plans tab displays with pricing
- [x] Entitlements tab shows class access rules
- [x] Fees tab shows one-time charges
- [x] Discounts tab shows promotional offers
- [x] Add-ons tab shows optional purchases
- [x] Tab navigation works correctly
- [ ] Create new Program
- [ ] Edit existing Program
- [ ] Delete Program
- [ ] Same for Plans, Entitlements, Fees, Discounts, Add-ons
- [ ] Select Program in Kiosk enrollment
- [ ] Select Plan in Kiosk enrollment
- [ ] View pricing breakdown in Kiosk
- [ ] Apply discount in Kiosk
- [ ] Complete enrollment with new structure
