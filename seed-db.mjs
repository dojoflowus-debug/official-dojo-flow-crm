import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding database...');

// Seed students
const students = [
  { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '(555) 123-4567', age: 25, beltRank: 'Blue Belt', status: 'Active', membershipStatus: 'Premium' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '(555) 234-5678', age: 30, beltRank: 'Purple Belt', status: 'Active', membershipStatus: 'Standard' },
  { firstName: 'Mike', lastName: 'Johnson', email: 'mike.j@example.com', phone: '(555) 345-6789', age: 22, beltRank: 'White Belt', status: 'Active', membershipStatus: 'Premium' },
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com', phone: '(555) 456-7890', age: 28, beltRank: 'Brown Belt', status: 'Active', membershipStatus: 'Premium' },
  { firstName: 'Tom', lastName: 'Davis', email: 'tom.davis@example.com', phone: '(555) 567-8901', age: 35, beltRank: 'Black Belt', status: 'Active', membershipStatus: 'Premium' },
];

for (const student of students) {
  await db.insert(schema.students).values(student);
}
console.log('✅ Students seeded');

// Seed classes
const classes = [
  { name: 'Kids Karate - Beginner', time: '4:00 PM', enrolled: 12, capacity: 15, instructor: 'Sensei Tom', dayOfWeek: 'Monday' },
  { name: 'Adult BJJ - Advanced', time: '6:30 PM', enrolled: 8, capacity: 12, instructor: 'Professor Mike', dayOfWeek: 'Monday' },
  { name: 'Kids Karate - Intermediate', time: '5:00 PM', enrolled: 10, capacity: 15, instructor: 'Sensei Sarah', dayOfWeek: 'Wednesday' },
  { name: 'Adult Karate - All Levels', time: '7:00 PM', enrolled: 15, capacity: 20, instructor: 'Sensei Tom', dayOfWeek: 'Wednesday' },
];

for (const cls of classes) {
  await db.insert(schema.classes).values(cls);
}
console.log('✅ Classes seeded');

// Seed kiosk check-ins (today)
const checkIns = [
  { studentName: 'John Doe' },
  { studentName: 'Jane Smith' },
  { studentName: 'Mike Johnson' },
];

for (const checkIn of checkIns) {
  await db.insert(schema.kioskCheckIns).values(checkIn);
}
console.log('✅ Kiosk check-ins seeded');

// Seed kiosk visitors
const visitors = [
  { name: 'Alex Brown', email: 'alex.b@example.com', phone: '(555) 111-2222' },
  { name: 'Lisa Green', email: 'lisa.g@example.com', phone: '(555) 222-3333' },
];

for (const visitor of visitors) {
  await db.insert(schema.kioskVisitors).values(visitor);
}
console.log('✅ Kiosk visitors seeded');

// Seed kiosk waivers
const waivers = [
  { name: 'Alex Brown', email: 'alex.b@example.com' },
  { name: 'Lisa Green', email: 'lisa.g@example.com' },
  { name: 'Mark Wilson', email: 'mark.w@example.com' },
];

for (const waiver of waivers) {
  await db.insert(schema.kioskWaivers).values(waiver);
}
console.log('✅ Kiosk waivers seeded');

// Seed leads
const leads = [
  { firstName: 'Robert', lastName: 'Taylor', email: 'robert.t@example.com', phone: '(555) 678-9012', status: 'New', source: 'Website' },
  { firstName: 'Emily', lastName: 'Anderson', email: 'emily.a@example.com', phone: '(555) 789-0123', status: 'Contacted', source: 'Referral' },
  { firstName: 'David', lastName: 'Martinez', email: 'david.m@example.com', phone: '(555) 890-1234', status: 'Interested', source: 'Social Media' },
];

for (const lead of leads) {
  await db.insert(schema.leads).values(lead);
}
console.log('✅ Leads seeded');

console.log('🎉 Database seeding complete!');
await connection.end();
