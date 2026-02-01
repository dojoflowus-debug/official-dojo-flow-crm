/**
 * Test Template Rendering
 */

import { getDb } from './server/db';
import { emailTemplates } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { defaultEmailTemplates, replaceVariables } from './server/lib/defaultEmailTemplates';

async function testTemplateRender() {
  console.log('[TestRender] Testing template rendering...');
  
  const db = await getDb();
  const orgId = 120001;
  const templateType = 'welcome';
  
  // Try to fetch custom template first
  const customTemplate = await db
    .select()
    .from(emailTemplates)
    .where(and(
      eq(emailTemplates.orgId, orgId),
      eq(emailTemplates.templateType, templateType)
    ))
    .limit(1);
  
  let template;
  
  if (customTemplate.length > 0) {
    template = customTemplate[0];
    console.log(`[TestRender] Using custom template: ${templateType}`);
  } else {
    // Fall back to default template
    const defaultTemplate = defaultEmailTemplates.find(t => t.templateType === templateType);
    
    if (!defaultTemplate) {
      console.error(`[TestRender] Template not found: ${templateType}`);
      return;
    }
    
    template = defaultTemplate;
    console.log(`[TestRender] Using default template: ${templateType}`);
  }
  
  const templateData = {
    studentName: 'Vincent Holmes',
    firstName: 'Vincent',
    lastName: 'Holmes',
    email: 'solbittech@gmail.com',
    beltRank: 'White Belt',
    dojoName: 'Test Dojo',
    schoolName: 'Test Dojo',
    dojoAddress: '123 Main St, City, State 12345',
    dojoPhone: '(555) 123-4567',
    dojoEmail: 'info@testdojo.com',
    dojoWebsite: 'https://testdojo.com',
    currentDate: new Date().toLocaleDateString(),
    currentYear: new Date().getFullYear().toString(),
  };
  
  // Render template
  const renderedSubject = replaceVariables(template.subject, templateData);
  const renderedHtml = replaceVariables(template.bodyHtml, templateData);
  
  console.log('[TestRender] ✅ Template rendered successfully!');
  console.log('[TestRender] Subject:', renderedSubject);
  console.log('[TestRender] HTML length:', renderedHtml.length, 'characters');
  console.log('[TestRender] HTML preview:', renderedHtml.substring(0, 200) + '...');
}

testTemplateRender();
