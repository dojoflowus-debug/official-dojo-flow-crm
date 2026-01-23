import { db } from './server/db.ts';
import { floorPlans, spots } from './drizzle/schema.ts';

async function seedFloorPlans() {
  try {
    console.log('Starting to seed floor plans...');
    
    // Get the organization ID (assuming first org)
    const org = await db.query.organizations.findFirst();
    if (!org) {
      console.error('No organization found');
      process.exit(1);
    }
    
    const orgId = org.id;
    console.log(`Using organization ID: ${orgId}`);
    
    // Create Kickboxing Room
    const kickboxingRoom = await db.insert(floorPlans).values({
      organizationId: orgId,
      name: 'Kickboxing Room',
      description: 'Main kickboxing training area with 12 heavy bags',
      length: 30,
      width: 40,
      safetySpacing: 3,
      template: 'Kickboxing Bags',
      notes: 'Heavy bags arranged in rows for kickboxing classes'
    }).returning();
    
    console.log('Created Kickboxing Room:', kickboxingRoom[0].id);
    
    // Add 12 spots for kickboxing room
    const kickboxingSpots = [];
    for (let i = 1; i <= 12; i++) {
      kickboxingSpots.push({
        floorPlanId: kickboxingRoom[0].id,
        spotNumber: i,
        x: ((i - 1) % 4) * 10 + 5,
        y: Math.floor((i - 1) / 4) * 12 + 5,
        type: 'bag',
        status: 'available'
      });
    }
    await db.insert(spots).values(kickboxingSpots);
    console.log('Added 12 spots to Kickboxing Room');
    
    // Create Yoga Studio
    const yogaStudio = await db.insert(floorPlans).values({
      organizationId: orgId,
      name: 'Yoga Studio',
      description: 'Peaceful yoga and meditation space with mat grid',
      length: 40,
      width: 30,
      safetySpacing: 2,
      template: 'Yoga Mats',
      notes: 'Mat grid arranged for yoga and flexibility classes'
    }).returning();
    
    console.log('Created Yoga Studio:', yogaStudio[0].id);
    
    // Add 15 spots for yoga studio
    const yogaSpots = [];
    for (let i = 1; i <= 15; i++) {
      yogaSpots.push({
        floorPlanId: yogaStudio[0].id,
        spotNumber: i,
        x: ((i - 1) % 5) * 8 + 4,
        y: Math.floor((i - 1) / 5) * 9 + 4,
        type: 'mat',
        status: 'available'
      });
    }
    await db.insert(spots).values(yogaSpots);
    console.log('Added 15 spots to Yoga Studio');
    
    // Create Dance Studio
    const danceStudio = await db.insert(floorPlans).values({
      organizationId: orgId,
      name: 'Dance Studio',
      description: 'Open dance floor with formation zones',
      length: 50,
      width: 35,
      safetySpacing: 2.5,
      template: 'Dance Formations',
      notes: 'Large open space for dance and gymnastics formations'
    }).returning();
    
    console.log('Created Dance Studio:', danceStudio[0].id);
    
    // Add 16 spots for dance studio
    const danceSpots = [];
    for (let i = 1; i <= 16; i++) {
      danceSpots.push({
        floorPlanId: danceStudio[0].id,
        spotNumber: i,
        x: ((i - 1) % 4) * 12 + 6,
        y: Math.floor((i - 1) / 4) * 10 + 5,
        type: 'formation',
        status: 'available'
      });
    }
    await db.insert(spots).values(danceSpots);
    console.log('Added 16 spots to Dance Studio');
    
    console.log('✅ Successfully seeded 3 floor plans with 43 total spots');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding floor plans:', error);
    process.exit(1);
  }
}

seedFloorPlans();
