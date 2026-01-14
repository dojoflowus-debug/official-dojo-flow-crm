import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function migrateBillingSchema() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Starting billing schema migration...');
    
    // 1. Update programs table
    console.log('\n1. Updating programs table...');
    
    // Add new columns to programs table
    const programsColumns = [
      'ALTER TABLE programs ADD COLUMN IF NOT EXISTS termLength INT',
      'ALTER TABLE programs ADD COLUMN IF NOT EXISTS eligibility ENUM("open", "invitation_only", "upgrade_only") DEFAULT "open" NOT NULL',
      'ALTER TABLE programs ADD COLUMN IF NOT EXISTS showOnEnrollment INT DEFAULT 1 NOT NULL',
      'ALTER TABLE programs ADD COLUMN IF NOT EXISTS sortOrder INT DEFAULT 0 NOT NULL',
    ];
    
    for (const sql of programsColumns) {
      try {
        await connection.execute(sql);
        console.log(`✓ ${sql.substring(0, 60)}...`);
      } catch (err) {
        console.log(`  (skipped - may already exist)`);
      }
    }
    
    // 2. Create membership_plans table
    console.log('\n2. Creating membership_plans table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        monthlyAmount INT NOT NULL,
        termLength INT,
        billingCycle ENUM('monthly', 'biweekly', 'weekly', 'annual') DEFAULT 'monthly' NOT NULL,
        billingDays VARCHAR(50),
        downPayment INT DEFAULT 0 NOT NULL,
        registrationFee INT DEFAULT 0 NOT NULL,
        autoRenew INT DEFAULT 1 NOT NULL,
        cancellationPolicy TEXT,
        isPopular INT DEFAULT 0 NOT NULL,
        sortOrder INT DEFAULT 0 NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ membership_plans table created');
    
    // 3. Create class_entitlements table
    console.log('\n3. Creating class_entitlements table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS class_entitlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        classesPerWeek INT,
        classesPerMonth INT,
        isUnlimited INT DEFAULT 0 NOT NULL,
        allowedDurations VARCHAR(255),
        allowedCategories TEXT,
        requiresAdvanceBooking INT DEFAULT 0 NOT NULL,
        bookingWindowDays INT DEFAULT 7 NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ class_entitlements table created');
    
    // 4. Create one_time_fees table
    console.log('\n4. Creating one_time_fees table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS one_time_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount INT NOT NULL,
        feeType ENUM('registration', 'down_payment', 'certification', 'testing', 'equipment', 'uniform', 'other') NOT NULL,
        chargeWhen ENUM('signup', 'first_class', 'certification_event', 'testing_event', 'manual') DEFAULT 'signup' NOT NULL,
        applicableToPrograms TEXT,
        applicableToPlans TEXT,
        isRequired INT DEFAULT 0 NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ one_time_fees table created');
    
    // 5. Create discounts table
    console.log('\n5. Creating discounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        discountType ENUM('percentage', 'fixed_amount', 'waive_fee', 'special_rate') NOT NULL,
        discountValue INT NOT NULL,
        appliesTo ENUM('monthly_fee', 'registration_fee', 'down_payment', 'all_fees') NOT NULL,
        eligibilityRules TEXT,
        applicableToPrograms TEXT,
        applicableToPlans TEXT,
        validFrom TIMESTAMP,
        validUntil TIMESTAMP,
        maxUses INT,
        currentUses INT DEFAULT 0 NOT NULL,
        requiresApproval INT DEFAULT 0 NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ discounts table created');
    
    // 6. Create add_ons table
    console.log('\n6. Creating add_ons table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS add_ons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        addOnType ENUM('seminar', 'workshop', 'tournament', 'camp', 'merchandise', 'equipment', 'private_lesson', 'other') NOT NULL,
        price INT NOT NULL,
        pricingType ENUM('one_time', 'per_session', 'subscription') DEFAULT 'one_time' NOT NULL,
        availableFrom TIMESTAMP,
        availableUntil TIMESTAMP,
        maxCapacity INT,
        currentEnrollment INT DEFAULT 0 NOT NULL,
        requiresMembership INT DEFAULT 0 NOT NULL,
        minimumBeltRank VARCHAR(50),
        showOnKiosk INT DEFAULT 1 NOT NULL,
        showOnEnrollment INT DEFAULT 1 NOT NULL,
        imageUrl VARCHAR(500),
        sortOrder INT DEFAULT 0 NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ add_ons table created');
    
    // 7. Create junction tables
    console.log('\n7. Creating junction tables...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS program_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        programId INT NOT NULL,
        planId INT NOT NULL,
        isDefault INT DEFAULT 0 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ program_plans table created');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS plan_entitlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planId INT NOT NULL,
        entitlementId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ plan_entitlements table created');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        programId INT NOT NULL,
        planId INT NOT NULL,
        entitlementId INT,
        status ENUM('active', 'paused', 'cancelled', 'completed') DEFAULT 'active' NOT NULL,
        startDate TIMESTAMP NOT NULL,
        endDate TIMESTAMP,
        nextBillingDate TIMESTAMP,
        appliedDiscounts TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✓ student_enrollments table created');
    
    console.log('\n✅ Billing schema migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateBillingSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
