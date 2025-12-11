import { getDb } from "../db";
import { automationSequences, automationSteps, automationEnrollments, leads, students, dojoSettings, locations } from "../../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendSMS } from "./twilio";
import { sendEmail } from "./sendgrid";
import { wrapInEmailTemplate } from "./emailTemplate";

/**
 * Automation Engine Service
 * Processes automation enrollments and executes steps
 */

/**
 * Process all pending automation steps
 * Called by background job scheduler
 */
export async function processAutomations() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for automation processing");
    return;
  }

  try {
    // Get all active enrollments where nextExecutionAt is in the past
    const now = new Date();
    const pendingEnrollments = await db.select()
      .from(automationEnrollments)
      .where(
        and(
          eq(automationEnrollments.status, "active"),
          lte(automationEnrollments.nextExecutionAt, now)
        )
      );

    console.log(`Processing ${pendingEnrollments.length} pending automation steps`);

    for (const enrollment of pendingEnrollments) {
      try {
        await processEnrollmentStep(enrollment);
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        // Continue processing other enrollments even if one fails
      }
    }
  } catch (error) {
    console.error("Error in processAutomations:", error);
  }
}

/**
 * Process a single enrollment step
 */
async function processEnrollmentStep(enrollment: any) {
  const db = await getDb();
  if (!db) return;

  // Get current step
  if (!enrollment.currentStepId) {
    // No current step - mark as completed
    await db.update(automationEnrollments)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(automationEnrollments.id, enrollment.id));
    return;
  }

  const [currentStep] = await db.select()
    .from(automationSteps)
    .where(eq(automationSteps.id, enrollment.currentStepId))
    .limit(1);

  if (!currentStep) {
    console.error(`Step ${enrollment.currentStepId} not found`);
    return;
  }

  // Execute step based on type
  switch (currentStep.stepType) {
    case "wait":
      // Wait step - already waited, move to next step
      await moveToNextStep(enrollment, currentStep);
      break;

    case "send_sms":
      await executeSendSMS(enrollment, currentStep);
      await moveToNextStep(enrollment, currentStep);
      break;

    case "send_email":
      await executeSendEmail(enrollment, currentStep);
      await moveToNextStep(enrollment, currentStep);
      break;

    case "end":
      // End step - mark enrollment as completed
      await db.update(automationEnrollments)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(automationEnrollments.id, enrollment.id));

      // Update sequence completed count
      await db.update(automationSequences)
        .set({
          completedCount: (await db.select().from(automationEnrollments)
            .where(
              and(
                eq(automationEnrollments.sequenceId, enrollment.sequenceId),
                eq(automationEnrollments.status, "completed")
              )
            )).length,
        })
        .where(eq(automationSequences.id, enrollment.sequenceId));
      break;

    default:
      console.error(`Unknown step type: ${currentStep.stepType}`);
  }
}

/**
 * Move enrollment to next step in sequence
 */
async function moveToNextStep(enrollment: any, currentStep: any) {
  const db = await getDb();
  if (!db) return;

  // Get next step in sequence
  const [nextStep] = await db.select()
    .from(automationSteps)
    .where(
      and(
        eq(automationSteps.sequenceId, enrollment.sequenceId),
        eq(automationSteps.stepOrder, currentStep.stepOrder + 1)
      )
    )
    .limit(1);

  if (!nextStep) {
    // No next step - mark as completed
    await db.update(automationEnrollments)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(automationEnrollments.id, enrollment.id));
    return;
  }

  // Calculate next execution time
  let nextExecutionAt = new Date();
  if (nextStep.stepType === "wait" && nextStep.waitMinutes) {
    nextExecutionAt = new Date(Date.now() + nextStep.waitMinutes * 60 * 1000);
  }

  // Update enrollment to next step
  await db.update(automationEnrollments)
    .set({
      currentStepId: nextStep.id,
      nextExecutionAt,
    })
    .where(eq(automationEnrollments.id, enrollment.id));
}

/**
 * Execute send SMS step
 */
