import fetch from 'node-fetch';

const API_URL = 'https://3000-i5jlm2lctkhzx3zt7nu4f-0a095168.us2.manus.computer/api/trpc';

// Test the leadSources.list endpoint
async function testLeadSources() {
  try {
    const response = await fetch(`${API_URL}/leadSources.list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('leadSources.list status:', response.status);
    const data = await response.json();
    console.log('leadSources.list response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('leadSources.list error:', error.message);
  }
}

// Test the students.getAnalytics endpoint
async function testStudentsAnalytics() {
  try {
    const response = await fetch(`${API_URL}/students.getAnalytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('students.getAnalytics status:', response.status);
    const data = await response.json();
    console.log('students.getAnalytics response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('students.getAnalytics error:', error.message);
  }
}

console.log('Testing API endpoints...');
await testLeadSources();
await testStudentsAnalytics();
