// Test if the downloadUrl API returns a presigned URL
import { storageGet } from './server/storage.ts';

async function main() {
  try {
    // Test with the recently uploaded file
    const key = 'test-uploads/test-1769879588813.png';
    console.log('Getting download URL for:', key);
    
    const result = await storageGet(key);
    console.log('Download URL:', result.url);
    
    // Check if URL has presigned parameters
    const url = new URL(result.url);
    console.log('URL search params:', url.search);
    
    // Try to access it
    const response = await fetch(result.url);
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('SUCCESS: Presigned URL works!');
    } else {
      console.log('FAILED: Presigned URL does not work');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
