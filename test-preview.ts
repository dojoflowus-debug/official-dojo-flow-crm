/**
 * Test script to verify email template preview endpoint
 */

import { emailTemplatesRouter } from './server/emailTemplatesRouter';

// Test the preview mutation
async function testPreview() {
  try {
    const result = await emailTemplatesRouter.createCaller({
      user: { id: 1, activeOrgId: 1 },
    }).preview({
      subject: 'Welcome to {{dojoName}}!',
      bodyHtml: '<h1>Hello {{studentName}}</h1>',
      sampleData: {
        dojoName: 'Test Dojo',
        studentName: 'John Doe',
      },
    });
    
    console.log('Preview result:', result);
  } catch (error) {
    console.error('Preview error:', error);
  }
}

testPreview();
