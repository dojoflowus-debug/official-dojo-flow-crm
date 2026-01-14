import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Creating subscription and credit system tables...');

try {
  // Create subscription_plans table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      monthlyPrice INT NOT NULL,
      annualPrice INT,
      maxStudents INT NOT NULL,
      maxLocations INT NOT NULL,
      monthlyCredits INT NOT NULL,
      features TEXT NOT NULL,
      aiPhoneEnabled INT NOT NULL DEFAULT 0,
      isActive INT NOT NULL DEFAULT 1,
      displayOrder INT NOT NULL DEFAULT 0,
      stripeProductId VARCHAR(255),
      stripePriceId VARCHAR(255),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ subscription_plans table created');

  // Create organization_subscriptions table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS organization_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organizationId INT NOT NULL UNIQUE,
      planId INT NOT NULL,
      status ENUM('trial', 'active', 'past_due', 'cancelled', 'paused') NOT NULL DEFAULT 'trial',
      billingCycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
      currentPeriodStart TIMESTAMP,
      currentPeriodEnd TIMESTAMP,
      trialEndsAt TIMESTAMP,
      cancelledAt TIMESTAMP,
      cancellationReason TEXT,
      stripeSubscriptionId VARCHAR(255),
      stripeCustomerId VARCHAR(255),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ organization_subscriptions table created');

  // Create ai_credit_balance table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ai_credit_balance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organizationId INT NOT NULL UNIQUE,
      balance INT NOT NULL DEFAULT 0,
      periodAllowance INT NOT NULL DEFAULT 0,
      periodUsed INT NOT NULL DEFAULT 0,
      totalPurchased INT NOT NULL DEFAULT 0,
      totalUsed INT NOT NULL DEFAULT 0,
      lastResetAt TIMESTAMP,
      nextResetAt TIMESTAMP,
      lowCreditThreshold INT NOT NULL DEFAULT 50,
      lowCreditAlertSent INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ ai_credit_balance table created');

  // Create ai_credit_transactions table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ai_credit_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organizationId INT NOT NULL,
      type ENUM('deduction', 'refund', 'allocation', 'purchase', 'bonus') NOT NULL DEFAULT 'deduction',
      amount INT NOT NULL,
      balanceAfter INT NOT NULL,
      taskType ENUM('kai_chat', 'ai_sms', 'ai_email', 'ai_phone_call', 'automation', 'data_analysis', 'other'),
      description TEXT,
      metadata TEXT,
      relatedId INT,
      userId INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_org_created (organizationId, createdAt),
      INDEX idx_task_type (taskType)
    )
  `);
  console.log('✓ ai_credit_transactions table created');

  // Create credit_top_ups table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS credit_top_ups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organizationId INT NOT NULL,
      credits INT NOT NULL,
      amountPaid INT NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      stripePaymentIntentId VARCHAR(255),
      purchasedBy INT,
      completedAt TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ credit_top_ups table created');

  // Insert default subscription plans
  await connection.execute(`
    INSERT INTO subscription_plans 
    (name, slug, monthlyPrice, maxStudents, maxLocations, monthlyCredits, features, aiPhoneEnabled, displayOrder)
    VALUES
    ('Starter', 'starter', 14900, 150, 1, 300, 
     '["Kai chat (strategy + insights only)", "Up to 150 active students", "1 location", "CRM: students, leads, attendance", "Manual email and SMS (non-AI)", "Kiosk access", "Reporting dashboard", "300 AI credits per month"]',
     0, 1),
    ('Growth', 'growth', 29900, 400, 2, 1200,
     '["Full Kai AI automation", "Up to 400 active students", "Up to 2 locations", "AI-generated SMS and email", "Missed-class follow-ups", "Lead reactivation", "Student risk detection", "Kiosk + check-in", "Owner dashboard + reports", "1,200 AI credits per month", "AI phone calls enabled"]',
     1, 2),
    ('Pro', 'pro', 49900, 999999, 999, 3000,
     '["Unlimited students", "Unlimited locations", "Advanced AI workflows", "AI phone, SMS, email at scale", "Staff roles and permissions", "Custom automations", "API and integrations", "Priority support", "3,000+ AI credits per month"]',
     1, 3),
    ('Enterprise', 'enterprise', 0, 999999, 999, 10000,
     '["Custom pricing", "Per-location + volume-based credit pricing", "Unlimited students and locations", "Dedicated account manager", "Custom integrations", "White-label options", "SLA guarantees"]',
     1, 4)
    ON DUPLICATE KEY UPDATE name=name
  `);
  console.log('✓ Default subscription plans inserted');

  console.log('\n✅ Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  throw error;
} finally {
  await connection.end();
}
