import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('Testing SendGrid Configuration...\n');

// Check if API key is present
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log('SENDGRID_API_KEY present:', !!apiKey);
console.log('SENDGRID_API_KEY length:', apiKey ? apiKey.length : 0);
console.log('SENDGRID_FROM_EMAIL:', fromEmail);

if (!apiKey) {
  console.log('\n❌ SENDGRID_API_KEY is not configured');
  console.log('Please set SENDGRID_API_KEY in your .env file');
  process.exit(1);
}

if (!fromEmail) {
  console.log('\n⚠️  SENDGRID_FROM_EMAIL is not configured, using default');
}

// Test sending an email
async function testSendEmail() {
  try {
    sgMail.setApiKey(apiKey);
    
    const msg = {
      to: 'sensei30002003@gmail.com',
      from: fromEmail || 'noreply@dojoflow.com',
      subject: 'Test Email - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Test Password Reset Email</h2>
          <p>This is a test email to verify SendGrid configuration.</p>
          <p>If you receive this, the email sending is working correctly!</p>
        </div>
      `,
    };

    console.log('\nAttempting to send test email...');
    console.log('To:', msg.to);
    console.log('From:', msg.from);
    
    const response = await sgMail.send(msg);
    
    console.log('\n✅ Email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Response headers:', JSON.stringify(response[0].headers, null, 2));
    
  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response body:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

testSendEmail();
