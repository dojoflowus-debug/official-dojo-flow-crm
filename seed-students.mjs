/**
 * Seed Students Script
 * Imports mock students into the DojoFlow database for the sensei30002003@gmail.com organization (org ID 180001)
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

// Organization ID for sensei30002003@gmail.com
const ORGANIZATION_ID = 180001;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding students for organization:', ORGANIZATION_ID);

// Mock students data - diverse martial arts students
const students = [
  // Kids Program (ages 5-12)
  { firstName: 'Emma', lastName: 'Rodriguez', email: 'emma.r@example.com', phone: '(555) 101-0001', age: 8, beltRank: 'Yellow Belt', status: 'Active', membershipStatus: 'Premium', program: 'Kids Karate', guardianName: 'Maria Rodriguez', guardianPhone: '(555) 101-0002', guardianEmail: 'maria.r@example.com' },
  { firstName: 'Liam', lastName: 'Chen', email: 'liam.c@example.com', phone: '(555) 101-0003', age: 10, beltRank: 'Orange Belt', status: 'Active', membershipStatus: 'Standard', program: 'Kids Karate', guardianName: 'Wei Chen', guardianPhone: '(555) 101-0004', guardianEmail: 'wei.c@example.com' },
  { firstName: 'Sophia', lastName: 'Johnson', email: 'sophia.j@example.com', phone: '(555) 101-0005', age: 7, beltRank: 'White Belt', status: 'Active', membershipStatus: 'Premium', program: 'Kids Karate', guardianName: 'Michael Johnson', guardianPhone: '(555) 101-0006', guardianEmail: 'michael.j@example.com' },
  { firstName: 'Noah', lastName: 'Williams', email: 'noah.w@example.com', phone: '(555) 101-0007', age: 11, beltRank: 'Green Belt', status: 'Active', membershipStatus: 'Standard', program: 'Kids BJJ', guardianName: 'Sarah Williams', guardianPhone: '(555) 101-0008', guardianEmail: 'sarah.w@example.com' },
  { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.b@example.com', phone: '(555) 101-0009', age: 9, beltRank: 'Yellow Belt', status: 'On Hold', membershipStatus: 'Standard', program: 'Kids Karate', guardianName: 'James Brown', guardianPhone: '(555) 101-0010', guardianEmail: 'james.b@example.com' },
  
  // Teen Program (ages 13-17)
  { firstName: 'Ethan', lastName: 'Davis', email: 'ethan.d@example.com', phone: '(555) 102-0001', age: 14, beltRank: 'Blue Belt', status: 'Active', membershipStatus: 'Premium', program: 'Teen BJJ', guardianName: 'Robert Davis', guardianPhone: '(555) 102-0002', guardianEmail: 'robert.d@example.com' },
  { firstName: 'Ava', lastName: 'Martinez', email: 'ava.m@example.com', phone: '(555) 102-0003', age: 16, beltRank: 'Purple Belt', status: 'Active', membershipStatus: 'Premium', program: 'Teen MMA', guardianName: 'Carlos Martinez', guardianPhone: '(555) 102-0004', guardianEmail: 'carlos.m@example.com' },
  { firstName: 'Mason', lastName: 'Garcia', email: 'mason.g@example.com', phone: '(555) 102-0005', age: 15, beltRank: 'Green Belt', status: 'Active', membershipStatus: 'Standard', program: 'Teen Karate', guardianName: 'Ana Garcia', guardianPhone: '(555) 102-0006', guardianEmail: 'ana.g@example.com' },
  { firstName: 'Isabella', lastName: 'Anderson', email: 'isabella.a@example.com', phone: '(555) 102-0007', age: 13, beltRank: 'Orange Belt', status: 'Active', membershipStatus: 'Standard', program: 'Teen Karate', guardianName: 'David Anderson', guardianPhone: '(555) 102-0008', guardianEmail: 'david.a@example.com' },
  { firstName: 'Lucas', lastName: 'Taylor', email: 'lucas.t@example.com', phone: '(555) 102-0009', age: 17, beltRank: 'Brown Belt', status: 'Active', membershipStatus: 'Premium', program: 'Teen BJJ', guardianName: 'Jennifer Taylor', guardianPhone: '(555) 102-0010', guardianEmail: 'jennifer.t@example.com' },
  
  // Adult Program (ages 18+)
  { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '(555) 103-0001', age: 25, beltRank: 'Blue Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult BJJ' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '(555) 103-0002', age: 30, beltRank: 'Purple Belt', status: 'Active', membershipStatus: 'Standard', program: 'Adult BJJ' },
  { firstName: 'Mike', lastName: 'Johnson', email: 'mike.j@example.com', phone: '(555) 103-0003', age: 22, beltRank: 'White Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult Karate' },
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w2@example.com', phone: '(555) 103-0004', age: 28, beltRank: 'Brown Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult MMA' },
  { firstName: 'Tom', lastName: 'Davis', email: 'tom.davis@example.com', phone: '(555) 103-0005', age: 35, beltRank: 'Black Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult Karate' },
  { firstName: 'Emily', lastName: 'Wilson', email: 'emily.w@example.com', phone: '(555) 103-0006', age: 27, beltRank: 'Blue Belt', status: 'Active', membershipStatus: 'Standard', program: 'Adult BJJ' },
  { firstName: 'Chris', lastName: 'Moore', email: 'chris.m@example.com', phone: '(555) 103-0007', age: 32, beltRank: 'Purple Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult MMA' },
  { firstName: 'Amanda', lastName: 'Lee', email: 'amanda.l@example.com', phone: '(555) 103-0008', age: 24, beltRank: 'Green Belt', status: 'Active', membershipStatus: 'Standard', program: 'Adult Karate' },
  { firstName: 'David', lastName: 'Harris', email: 'david.h@example.com', phone: '(555) 103-0009', age: 40, beltRank: 'Black Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult BJJ' },
  { firstName: 'Jessica', lastName: 'Clark', email: 'jessica.c@example.com', phone: '(555) 103-0010', age: 29, beltRank: 'Brown Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult MMA' },
  
  // Additional students for variety
  { firstName: 'Ryan', lastName: 'Thompson', email: 'ryan.t@example.com', phone: '(555) 104-0001', age: 33, beltRank: 'Blue Belt', status: 'Inactive', membershipStatus: 'Expired', program: 'Adult BJJ' },
  { firstName: 'Megan', lastName: 'White', email: 'megan.w@example.com', phone: '(555) 104-0002', age: 26, beltRank: 'White Belt', status: 'Active', membershipStatus: 'Trial', program: 'Adult Karate' },
  { firstName: 'Kevin', lastName: 'Lewis', email: 'kevin.l@example.com', phone: '(555) 104-0003', age: 38, beltRank: 'Purple Belt', status: 'Active', membershipStatus: 'Premium', program: 'Adult MMA' },
  { firstName: 'Rachel', lastName: 'Walker', email: 'rachel.w@example.com', phone: '(555) 104-0004', age: 31, beltRank: 'Green Belt', status: 'On Hold', membershipStatus: 'Standard', program: 'Adult BJJ' },
  { firstName: 'Brandon', lastName: 'Hall', email: 'brandon.h@example.com', phone: '(555) 104-0005', age: 23, beltRank: 'Yellow Belt', status: 'Active', membershipStatus: 'Standard', program: 'Adult Karate' },
];

// Insert students with organization ID
let insertedCount = 0;
for (const student of students) {
  try {
    await db.insert(schema.students).values({
      organizationId: ORGANIZATION_ID,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      age: student.age,
      beltRank: student.beltRank,
      status: student.status,
      membershipStatus: student.membershipStatus,
      program: student.program,
      guardianName: student.guardianName || null,
      guardianPhone: student.guardianPhone || null,
      guardianEmail: student.guardianEmail || null,
    });
    insertedCount++;
    console.log(`✅ Added: ${student.firstName} ${student.lastName}`);
  } catch (error) {
    console.error(`❌ Failed to add ${student.firstName} ${student.lastName}:`, error.message);
  }
}

console.log(`\n🎉 Seeding complete! Added ${insertedCount} students to organization ${ORGANIZATION_ID}`);

// Verify the count
const [result] = await db.select({ count: schema.students.id }).from(schema.students);
console.log(`📊 Total students in database: ${result?.count || 'unknown'}`);

await connection.end();
