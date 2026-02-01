/**
 * Default Email Templates
 * 
 * These templates are installed by default for every school.
 * Schools can customize these templates and revert to defaults.
 */

export interface EmailTemplate {
  name: string;
  templateType: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string;
  variables: string[]; // List of available variables for this template
}

export const defaultEmailTemplates: EmailTemplate[] = [
  {
    name: 'Welcome Email - New Student',
    templateType: 'welcome_student',
    category: 'onboarding',
    subject: 'Welcome to {{dojoName}}!',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Welcome to {{dojoName}}!</h1>
        <p>Hi {{studentName}},</p>
        <p>We're excited to have you join our martial arts family!</p>
        <p>Your journey begins now. Here's what you can expect:</p>
        <ul style="line-height: 1.8;">
          <li>World-class instruction from experienced instructors</li>
          <li>A supportive community of fellow martial artists</li>
          <li>Progress tracking and belt advancement</li>
        </ul>
        <p>If you have any questions, don't hesitate to reach out at {{dojoEmail}} or call us at {{dojoPhone}}.</p>
        <p>See you on the mat!</p>
        <p style="color: #666; margin-top: 30px;">- The {{dojoName}} Team</p>
      </div>
    `,
    bodyText: `Welcome to {{dojoName}}!

Hi {{studentName}},

We're excited to have you join our martial arts family!

Your journey begins now. Here's what you can expect:
- World-class instruction from experienced instructors
- A supportive community of fellow martial artists
- Progress tracking and belt advancement

If you have any questions, don't hesitate to reach out at {{dojoEmail}} or call us at {{dojoPhone}}.

See you on the mat!

- The {{dojoName}} Team`,
    variables: ['studentName', 'dojoName', 'dojoEmail', 'dojoPhone']
  },
  
  {
    name: 'Payment Confirmation',
    templateType: 'payment_confirmation',
    category: 'billing',
    subject: 'Payment Confirmation - {{dojoName}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Payment Confirmed</h1>
        <p>Hi {{studentName}},</p>
        <p>Thank you for your payment! Here are the details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount:</strong> {{amount}}</p>
          <p style="margin: 10px 0 0;"><strong>Payment Method:</strong> {{paymentMethod}}</p>
          <p style="margin: 10px 0 0;"><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p style="margin: 10px 0 0;"><strong>Date:</strong> {{currentDate}}</p>
        </div>
        <p><a href="{{receiptUrl}}" style="color: #E53935; text-decoration: none;">View Receipt →</a></p>
        <p>If you have any questions about this payment, please contact us at {{dojoEmail}}.</p>
        <p style="color: #666; margin-top: 30px;">Thank you for your business!</p>
      </div>
    `,
    bodyText: `Payment Confirmed

Hi {{studentName}},

Thank you for your payment! Here are the details:

Amount: {{amount}}
Payment Method: {{paymentMethod}}
Transaction ID: {{transactionId}}
Date: {{currentDate}}

View Receipt: {{receiptUrl}}

If you have any questions about this payment, please contact us at {{dojoEmail}}.

Thank you for your business!`,
    variables: ['studentName', 'amount', 'paymentMethod', 'transactionId', 'currentDate', 'receiptUrl', 'dojoEmail']
  },
  
  {
    name: 'Class Reminder',
    templateType: 'class_reminder',
    category: 'scheduling',
    subject: 'Class Reminder: {{className}} - {{classDate}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Class Reminder</h1>
        <p>Hi {{studentName}},</p>
        <p>This is a friendly reminder about your upcoming class:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Class:</strong> {{className}}</p>
          <p style="margin: 10px 0 0;"><strong>Date:</strong> {{classDate}}</p>
          <p style="margin: 10px 0 0;"><strong>Time:</strong> {{classTime}}</p>
          <p style="margin: 10px 0 0;"><strong>Location:</strong> {{classLocation}}</p>
          <p style="margin: 10px 0 0;"><strong>Instructor:</strong> {{instructorName}}</p>
        </div>
        <p>Don't forget to bring your gear and arrive a few minutes early!</p>
        <p>See you there!</p>
        <p style="color: #666; margin-top: 30px;">- {{dojoName}}</p>
      </div>
    `,
    bodyText: `Class Reminder

Hi {{studentName}},

This is a friendly reminder about your upcoming class:

Class: {{className}}
Date: {{classDate}}
Time: {{classTime}}
Location: {{classLocation}}
Instructor: {{instructorName}}

Don't forget to bring your gear and arrive a few minutes early!

See you there!

- {{dojoName}}`,
    variables: ['studentName', 'className', 'classDate', 'classTime', 'classLocation', 'instructorName', 'dojoName']
  },
  
  {
    name: 'Belt Promotion Congratulations',
    templateType: 'belt_promotion',
    category: 'achievements',
    subject: 'Congratulations on Your Belt Promotion! 🥋',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Congratulations! 🥋</h1>
        <p>Hi {{studentName}},</p>
        <p>We're thrilled to announce that you've been promoted to <strong>{{beltRank}}</strong>!</p>
        <p>This achievement is a testament to your hard work, dedication, and perseverance. You've earned this through countless hours of training and unwavering commitment to your martial arts journey.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #E53935; margin: 0;">{{beltRank}}</p>
          <p style="margin: 10px 0 0; color: #666;">Your New Rank</p>
        </div>
        <p>Keep up the excellent work, and we look forward to seeing you continue to grow in your training!</p>
        <p style="color: #666; margin-top: 30px;">Congratulations again!</p>
        <p style="color: #666;">- The {{dojoName}} Team</p>
      </div>
    `,
    bodyText: `Congratulations!

Hi {{studentName}},

We're thrilled to announce that you've been promoted to {{beltRank}}!

This achievement is a testament to your hard work, dedication, and perseverance. You've earned this through countless hours of training and unwavering commitment to your martial arts journey.

Keep up the excellent work, and we look forward to seeing you continue to grow in your training!

Congratulations again!

- The {{dojoName}} Team`,
    variables: ['studentName', 'beltRank', 'dojoName']
  },
  
  {
    name: 'Merchandise Confirmation',
    templateType: 'merchandise_confirmation',
    category: 'merchandise',
    subject: 'Confirm Receipt of Merchandise - {{itemName}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Merchandise Handed Out</h1>
        <p>Hi {{studentName}},</p>
        <p>We've handed out your <strong>{{itemName}}</strong>{{itemSize}}.</p>
        <p>Please confirm receipt by clicking the link below:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{confirmationUrl}}" style="background: #E53935; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Receipt</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
        <p>If you have any questions or issues with your item, please contact us at {{dojoEmail}}.</p>
        <p style="color: #666; margin-top: 30px;">Thank you!</p>
        <p style="color: #666;">- {{dojoName}}</p>
      </div>
    `,
    bodyText: `Merchandise Handed Out

Hi {{studentName}},

We've handed out your {{itemName}}{{itemSize}}.

Please confirm receipt by clicking the link below:
{{confirmationUrl}}

This link expires in 7 days.

If you have any questions or issues with your item, please contact us at {{dojoEmail}}.

Thank you!

- {{dojoName}}`,
    variables: ['studentName', 'itemName', 'itemSize', 'confirmationUrl', 'dojoEmail', 'dojoName']
  },
  
  {
    name: 'Password Reset',
    templateType: 'password_reset',
    category: 'account',
    subject: 'Reset Your Password - {{dojoName}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #E53935;">Reset Your Password</h1>
        <p>Hi {{studentName}},</p>
        <p>We received a request to reset your password for your {{dojoName}} account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{resetPasswordUrl}}" style="background: #E53935; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email or contact us if you have concerns.</p>
        <p style="color: #666; margin-top: 30px;">- {{dojoName}}</p>
      </div>
    `,
    bodyText: `Reset Your Password

Hi {{studentName}},

We received a request to reset your password for your {{dojoName}} account.

Click the link below to reset your password:
{{resetPasswordUrl}}

This link expires in 1 hour.

If you didn't request this password reset, please ignore this email or contact us if you have concerns.

- {{dojoName}}`,
    variables: ['studentName', 'dojoName', 'resetPasswordUrl']
  }
];

/**
 * Replace variables in template
 */
export function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
}

/**
 * Extract variables from template string
 */
export function extractVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = template.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

/**
 * Validate template variables
 * Returns array of missing variables
 */
export function validateVariables(template: string, providedVariables: Record<string, any>): string[] {
  const requiredVariables = extractVariables(template);
  const missing: string[] = [];
  
  for (const variable of requiredVariables) {
    if (!(variable in providedVariables)) {
      missing.push(variable);
    }
  }
  
  return missing;
}
