-- Seed Data: Billing Structure
-- Sample programs, plans, entitlements, fees, discounts, and add-ons

-- Update existing programs with new fields
UPDATE programs SET termLength = 12, eligibility = 'open', showOnKiosk = 1 WHERE name LIKE '%Kids%';
UPDATE programs SET termLength = 36, eligibility = 'invitation_only', showOnKiosk = 0 WHERE name LIKE '%Black Belt%';
UPDATE programs SET termLength = NULL, eligibility = 'open', showOnKiosk = 1 WHERE name LIKE '%Trial%';

-- Insert Membership Plans
INSERT INTO membership_plans (name, description, monthlyAmount, termLength, billingCycle, billingDays, registrationFee, downPayment, isPopular, isActive) VALUES
('Starter Plan', 'Perfect for beginners - 2 classes per week', 14900, 12, 'monthly', '1', 9900, 0, 0, 1),
('Standard Plan', 'Most popular - 3 classes per week', 19900, 12, 'monthly', '1', 9900, 0, 1, 1),
('Unlimited Plan', 'Train as much as you want - unlimited classes', 24900, 12, 'monthly', '1', 9900, 0, 0, 1),
('Family Plan', 'For 2+ family members - unlimited classes', 39900, 12, 'monthly', '1', 15000, 0, 0, 1),
('Free Trial', 'Try us out for 2 weeks', 0, NULL, 'monthly', NULL, 0, 0, 0, 1),
('Black Belt Club', 'Elite training program', 29900, 36, 'monthly', '1', 0, 50000, 0, 1);

-- Insert Class Entitlements
INSERT INTO class_entitlements (name, description, classesPerWeek, classesPerMonth, isUnlimited, allowedDurations, allowedCategories, isActive) VALUES
('2x Per Week', 'Attend up to 2 classes per week', 2, 8, 0, '30,60', '["Kids Karate", "Little Dragons", "Teen"]', 1),
('3x Per Week', 'Attend up to 3 classes per week', 3, 12, 0, '30,60', '["Kids Karate", "Little Dragons", "Teen", "Adult"]', 1),
('Unlimited Classes', 'Attend as many classes as you want', NULL, NULL, 1, '30,60,90', '["Kids Karate", "Little Dragons", "Teen", "Adult", "Competition"]', 1),
('Trial Access', 'Limited trial access', 2, 4, 0, '30,60', '["Kids Karate", "Little Dragons"]', 1),
('Black Belt Club Access', 'Full access plus advanced training', NULL, NULL, 1, '30,60,90', '["Kids Karate", "Teen", "Adult", "Competition", "Leadership"]', 1);

-- Insert One-time Fees
INSERT INTO one_time_fees (name, description, amount, feeType, chargeWhen, isRequired, isActive) VALUES
('Registration Fee', 'One-time registration fee for new students', 9900, 'registration', 'signup', 1, 1),
('Uniform Package', 'Official dojo uniform (gi) and belt', 7500, 'uniform', 'signup', 1, 1),
('Belt Testing Fee', 'Fee for belt rank advancement testing', 5000, 'testing', 'testing_event', 1, 1),
('Black Belt Certification', 'Official black belt certification and ceremony', 25000, 'certification', 'certification_event', 1, 1),
('Sparring Gear Set', 'Required protective gear for sparring', 12500, 'equipment', 'manual', 0, 1);

-- Insert Discounts
INSERT INTO discounts (name, description, discountType, discountValue, appliesTo, eligibilityRules, requiresApproval, maxUses, currentUses, validFrom, validUntil, isActive) VALUES
('LA Fitness Match', 'Match LA Fitness registration fee ($99)', 'waive_fee', 0, 'registration_fee', '{"competitor": "LA Fitness", "proof_required": true}', 1, NULL, 0, NULL, NULL, 1),
('Family Discount', 'Second family member gets $50 off registration', 'fixed_amount', 5000, 'registration_fee', '{"family_members": 2}', 0, NULL, 0, NULL, NULL, 1),
('Paid-in-Full Discount', 'Waive registration if paying full year upfront', 'waive_fee', 0, 'registration_fee', '{"payment_type": "paid_in_full"}', 1, NULL, 0, NULL, NULL, 1),
('Referral Bonus', '10% off first month for referrals', 'percentage', 10, 'monthly_fee', '{"referral_required": true}', 0, NULL, 0, NULL, NULL, 1),
('Military Discount', '15% off monthly tuition', 'percentage', 15, 'monthly_fee', '{"military": true, "proof_required": true}', 1, NULL, 0, NULL, NULL, 1);

-- Insert Add-ons
INSERT INTO add_ons (name, description, addOnType, price, pricingType, maxCapacity, currentEnrollment, availableFrom, availableUntil, isActive) VALUES
('Weapons Training Workshop', 'Learn bo staff, nunchaku, and sword techniques', 'workshop', 7500, 'one_time', 20, 0, DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), 1),
('Summer Karate Camp', 'Full-day camp with training, games, and lunch', 'camp', 29900, 'one_time', 40, 0, DATE_ADD(NOW(), INTERVAL 80 DAY), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('Regional Tournament Entry', 'Compete in the regional championship', 'tournament', 5000, 'one_time', 100, 0, DATE_ADD(NOW(), INTERVAL 50 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('Private Lesson (60 min)', 'One-on-one instruction with head instructor', 'private_lesson', 7500, 'per_session', NULL, 0, NULL, NULL, 1),
('Dojo T-Shirt', 'Official dojo t-shirt with logo', 'merchandise', 2500, 'one_time', NULL, 0, NULL, NULL, 1),
('Breaking Board Set', 'Rebreakable training boards (3-pack)', 'merchandise', 3500, 'one_time', NULL, 0, NULL, NULL, 1);

-- Link Programs to Plans (program_plans junction table)
-- Assuming program IDs 1-6 exist from previous data
INSERT INTO program_plans (programId, planId, isDefault) VALUES
(1, 1, 1), -- Kids Karate → Starter Plan (default)
(1, 2, 0), -- Kids Karate → Standard Plan
(1, 3, 0), -- Kids Karate → Unlimited Plan
(2, 2, 1), -- Little Dragons → Standard Plan (default)
(2, 3, 0), -- Little Dragons → Unlimited Plan
(3, 2, 1), -- Teen → Standard Plan (default)
(3, 3, 0), -- Teen → Unlimited Plan
(4, 3, 1), -- Adult → Unlimited Plan (default)
(5, 5, 1), -- Free Trial → Free Trial Plan (default)
(6, 6, 1); -- Black Belt Club → Black Belt Club Plan (default)

-- Link Plans to Entitlements (plan_entitlements junction table)
INSERT INTO plan_entitlements (planId, entitlementId) VALUES
(1, 1), -- Starter Plan → 2x Per Week
(2, 2), -- Standard Plan → 3x Per Week
(3, 3), -- Unlimited Plan → Unlimited Classes
(4, 3), -- Family Plan → Unlimited Classes
(5, 4), -- Free Trial → Trial Access
(6, 5); -- Black Belt Club → Black Belt Club Access
