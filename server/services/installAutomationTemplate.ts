import { getDb } from "../db";
import { automationSequences, automationSteps } from "../../drizzle/schema";
import { automationTemplates, AutomationTemplate } from "./automationTemplates";
import { getIndustryTemplates, getIndustryTemplateByName } from "./industryTemplateService";
import type { AutomationSequenceTemplate } from "../../shared/industryTemplates";

/**
 * Install a pre-built automation template
 * Creates sequence and all steps in database
 * Now supports industry-specific templates
 */
export async function installAutomationTemplate(templateName: string, userId?: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // First try to find industry-specific template
  let template = await getIndustryTemplateByName(templateName);
  
  // Fallback to generic templates if not found
  if (!template) {
    const genericTemplate = automationTemplates.find(t => t.name === templateName);
    if (!genericTemplate) {
      throw new Error(`Template "${templateName}" not found`);
    }
    // Convert generic template to industry template format
    template = {
      name: genericTemplate.name,
      description: genericTemplate.description,
      trigger: genericTemplate.trigger,
      steps: genericTemplate.steps.map(step => ({
        order: step.stepOrder,
        type: step.stepType as any,
        delay_minutes: step.waitMinutes,
        sms_body: step.stepType === 'send_sms' ? step.message : undefined,
        email_subject: step.stepType === 'send_email' ? step.subject : undefined,
        email_body: step.stepType === 'send_email' ? step.message : undefined,
      }))
    };
  }

  try {
    // Create sequence
    const [sequence] = await db.insert(automationSequences).values({
      name: template.name,
      description: template.description,
      trigger: template.trigger as any,
      isActive: 1,
      enrollmentCount: 0,
      completedCount: 0,
      createdBy: userId,
    }).$returningId();

    const sequenceId = sequence.id;

    // Create all steps from industry template
    for (const step of template.steps) {
      const stepType = step.type === 'wait' ? 'wait' : step.type === 'send_sms' ? 'send_sms' : step.type === 'send_email' ? 'send_email' : 'end';
      
      await db.insert(automationSteps).values({
        sequenceId,
        stepOrder: step.order,
        stepType: stepType as any,
        name: `Step ${step.order}`,
        waitMinutes: step.delay_minutes || 0,
        subject: step.email_subject || null,
        message: step.sms_body || step.email_body || null,
      });
    }

    console.log(`Installed automation template: ${templateName} (Sequence ID: ${sequenceId})`);

    return {
      success: true,
      sequenceId,
      message: `Successfully installed "${templateName}" automation`
    };
  } catch (error) {
    console.error(`Error installing template "${templateName}":`, error);
    throw error;
  }
}

/**
 * Get all available templates (industry-specific + generic)
 */
export async function getAvailableTemplates(): Promise<any[]> {
  // Get industry-specific templates
  const industryTemplates = await getIndustryTemplates();
  
  // Convert to format expected by frontend
  const formattedIndustryTemplates = industryTemplates.map(template => ({
    name: template.name,
    description: template.description,
    trigger: template.trigger,
    steps: template.steps.map(step => ({
      stepOrder: step.order,
      stepType: step.type,
      name: `Step ${step.order}`,
      waitMinutes: step.delay_minutes,
      subject: step.email_subject,
      message: step.sms_body || step.email_body,
    }))
  }));
  
  // Also include generic templates as fallback
  return [...formattedIndustryTemplates, ...automationTemplates];
}