async function executeSendSMS(enrollment: any, step: any) {
  const db = await getDb();
  if (!db) return;

  // Get recipient details
  const recipient = await getRecipient(enrollment);
  if (!recipient || !recipient.phone) {
    console.error(`No phone number for enrollment ${enrollment.id}`);
    return;
  }

  // Replace variables in message
  const message = await replaceVariables(step.message || "", recipient);

  // Send SMS
  try {
    await sendSMS(recipient.phone, message);
    console.log(`SMS sent to ${recipient.phone} for enrollment ${enrollment.id}`);
  } catch (error) {
    console.error(`Failed to send SMS for enrollment ${enrollment.id}:`, error);
    throw error;
  }
}

/**
 * Execute send email step
 */
async function executeSendEmail(enrollment: any, step: any) {
  const db = await getDb();
  if (!db) return;

  // Get recipient details
  const recipient = await getRecipient(enrollment);
  if (!recipient || !recipient.email) {
    console.error(`No email for enrollment ${enrollment.id}`);
    return;
  }

  // Replace variables in subject and message
  const subject = await replaceVariables(step.subject || "Message from DojoFlow", recipient);
  const message = await replaceVariables(step.message || "", recipient);

  // Wrap message in branded HTML template with school logo
  const htmlMessage = await wrapInEmailTemplate(
    message.replace(/\n/g, '<br>'),
    { showLogo: true, showFooter: true }
  );

  // Send email
  try {
    await sendEmail(recipient.email, subject, htmlMessage, message);
    console.log(`Email sent to ${recipient.email} for enrollment ${enrollment.id}`);
  } catch (error) {
    console.error(`Failed to send email for enrollment ${enrollment.id}:`, error);
    throw error;
  }
}

/**
 * Get recipient (lead or student) details
 */
async function getRecipient(enrollment: any) {
  const db = await getDb();
  if (!db) return null;

  if (enrollment.enrolledType === "lead") {
    const [lead] = await db.select()
      .from(leads)
      .where(eq(leads.id, enrollment.enrolledId))
      .limit(1);
    return lead;
  } else if (enrollment.enrolledType === "student") {
    const [student] = await db.select()
      .from(students)
      .where(eq(students.id, enrollment.enrolledId))
      .limit(1);
    return student;
  }

  return null;
}

/**
 * Replace variables in message template
 * Supports lead/student variables: {{firstName}}, {{lastName}}, {{email}}, {{phone}}
 * Supports dojo settings variables: {{businessName}}, {{operatorName}}, {{preferredName}}, {{dojoPhone}}, {{dojoEmail}}, {{aiName}}
 * Supports location variables: {{locationName}}, {{locationAddress}}
 * Supports AI chat link: {{aiChatLink}}
 * Supports booking/enrollment links: {{bookingLink}}, {{enrollmentLink}}, {{billingLink}}, etc.
 */
async function replaceVariables(template: string, data: any): Promise<string> {
  const db = await getDb();
  let result = template;

  // Replace lead/student variables
  result = result
    .replace(/\{\{firstName\}\}/g, data.firstName || "")
    .replace(/\{\{lastName\}\}/g, data.lastName || "")
    .replace(/\{\{email\}\}/g, data.email || "")
    .replace(/\{\{phone\}\}/g, data.phone || "");

  // Get dojo settings for business variables
  if (db) {
    const [settings] = await db.select().from(dojoSettings).limit(1);
    if (settings) {
      result = result
        .replace(/\{\{businessName\}\}/g, settings.businessName || "")
        .replace(/\{\{operatorName\}\}/g, settings.operatorName || "")
        .replace(/\{\{preferredName\}\}/g, settings.preferredName || settings.operatorName || "")
        .replace(/\{\{dojoPhone\}\}/g, settings.businessPhone || "")
        .replace(/\{\{dojoEmail\}\}/g, settings.businessEmail || "")
        .replace(/\{\{aiName\}\}/g, settings.aiAssistantName || "Kai");
    }
  }

  // Get location info if needed
  if (db && (result.includes("{{locationName}}") || result.includes("{{locationAddress}}"))) {
    const [location] = await db.select().from(locations).where(eq(locations.isActive, 1)).limit(1);
    if (location) {
      result = result
        .replace(/\{\{locationName\}\}/g, location.name || "")
        .replace(/\{\{locationAddress\}\}/g, location.address || "");
    }
  }

  // Generate AI chat link with lead/student context
  const baseUrl = process.env.VITE_APP_URL || "https://app.dojoflow.com";
  const chatUrl = `${baseUrl}/chat?id=${data.id}&type=${data.email ? 'lead' : 'student'}&name=${encodeURIComponent(data.firstName || '')}`;
  result = result.replace(/\{\{aiChatLink\}\}/g, chatUrl);

  // Replace common link placeholders with actual URLs
  result = result
    .replace(/\{\{bookingLink\}\}/g, `${baseUrl}/book`)
    .replace(/\{\{enrollmentLink\}\}/g, `${baseUrl}/enroll`)
    .replace(/\{\{billingLink\}\}/g, `${baseUrl}/billing`)
    .replace(/\{\{scheduleLink\}\}/g, `${baseUrl}/schedule`)
    .replace(/\{\{referralLink\}\}/g, `${baseUrl}/refer/${data.id}`)
    .replace(/\{\{appDownloadLink\}\}/g, `${baseUrl}/download`)
    .replace(/\{\{comebackOfferLink\}\}/g, `${baseUrl}/comeback/${data.id}`)
    .replace(/\{\{instructorVideoLink\}\}/g, `${baseUrl}/video/welcome`);

  return result;
}

