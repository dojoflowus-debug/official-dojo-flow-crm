// Test uploading a file and immediately accessing it
import { storagePut, storageGet } from './server/storage.ts';
import fs from 'fs';

async function main() {
  try {
    // Create a simple test image (1x1 red pixel PNG)
    const redPixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
    
    const testKey = `test-uploads/test-${Date.now()}.png`;
    console.log('Uploading test file to:', testKey);
    
    const uploadResult = await storagePut(testKey, redPixelPng, 'image/png');
    console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    
    // Try to access the URL immediately
    console.log('\nTrying to access URL:', uploadResult.url);
    const response = await fetch(uploadResult.url);
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('SUCCESS: File is publicly accessible!');
    } else {
      console.log('FAILED: File is not publicly accessible');
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
