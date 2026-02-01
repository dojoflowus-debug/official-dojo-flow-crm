/**
 * Seed Default Email Templates
 * 
 * This script seeds the default email templates into the database.
 * Run with: npx tsx server/scripts/seedEmailTemplates.ts
 */

import { getDb } from '../db';
import { emailTemplates } from '../../drizzle/schema';
import { defaultEmailTemplates } from '../lib/defaultEmailTemplates';

async function seedEmailTemplates() {
  console.log('[SeedTemplates] Starting email template seeding...');
  
  try {
    const db = await getDb();
    
    // Insert default templates with orgId = 0 (system defaults)
    for (const template of defaultEmailTemplates) {
      console.log(`[SeedTemplates] Seeding template: ${template.name} (${template.templateType})`);
      
      await db.insert(emailTemplates).values({
        orgId: 0, // System default
        name: template.name,
        templateType: template.templateType,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText || '',
        category: template.category,
        isDefault: 1,
        isCustom: 0,
        variables: JSON.stringify(template.variables),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).onDuplicateKeyUpdate({
        set: {
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          bodyText: template.bodyText || '',
          category: template.category,
          variables: JSON.stringify(template.variables),
          updatedAt: new Date().toISOString(),
        }
      });
      
      console.log(`[SeedTemplates] ✓ Seeded: ${template.name}`);
    }
    
    console.log(`[SeedTemplates] ✅ Successfully seeded ${defaultEmailTemplates.length} email templates`);
    process.exit(0);
  } catch (error) {
    console.error('[SeedTemplates] ❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeding
seedEmailTemplates();