/**
 * Trigger automation for a specific event
 * Called when events occur (new lead, trial scheduled, etc.)
 */
export async function triggerAutomation(
  triggerType: string,
  enrolledType: "lead" | "student",
  enrolledId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Find active sequences with matching trigger
    const matchingSequences = await db.select()
      .from(automationSequences)
      .where(
        and(
          eq(automationSequences.trigger, triggerType as any),
          eq(automationSequences.isActive, 1)
        )
      );

    console.log(`Found ${matchingSequences.length} sequences for trigger: ${triggerType}`);

    for (const sequence of matchingSequences) {
      // Check if already enrolled
      const existingEnrollment = await db.select()
        .from(automationEnrollments)
        .where(
          and(
            eq(automationEnrollments.sequenceId, sequence.id),
            eq(automationEnrollments.enrolledType, enrolledType),
            eq(automationEnrollments.enrolledId, enrolledId),
            eq(automationEnrollments.status, "active")
          )
        )
        .limit(1);

      if (existingEnrollment.length > 0) {
        console.log(`Already enrolled in sequence ${sequence.id}`);
        continue;
      }

      // Get first step
      const [firstStep] = await db.select()
        .from(automationSteps)
        .where(eq(automationSteps.sequenceId, sequence.id))
        .orderBy(automationSteps.stepOrder)
        .limit(1);

      if (!firstStep) {
        console.log(`No steps found for sequence ${sequence.id}`);
        continue;
      }

      // Calculate next execution time
      // For immediate steps (send_sms, send_email), set to past time to trigger immediately
      // For wait steps, calculate future time
      let nextExecutionAt: Date;
      if (firstStep.stepType === "wait" && firstStep.waitMinutes) {
        nextExecutionAt = new Date(Date.now() + firstStep.waitMinutes * 60 * 1000);
      } else {
        // Set to 1 minute in the past to ensure immediate execution
        nextExecutionAt = new Date(Date.now() - 60 * 1000);
      }

      // Create enrollment
      await db.insert(automationEnrollments).values({
        sequenceId: sequence.id,
        enrolledType,
        enrolledId,
        currentStepId: firstStep.id,
        status: "active",
        nextExecutionAt,
      });

      // Update sequence enrollment count
      await db.update(automationSequences)
        .set({
          enrollmentCount: (await db.select().from(automationEnrollments)
            .where(eq(automationEnrollments.sequenceId, sequence.id))).length,
        })
        .where(eq(automationSequences.id, sequence.id));

      console.log(`Enrolled ${enrolledType} ${enrolledId} in sequence ${sequence.id}`);
      
      // Process the first step immediately if it's not a wait step
      if (firstStep.stepType !== "wait") {
        console.log(`Processing first step immediately for enrollment`);
        const [newEnrollment] = await db.select()
          .from(automationEnrollments)
          .where(
            and(
              eq(automationEnrollments.sequenceId, sequence.id),
              eq(automationEnrollments.enrolledType, enrolledType),
              eq(automationEnrollments.enrolledId, enrolledId),
              eq(automationEnrollments.status, "active")
            )
          )
          .limit(1);
        
        if (newEnrollment) {
          try {
            await processEnrollmentStep(newEnrollment);
            console.log(`First step processed immediately for enrollment`);
          } catch (error) {
            console.error(`Error processing first step immediately:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error triggering automation for ${triggerType}:`, error);
  }
}
