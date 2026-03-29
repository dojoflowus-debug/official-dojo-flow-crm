/**
 * Enhanced Automation Router with Credit Deduction
 * 
 * This file contains the updated sendNow mutation with integrated credit deduction
 * for SMS and email operations. Replace the existing sendNow mutation in automationRouter.ts
 * with this implementation.
 */

// Send automation immediately (skip wait times) with credit deduction
export const sendNowEnhanced = `
  sendNow: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      enrolledType: z.enum(["lead", "student"]),
      enrolledId: z.number(),
      organizationId: z.number().optional(), // For credit consumption
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get sequence with all steps
      const [sequence] = await db.select()
        .from(automationSequences)
        .where(eq(automationSequences.id, input.sequenceId))
        .limit(1);
      
      if (!sequence) throw new Error("Sequence not found");
      
      const steps = await db.select()
        .from(automationSteps)
        .where(eq(automationSteps.sequenceId, input.sequenceId))
        .orderBy(automationSteps.stepOrder);
      
      if (steps.length === 0) throw new Error("No steps found in sequence");
      
      // Get lead/student data
      let recipientData: any;
      if (input.enrolledType === "lead") {
        const [lead] = await db.select()
          .from(leads)
          .where(eq(leads.id, input.enrolledId))
          .limit(1);
        recipientData = lead;
      } else {
        const [student] = await db.select()
          .from(students)
          .where(eq(students.id, input.enrolledId))
          .limit(1);
        recipientData = student;
      }
      
      if (!recipientData) throw new Error("Recipient not found");
      
      // Calculate total credits needed for this automation
      let totalCreditsNeeded = 0;
      for (const step of steps) {
        if (step.stepType === "send_sms") {
          totalCreditsNeeded += 1; // 1 credit per SMS
        } else if (step.stepType === "send_email") {
          totalCreditsNeeded += 2; // 2 credits per email
        }
      }
      
      // Check credit balance before executing (if organizationId provided)
      if (input.organizationId && totalCreditsNeeded > 0) {
        const { checkSufficientBalance } = await import("./services/creditConsumptionService");
        const balanceCheck = await checkSufficientBalance(input.organizationId, totalCreditsNeeded);
        
        if (!balanceCheck.sufficient) {
          throw new Error(balanceCheck.message || \`Insufficient credits for automation (need \${totalCreditsNeeded})\`);
        }
        
        if (balanceCheck.message) {
          console.warn('[Automation] Credit warning:', balanceCheck.message);
        }
      }
      
      // Import automation engine functions
      const { replaceVariables } = await import("./services/automationEngine.js");
      const { sendSMS } = await import("./services/twilio.js");
      const { sendEmail } = await import("./services/sendgrid.js");
      const { deductCredits, CREDIT_COSTS } = await import("./services/creditConsumptionService");
      
      let sentCount = 0;
      let creditsDeducted = 0;
      const errors: string[] = [];
      
      // Execute all steps immediately (skip wait steps)
      for (const step of steps) {
        if (step.stepType === "wait" || step.stepType === "end") {
          continue; // Skip wait and end steps
        }
        
        try {
          if (step.stepType === "send_sms" && step.message) {
            const message = await replaceVariables(step.message, recipientData);
            await sendSMS(recipientData.phone, message);
            sentCount++;
            
            // Deduct SMS credits (if organizationId provided)
            if (input.organizationId) {
              const deductResult = await deductCredits({
                organizationId: input.organizationId,
                amount: CREDIT_COSTS.SMS,
                taskType: 'ai_sms',
                description: \`Automation SMS to \${recipientData.phone}: "\${message.substring(0, 50)}\${message.length > 50 ? '...' : ''}\"\`,
                metadata: {
                  recipientPhone: recipientData.phone,
                  messageLength: message.length,
                  sequenceId: input.sequenceId,
                  stepId: step.id,
                  automationType: 'automation_sequence',
                },
              });
              
              if (deductResult.success) {
                creditsDeducted += CREDIT_COSTS.SMS;
                console.log('[Automation SMS] Credits deducted. New balance:', deductResult.newBalance);
              } else {
                console.error('[Automation SMS] Failed to deduct credits:', deductResult.error);
              }
            }
          } else if (step.stepType === "send_email" && step.message && step.subject) {
            const subject = await replaceVariables(step.subject, recipientData);
            const message = await replaceVariables(step.message, recipientData);
            await sendEmail(recipientData.email, subject, message);
            sentCount++;
            
            // Deduct email credits (if organizationId provided)
            if (input.organizationId) {
              const deductResult = await deductCredits({
                organizationId: input.organizationId,
                amount: CREDIT_COSTS.EMAIL,
                taskType: 'ai_email',
                description: \`Automation email to \${recipientData.email}: "\${subject}"\`,
                metadata: {
                  recipientEmail: recipientData.email,
                  subjectLength: subject.length,
                  messageLength: message.length,
                  sequenceId: input.sequenceId,
                  stepId: step.id,
                  automationType: 'automation_sequence',
                },
              });
              
              if (deductResult.success) {
                creditsDeducted += CREDIT_COSTS.EMAIL;
                console.log('[Automation Email] Credits deducted. New balance:', deductResult.newBalance);
              } else {
                console.error('[Automation Email] Failed to deduct credits:', deductResult.error);
              }
            }
          }
        } catch (error: any) {
          errors.push(\`Step \${step.stepOrder}: \${error.message}\`);
        }
      }
      
      if (errors.length > 0) {
        throw new Error(\`Sent \${sentCount} messages with \${errors.length} errors: \${errors.join(", ")}\`);
      }
      
      return { 
        success: true, 
        message: \`Successfully sent \${sentCount} messages immediately\`,
        sentCount,
        creditsDeducted: input.organizationId ? creditsDeducted : undefined,
      };
    }),
`;
