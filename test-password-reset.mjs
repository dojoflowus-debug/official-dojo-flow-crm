// Using native fetch (Node.js 22+)

const API_URL = 'http://localhost:3000';

async function testPasswordReset() {
  console.log('Testing password reset email functionality...\n');

  // Test 1: Request password reset for a test email
  const testEmail = 'sensei30002003@gmail.com';
  
  console.log(`Step 1: Requesting password reset for ${testEmail}`);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/local/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const contentType = response.headers.get('content-type');
    console.log('Response status:', response.status);
    console.log('Content-Type:', contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response (non-JSON):', text.substring(0, 200));
      data = { error: 'Non-JSON response' };
    }
    
    if (response.ok && data.success) {
      console.log('\n✅ Password reset request successful!');
      console.log('📧 Check the server logs for email sending confirmation');
      console.log('📧 Check your email inbox for the reset link');
    } else {
      console.log('\n❌ Password reset request failed');
    }
  } catch (error) {
    console.error('\n❌ Error during password reset:', error.message);
  }
}

testPasswordReset();
