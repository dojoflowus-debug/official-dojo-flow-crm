import fs from 'fs';

// Read the test image
const imagePath = '/home/ubuntu/test_photo.png';
const imageBuffer = fs.readFileSync(imagePath);

console.log('Image size:', imageBuffer.length, 'bytes');

// Get env vars
const baseUrl = process.env.BUILT_IN_FORGE_API_URL;
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

console.log('Base URL:', baseUrl ? 'Set' : 'NOT SET');
console.log('API Key:', apiKey ? 'Set (length: ' + apiKey.length + ')' : 'NOT SET');

if (!baseUrl || !apiKey) {
  console.log('\nStorage credentials not available in environment');
  process.exit(1);
}

// Build upload URL
const uploadUrl = new URL('v1/storage/upload', baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
uploadUrl.searchParams.set('path', 'test-photos/test-upload.png');

console.log('\nUpload URL:', uploadUrl.toString());

// Create form data
const blob = new Blob([imageBuffer], { type: 'image/png' });
const formData = new FormData();
formData.append('file', blob, 'test-upload.png');

// Make the request
try {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  console.log('\nResponse status:', response.status);
  const responseText = await response.text();
  console.log('Response:', responseText);
} catch (error) {
  console.error('Error:', error.message);
}
