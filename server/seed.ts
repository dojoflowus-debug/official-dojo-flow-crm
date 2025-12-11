import { getDb } from "./db";
import { students, classes, kioskCheckIns, kioskVisitors, kioskWaivers, leads, leadSources } from "../drizzle/schema";

// Realistic student data
const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia",
  "Lucas", "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Michael",
  "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "Jackson", "Avery", "David"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const beltRanks = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt", 
  "Blue Belt", "Purple Belt", "Brown Belt", "Black Belt"
];

const membershipTypes = [
  "Monthly", "Quarterly", "Annual", "Family Plan", "Drop-in"
];

const statuses = ["Active", "Active", "Active", "Active", "Inactive"]; // 80% active

const leadStatuses = [
  "New Lead",
  "Attempting Contact",
  "Contact Made",
  "Intro Scheduled",
  "Offer Presented",
  "Enrolled",
  "Nurture",
  "Lost/Winback"
];

// Helper to generate random date in the past
function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Helper to generate random phone number
function randomPhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${prefix}-${line}`;
}

// Helper to generate random email
function randomEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Helper to generate random age
function randomAge(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate random address
function randomAddress(): string {
  const streets = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St", "Park Blvd"];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${number} ${street}`;
}

async function seed() {
  console.log("🌱 Starting database seed...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  try {
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(kioskCheckIns);
    await db.delete(kioskVisitors);
    await db.delete(kioskWaivers);
    await db.delete(leads);
    await db.delete(classes);
    await db.delete(students);
    await db.delete(leadSources);

    // Generate 30 students
    console.log("👥 Creating 30 students...");
    const studentRecords = [];
    
    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const age = randomAge(6, 45);
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
      
      const student = {
        firstName,
        lastName,
        email: randomEmail(firstName, lastName),
        phone: randomPhone(),
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        age,
        address: randomAddress(),
        emergencyContact: `${firstNames[(i + 10) % 30]} ${lastNames[(i + 15) % 30]}`,
        emergencyPhone: randomPhone(),
        beltRank: beltRanks[Math.floor(Math.random() * beltRanks.length)],
        membershipType: membershipTypes[Math.floor(Math.random() * membershipTypes.length)],
        membershipStatus: statuses[Math.floor(Math.random() * statuses.length)] === "Active" ? "Active" : "Expired",
        joinDate: randomPastDate(365).toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)] as "Active" | "Inactive" | "On Hold",
        notes: `Student ${i + 1} - Joined ${Math.floor(Math.random() * 12) + 1} months ago`
      };
      
      studentRecords.push(student);
    }

    const insertedStudents = await db.insert(students).values(studentRecords).$returningId();
    console.log(`✅ Created ${insertedStudents.length} students`);

    // Generate 10 classes
    console.log("📚 Creating class schedules...");
    const classSchedules = [
      {
        name: "Little Dragons (Ages 4-6)",
        instructor: "Sensei Mike Chen",
        time: "4:00 PM",
        dayOfWeek: "Mon/Wed",
        capacity: 15,
        enrolled: 12
      },
      {
        name: "Kids Karate (Ages 7-12)",
        instructor: "Sensei Sarah Johnson",
        time: "5:00 PM",
        dayOfWeek: "Mon/Wed/Fri",
        capacity: 20,
        enrolled: 18
      },
      {
        name: "Teen Martial Arts (Ages 13-17)",
        instructor: "Sensei David Martinez",
        time: "6:00 PM",
        dayOfWeek: "Tue/Thu",
        capacity: 18,
        enrolled: 14
      },
      {
        name: "Adult Kickboxing",
        instructor: "Coach Emily Rodriguez",
        time: "7:00 PM",
        dayOfWeek: "Mon/Wed/Fri",
        capacity: 25,
        enrolled: 22
      },
      {
        name: "Adult Karate",
        instructor: "Sensei Mike Chen",
        time: "7:00 PM",
        dayOfWeek: "Tue/Thu",
        capacity: 20,
        enrolled: 16
      },
      {
        name: "Advanced Sparring",
        instructor: "Sensei David Martinez",
        time: "10:00 AM",
        dayOfWeek: "Saturday",
        capacity: 16,
        enrolled: 12
      },
      {
        name: "Black Belt Training",
        instructor: "Master James Wilson",
        time: "12:00 PM",
        dayOfWeek: "Saturday",
        capacity: 12,
        enrolled: 8
      },
      {
        name: "Family Class",
        instructor: "Sensei Sarah Johnson",
        time: "9:00 AM",
        dayOfWeek: "Saturday",
        capacity: 30,
        enrolled: 24
      },
      {
        name: "Women's Self-Defense",
        instructor: "Coach Emily Rodriguez",
        time: "6:00 PM",
        dayOfWeek: "Thursday",
        capacity: 20,
        enrolled: 15
      },
      {
        name: "Competition Team",
        instructor: "Master James Wilson",
        time: "8:00 PM",
        dayOfWeek: "Wed/Fri",
        capacity: 15,
        enrolled: 11
      }
    ];

    await db.insert(classes).values(classSchedules);
    console.log(`✅ Created ${classSchedules.length} classes`);

    // Generate 18 check-ins for today
    console.log("✅ Creating check-in records...");
    const checkInRecords = [];
    const today = new Date();
    
    // Select 18 random students for check-ins
    const checkInStudentIds = insertedStudents
      .slice(0, 18)
      .map(s => s.id);
    
    for (let i = 0; i < 18; i++) {
      const studentId = checkInStudentIds[i];
      const student = studentRecords[i];
      const checkInTime = new Date(today);
      checkInTime.setHours(14 + Math.floor(Math.random() * 6)); // 2 PM - 8 PM
      checkInTime.setMinutes(Math.floor(Math.random() * 60));
      
      checkInRecords.push({
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        timestamp: checkInTime
      });
    }

    await db.insert(kioskCheckIns).values(checkInRecords);
    console.log(`✅ Created ${checkInRecords.length} check-ins`);

    // Generate 8 new visitors
    console.log("👋 Creating visitor records...");
    const visitorRecords = [];
    
    const visitorFirstNames = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn"];
    const visitorLastNames = ["Parker", "Cooper", "Reed", "Bailey", "Morgan", "Hayes", "Ellis", "Brooks"];
    
    for (let i = 0; i < 8; i++) {
      const visitorTime = new Date(today);
      visitorTime.setHours(13 + Math.floor(Math.random() * 7)); // 1 PM - 8 PM
      visitorTime.setMinutes(Math.floor(Math.random() * 60));
      
      visitorRecords.push({
        name: `${visitorFirstNames[i]} ${visitorLastNames[i]}`,
        email: randomEmail(visitorFirstNames[i], visitorLastNames[i]),
        phone: randomPhone(),
        timestamp: visitorTime
      });
    }

    await db.insert(kioskVisitors).values(visitorRecords);
    console.log(`✅ Created ${visitorRecords.length} visitors`);

    // Generate 12 waiver signatures
    console.log("📝 Creating waiver records...");
    const waiverRecords = [];
    
    for (let i = 0; i < 12; i++) {
      const student = studentRecords[i];
      const waiverTime = new Date(today);
      waiverTime.setHours(13 + Math.floor(Math.random() * 7));
      waiverTime.setMinutes(Math.floor(Math.random() * 60));
      
      waiverRecords.push({
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        timestamp: waiverTime
      });
    }

    await db.insert(kioskWaivers).values(waiverRecords);
    console.log(`✅ Created ${waiverRecords.length} waivers`);

    // Generate 15 leads
    console.log("🎯 Creating lead records...");
    const leadRecords = [];
    
    const leadFirstNames = ["Chris", "Sam", "Pat", "Drew", "Jesse", "Skyler", "Rowan", "Sage", "River", "Phoenix", "Dakota", "Reese", "Cameron", "Kendall", "Peyton"];
    const leadLastNames = ["Adams", "Baker", "Carter", "Dixon", "Evans", "Foster", "Gray", "Hunt", "Irwin", "James", "King", "Long", "Mills", "Nash", "Owen"];
    
    // Real Tomball, TX area addresses for map testing
    const tomballAddresses = [
      { address: "14055 FM 2920 Rd", city: "Tomball", state: "TX", zipCode: "77377", lat: "30.0974", lng: "-95.6158" },
      { address: "27326 Kuykendahl Rd", city: "Tomball", state: "TX", zipCode: "77375", lat: "30.1127", lng: "-95.5361" },
      { address: "11920 Louetta Rd", city: "Houston", state: "TX", zipCode: "77070", lat: "29.9917", lng: "-95.5417" },
      { address: "24903 Kuykendahl Rd", city: "Tomball", state: "TX", zipCode: "77375", lat: "30.0889", lng: "-95.5361" },
      { address: "14340 Cherry Mound Rd", city: "Tomball", state: "TX", zipCode: "77377", lat: "30.0833", lng: "-95.6500" },
      { address: "18310 Tomball Pkwy", city: "Houston", state: "TX", zipCode: "77070", lat: "29.9847", lng: "-95.5556" },
      { address: "12802 Capricorn St", city: "Tomball", state: "TX", zipCode: "77377", lat: "30.0722", lng: "-95.6278" },
      { address: "25823 Budde Rd", city: "Spring", state: "TX", zipCode: "77380", lat: "30.0917", lng: "-95.4833" },
      { address: "15635 Spring Cypress Rd", city: "Cypress", state: "TX", zipCode: "77429", lat: "29.9750", lng: "-95.6167" },
      { address: "22511 Tomball Pkwy", city: "Tomball", state: "TX", zipCode: "77375", lat: "30.0361", lng: "-95.5556" },
      { address: "13350 Hargrave Rd", city: "Houston", state: "TX", zipCode: "77070", lat: "30.0028", lng: "-95.5833" },
      { address: "28818 Binefield St", city: "Spring", state: "TX", zipCode: "77386", lat: "30.1333", lng: "-95.4500" },
      { address: "17111 Red Oak Dr", city: "Houston", state: "TX", zipCode: "77090", lat: "29.9806", lng: "-95.4667" },
      { address: "19903 Stuebner Airline Rd", city: "Spring", state: "TX", zipCode: "77379", lat: "30.0278", lng: "-95.5000" },
      { address: "26714 Cypresswood Dr", city: "Spring", state: "TX", zipCode: "77373", lat: "30.0583", lng: "-95.4167" },
    ];
    
    for (let i = 0; i < 15; i++) {
      const firstName = leadFirstNames[i];
      const lastName = leadLastNames[i];
      const createdDate = randomPastDate(30);
      const addressData = tomballAddresses[i];
      
      const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)] as "New Lead" | "Attempting Contact" | "Contact Made" | "Intro Scheduled" | "Offer Presented" | "Enrolled" | "Nurture" | "Lost/Winback";
      
      leadRecords.push({
        firstName,
        lastName,
        email: randomEmail(firstName, lastName),
        phone: randomPhone(),
        source: ["Website", "Walk-in", "Referral", "Facebook", "Google"][Math.floor(Math.random() * 5)],
        status,
        notes: `Lead ${i + 1} - Interested in starting soon`,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        lat: addressData.lat,
        lng: addressData.lng,
        createdAt: createdDate,
      });
    }

    await db.insert(leads).values(leadRecords);
    console.log(`✅ Created ${leadRecords.length} leads`);

    // Generate 12 lead sources
    console.log("📋 Creating lead sources...");
    const leadSourceRecords = [
      { sourceKey: "website_form", name: "Website Form", icon: "Globe", enabled: 1, displayOrder: 1 },
      { sourceKey: "chat_widget", name: "Chat Widget", icon: "MessageSquare", enabled: 1, displayOrder: 2 },
      { sourceKey: "landing_pages", name: "Landing Pages", icon: "Layout", enabled: 1, displayOrder: 3 },
      { sourceKey: "kiosk", name: "Kiosk", icon: "Monitor", enabled: 1, displayOrder: 4 },
      { sourceKey: "qr_code", name: "QR Code", icon: "QrCode", enabled: 1, displayOrder: 5 },
      { sourceKey: "facebook_instagram_dms", name: "Facebook / Instagram DMs", icon: "Facebook", enabled: 1, displayOrder: 6 },
      { sourceKey: "google_messages", name: "Google Messages", icon: "MessageCircle", enabled: 1, displayOrder: 7 },
      { sourceKey: "phone_call", name: "Phone Call", icon: "Phone", enabled: 1, displayOrder: 8 },
      { sourceKey: "missed_call_text", name: "Missed Call Text", icon: "PhoneOff", enabled: 1, displayOrder: 9 },
      { sourceKey: "sms_keyword", name: "SMS Keyword", icon: "MessageSquareText", enabled: 1, displayOrder: 10 },
      { sourceKey: "import_from_email", name: "Import from Email", icon: "Mail", enabled: 1, displayOrder: 11 },
      { sourceKey: "other_sources", name: "Other Sources", icon: "Settings", enabled: 1, displayOrder: 12 },
    ];

    await db.insert(leadSources).values(leadSourceRecords);
    console.log(`✅ Created ${leadSourceRecords.length} lead sources`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${studentRecords.length} students`);
    console.log(`   - ${classSchedules.length} classes`);
    console.log(`   - ${checkInRecords.length} check-ins today`);
    console.log(`   - ${visitorRecords.length} new visitors`);
    console.log(`   - ${waiverRecords.length} waivers signed`);
    console.log(`   - ${leadRecords.length} leads in pipeline`);
    console.log(`   - 12 lead sources configured`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
seed()
  .then(() => {
    console.log("\n✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  });

export { seed };
