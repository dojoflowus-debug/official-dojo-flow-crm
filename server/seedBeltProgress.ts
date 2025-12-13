import { drizzle } from "drizzle-orm/mysql2";
import { students, beltProgress } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedBeltProgress() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  console.log("🥋 Seeding belt progress data...");
  
  // Get all students
  const allStudents = await db.select().from(students);
  console.log(`Found ${allStudents.length} students`);
  
  const beltOrder = ['White', 'Yellow', 'Orange', 'Green', 'Brown', 'Blue', 'Purple', 'Red', 'Black'];
  
  for (const student of allStudents) {
    // Check if belt progress already exists
    const existing = await db.select().from(beltProgress).where(eq(beltProgress.studentId, student.id)).limit(1);
    
    if (existing.length > 0) {
      console.log(`  ✓ Belt progress exists for ${student.firstName} ${student.lastName}`);
      continue;
    }
    
    // Determine current belt and next belt
    const currentBelt = student.beltRank || 'White';
    const currentIndex = beltOrder.findIndex(b => b.toLowerCase() === currentBelt.toLowerCase());
    const nextBelt = currentIndex < beltOrder.length - 1 ? beltOrder[currentIndex + 1] : currentBelt;
    
    // Generate random progress data
    const qualifiedClasses = Math.floor(Math.random() * 15) + 5;
    const classesRequired = 20;
    const progressPercent = Math.min(100, Math.round((qualifiedClasses / classesRequired) * 100));
    const qualifiedAttendance = Math.floor(Math.random() * 30) + 60; // 60-90%
    
    // Set next evaluation date (random 7-30 days from now)
    const nextEvalDate = new Date();
    nextEvalDate.setDate(nextEvalDate.getDate() + Math.floor(Math.random() * 23) + 7);
    
    await db.insert(beltProgress).values({
      studentId: student.id,
      currentBelt,
      nextBelt,
      progressPercent,
      qualifiedClasses,
      classesRequired,
      qualifiedAttendance,
      attendanceRequired: 80,
      nextEvaluationDate: nextEvalDate,
      isEligible: qualifiedAttendance >= 80 && progressPercent >= 100 ? 1 : 0,
    });
    
    console.log(`  ✓ Created belt progress for ${student.firstName} ${student.lastName} (${currentBelt} → ${nextBelt})`);
  }
  
  console.log("\n✅ Belt progress seeding complete!");
  process.exit(0);
}

seedBeltProgress().catch(console.error);
