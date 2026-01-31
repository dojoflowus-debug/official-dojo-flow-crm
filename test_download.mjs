// Test the download API directly
import { storageDownload } from './server/storage.ts';

async function main() {
  try {
    const key = 'test-uploads/test-1769879588813.png';
    console.log('Downloading:', key);
    
    const result = await storageDownload(key);
    console.log('Success! Content-Type:', result.contentType);
    console.log('Buffer size:', result.buffer.byteLength);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
