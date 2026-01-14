-- Migration: Add billing structure tables
-- This script creates the new billing tables and updates the programs table

-- Add new columns to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS termLength INT NULL COMMENT 'Contract length in months',
ADD COLUMN IF NOT EXISTS eligibility VARCHAR(50) DEFAULT 'open' COMMENT 'open, invitation_only, referral_required',
ADD COLUMN IF NOT EXISTS showOnKiosk TINYINT DEFAULT 1 COMMENT 'Show this program on kiosk enrollment';

-- Create membership_plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  monthlyAmount INT NOT NULL COMMENT 'In cents',
  termLength INT COMMENT 'In months (null for month-to-month)',
  billingCycle ENUM('monthly', 'biweekly', 'weekly', 'annual') DEFAULT 'monthly' NOT NULL,
  billingDayOfMonth INT COMMENT 'Day of month to bill (1-31)',
  registrationFee INT DEFAULT 0 COMMENT 'In cents',
  downPayment INT DEFAULT 0 COMMENT 'In cents',
  isPopular TINYINT DEFAULT 0 NOT NULL,
  isActive TINYINT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create class_entitlements table
CREATE TABLE IF NOT EXISTS class_entitlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  classesPerWeek INT COMMENT 'null = unlimited',
  classesPerMonth INT,
  isUnlimited TINYINT DEFAULT 0 NOT NULL,
  allowedDurations VARCHAR(255) COMMENT 'Comma-separated: 30,60,90',
  includedCategories TEXT COMMENT 'JSON array of class categories',
  excludedCategories TEXT COMMENT 'JSON array of excluded categories',
  isActive TINYINT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create one_time_fees table
CREATE TABLE IF NOT EXISTS one_time_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount INT NOT NULL COMMENT 'In cents',
  feeType ENUM('registration', 'down_payment', 'certification', 'testing', 'equipment', 'uniform', 'other') NOT NULL,
  chargeWhen ENUM('on_signup', 'on_approval', 'on_belt_test', 'on_certification', 'manual') DEFAULT 'on_signup' NOT NULL,
  isRequired TINYINT DEFAULT 0 NOT NULL,
  isRefundable TINYINT DEFAULT 0 NOT NULL,
  isActive TINYINT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discountType ENUM('percentage', 'fixed_amount', 'waive_fee', 'special_rate') NOT NULL,
  discountValue INT NOT NULL COMMENT 'Percentage (0-100) or amount in cents',
  appliesTo ENUM('registration_fee', 'monthly_amount', 'down_payment', 'all_fees', 'specific_fee') NOT NULL,
  eligibilityRules TEXT COMMENT 'JSON object with rules',
  requiresProof TINYINT DEFAULT 0 NOT NULL,
  requiresApproval TINYINT DEFAULT 0 NOT NULL,
  maxUses INT COMMENT 'null = unlimited',
  currentUses INT DEFAULT 0 NOT NULL,
  validFrom TIMESTAMP NULL,
  validUntil TIMESTAMP NULL,
  isActive TINYINT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create add_ons table
CREATE TABLE IF NOT EXISTS add_ons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  addOnType ENUM('seminar', 'workshop', 'tournament', 'camp', 'merchandise', 'private_lesson', 'other') NOT NULL,
  price INT NOT NULL COMMENT 'In cents',
  pricingType ENUM('one_time', 'per_session', 'per_month', 'per_event') DEFAULT 'one_time' NOT NULL,
  maxCapacity INT,
  currentEnrollment INT DEFAULT 0,
  imageUrl VARCHAR(500),
  eventDate TIMESTAMP NULL,
  registrationDeadline TIMESTAMP NULL,
  isActive TINYINT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create junction tables for many-to-many relationships

-- Programs can have multiple plans
CREATE TABLE IF NOT EXISTS program_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  programId INT NOT NULL,
  planId INT NOT NULL,
  isDefault TINYINT DEFAULT 0 NOT NULL,
  FOREIGN KEY (programId) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (planId) REFERENCES membership_plans(id) ON DELETE CASCADE,
  UNIQUE KEY unique_program_plan (programId, planId)
);

-- Plans can have multiple entitlements
CREATE TABLE IF NOT EXISTS plan_entitlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  planId INT NOT NULL,
  entitlementId INT NOT NULL,
  FOREIGN KEY (planId) REFERENCES membership_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (entitlementId) REFERENCES class_entitlements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_entitlement (planId, entitlementId)
);

-- Student enrollments track which plan + entitlements they have
CREATE TABLE IF NOT EXISTS student_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  programId INT NOT NULL,
  planId INT NOT NULL,
  entitlementId INT,
  enrollmentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expirationDate TIMESTAMP NULL,
  status ENUM('active', 'paused', 'cancelled', 'expired') DEFAULT 'active' NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (programId) REFERENCES programs(id),
  FOREIGN KEY (planId) REFERENCES membership_plans(id),
  FOREIGN KEY (entitlementId) REFERENCES class_entitlements(id)
);
