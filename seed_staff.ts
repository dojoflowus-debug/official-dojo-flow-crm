import { getDb } from './server/db';
import { teamMembers } from './drizzle/schema';

async function seedStaff() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  const staffData = [
    { name: 'Sarah Martinez', role: 'instructor' as const, email: 'sarah.martinez@dojoflow.com', phone: '555-0101', addressAs: 'Coach Sarah', focusAreas: '["kids", "beginners"]', canViewFinancials: 0, canEditSchedule: 1, canManageLeads: 0, viewOnly: 0, isActive: 1 },
    { name: 'James Chen', role: 'manager' as const, email: 'james.chen@dojoflow.com', phone: '555-0102', addressAs: 'Mr. Chen', focusAreas: '["operations", "sales"]', canViewFinancials: 1, canEditSchedule: 1, canManageLeads: 1, viewOnly: 0, isActive: 1 },
    { name: 'Maria Santos', role: 'instructor' as const, email: 'maria.santos@dojoflow.com', phone: '555-0103', addressAs: 'Professor Maria', focusAreas: '["advanced", "competition"]', canViewFinancials: 0, canEditSchedule: 1, canManageLeads: 0, viewOnly: 0, isActive: 1 },
    { name: 'David Kim', role: 'front_desk' as const, email: 'david.kim@dojoflow.com', phone: '555-0104', addressAs: 'David', focusAreas: '["customer_service", "sales"]', canViewFinancials: 0, canEditSchedule: 0, canManageLeads: 1, viewOnly: 0, isActive: 1 },
    { name: 'Emily Johnson', role: 'coach' as const, email: 'emily.johnson@dojoflow.com', phone: '555-0105', addressAs: 'Coach Emily', focusAreas: '["kids", "teens", "fitness"]', canViewFinancials: 0, canEditSchedule: 1, canManageLeads: 0, viewOnly: 0, isActive: 1 },
    { name: 'Michael Brown', role: 'assistant' as const, email: 'michael.brown@dojoflow.com', phone: '555-0106', addressAs: 'Mike', focusAreas: '["beginners", "support"]', canViewFinancials: 0, canEditSchedule: 0, canManageLeads: 0, viewOnly: 1, isActive: 1 },
  ];

  try {
    for (const staff of staffData) {
      await db.insert(teamMembers).values(staff);
      console.log(`Added: ${staff.name} (${staff.role})`);
    }
    console.log('All 6 staff members added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

seedStaff();
