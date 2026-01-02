import fs from 'fs';
import path from 'path';

// Read the test image
const imagePath = '/home/ubuntu/test_photo.png';
const imageBuffer = fs.readFileSync(imagePath);
const base64Data = imageBuffer.toString('base64');

console.log('Image size:', imageBuffer.length, 'bytes');
console.log('Base64 length:', base64Data.length);

// Test the upload endpoint
const payload = {
  base64Data,
  mimeType: 'image/png',
  fileName: 'test-photo.png'
};

console.log('\nPayload structure:');
console.log('- base64Data length:', payload.base64Data.length);
console.log('- mimeType:', payload.mimeType);
console.log('- fileName:', payload.fileName);

// Make a direct tRPC call
const response = await fetch('http://localhost:3000/api/trpc/students.uploadPhoto', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'session=test' // This will fail auth but show us the error
  },
  body: JSON.stringify({
    json: payload
  })
});

console.log('\nResponse status:', response.status);
const responseText = await response.text();
console.log('Response:', responseText.substring(0, 500));
