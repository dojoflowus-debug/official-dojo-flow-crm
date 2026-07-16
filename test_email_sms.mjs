import nodemailer from 'nodemailer';

const GMAIL_FROM = process.env.GMAIL_FROM_EMAIL || 'dojoflowus@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

// Common US carrier email-to-SMS gateways for (281) 818-9288
// Try all major carriers
const carriers = [
  '2818189288@tmomail.net',       // T-Mobile
  '2818189288@vtext.com',         // Verizon
  '2818189288@txt.att.net',       // AT&T
  '2818189288@messaging.sprintpcs.com', // Sprint/T-Mobile
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_FROM, pass: GMAIL_PASS },
});

for (const to of carriers) {
  try {
    await transporter.sendMail({
      from: `"DojoFlow" <${GMAIL_FROM}>`,
      to,
      subject: '',
      text: 'Hi! Test message from DojoFlow via email-to-SMS. Your verification system is live! 🥋',
    });
    console.log(`✅ Sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed ${to}: ${err.message}`);
  }
}
