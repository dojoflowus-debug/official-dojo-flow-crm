import { getDb } from './server/db';
import { students, beltProgress, studentAccounts } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedTestStudent() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Check if test student already exists
    const existing = await db.select()
      .from(students)
      .where(eq(students.email, 'test.student@dojoflow.test'))
      .limit(1);

    let studentId;
    if (existing.length > 0) {
      console.log('Test student already exists with ID:', existing[0].id);
      studentId = existing[0].id;
    } else {
      // Create test student
      const result = await db.insert(students).values({
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'test.student@dojoflow.test',
        phone: '555-0123',
        dateOfBirth: '2008-05-15',
        age: 16,
        beltRank: 'Yellow',
        status: 'Active',
        membershipStatus: 'Active',
        photoUrl: '/test-student-photo.jpg',
        program: 'Kids Karate',
        streetAddress: '123 Martial Arts Way',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        guardianName: 'Sarah Chen',
        guardianRelationship: 'Mother',
        guardianPhone: '555-0124',
        guardianEmail: 'sarah.chen@email.com',
        organizationId: 1,
      });

      studentId = result[0].insertId;
      console.log('✅ Test student created with ID:', studentId);
    }

    // Check if account already exists
    const existingAccount = await db.select()
      .from(studentAccounts)
      .where(eq(studentAccounts.email, 'test.student@dojoflow.test'))
      .limit(1);

    if (existingAccount.length === 0) {
      // Create student account with password
      const passwordHash = await bcrypt.hash('TestPassword123!', 10);
      await db.insert(studentAccounts).values({
        studentId: studentId,
        email: 'test.student@dojoflow.test',
        passwordHash: passwordHash,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });
      console.log('✅ Student account created');
    } else {
      console.log('✅ Student account already exists');
    }

    // Check if belt progress exists, if not create it
    const existingProgress = await db.select()
      .from(beltProgress)
      .where(eq(beltProgress.studentId, studentId))
      .limit(1);

    if (existingProgress.length === 0) {
      // Create belt progress for the student
      await db.insert(beltProgress).values({
        studentId: studentId,
        currentBelt: 'Yellow',
        nextBelt: 'Orange',
        progressPercent: 65,
        qualifiedClasses: 13,
        classesRequired: 20,
        qualifiedAttendance: 85,
        attendanceRequired: 80,
        isEligible: 1,
        instructorNotes: 'Great progress! Excellent form and dedication.',
        lastPromotionDate: new Date('2024-08-15').toISOString(),
        nextEvaluationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      console.log('✅ Belt progress created for test student');
    } else {
      console.log('✅ Belt progress already exists');
    }

    console.log('\n📋 Test Student Details:');
    console.log('   Name: Alex Chen');
    console.log('   Email: test.student@dojoflow.test');
    console.log('   Password: TestPassword123!');
    console.log('   Current Belt: Yellow');
    console.log('   Progress: 65% toward Orange belt');
    console.log('   Attendance: 85% (eligible for promotion)');
    console.log('   Photo: /test-student-photo.jpg');
    console.log('\n✨ You can now log in with this test student to see the dashboard!');

  } catch (error) {
    console.error('Error seeding test student:', error);
    process.exit(1);
  }
}

seedTestStudent();
