-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zipCode VARCHAR(20),
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  programs TEXT,
  estimatedStudents INT,
  launchDate TIMESTAMP,
  logoUrl VARCHAR(500),
  planId INT,
  subscriptionStatus ENUM('trial', 'active', 'past_due', 'cancelled', 'inactive') NOT NULL DEFAULT 'trial',
  trialEndsAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Organization Users table
CREATE TABLE IF NOT EXISTS organization_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  organizationId INT NOT NULL,
  role ENUM('owner', 'admin', 'staff', 'instructor') NOT NULL DEFAULT 'staff',
  isPrimary INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Onboarding Progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  currentStep INT NOT NULL DEFAULT 1,
  accountData TEXT,
  isVerified INT NOT NULL DEFAULT 0,
  schoolData TEXT,
  selectedPlanId INT,
  paymentCompleted INT NOT NULL DEFAULT 0,
  isCompleted INT NOT NULL DEFAULT 0,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Verification Codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(320) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('email', 'sms', 'login') NOT NULL DEFAULT 'email',
  expiresAt TIMESTAMP NOT NULL,
  isUsed INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
