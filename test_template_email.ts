/**
 * Test Template Email Sending
 */

import { sendWelcomeEmail } from './server/_core/sendgrid';

async function testTemplateEmail() {
  console.log('[TestEmail] Testing template-based email sending...');
  
  const result = await sendWelcomeEmail(
    { email: 'solbittech@gmail.com', name: 'Vincent Holmes' },
    {
      studentName: 'Vincent Holmes',
      firstName: 'Vincent',
      lastName: 'Holmes',
      email: 'solbittech@gmail.com',
      beltRank: 'White Belt'
    },
    {
      dojoName: 'Test Dojo',
      dojoAddress: '123 Main St, City, State 12345',
      dojoPhone: '(555) 123-4567',
      dojoEmail: 'info@testdojo.com',
      dojoWebsite: 'https://testdojo.com'
    },
    120001 // Organization ID
  );
  
  console.log('[TestEmail] Result:', result);
  
  if (result.success) {
    console.log('[TestEmail] ✅ Email sent successfully!');
    console.log('[TestEmail] Message ID:', result.messageId);
  } else {
    console.error('[TestEmail] ❌ Email failed:', result.error);
  }
}

testTemplateEmail();
