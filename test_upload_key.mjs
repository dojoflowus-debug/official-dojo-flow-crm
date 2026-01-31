// Test upload and check the returned key structure
import { storagePut } from './server/storage.ts';

async function main() {
  try {
    const testData = Buffer.from('test');
    const testKey = `test-${Date.now()}.txt`;
    
    console.log('Uploading with key:', testKey);
    const result = await storagePut(testKey, testData, 'text/plain');
    
    console.log('Upload result:');
    console.log('  key:', result.key);
    console.log('  url:', result.url);
    
    // Extract path from URL
    const url = new URL(result.url);
    console.log('  URL pathname:', url.pathname);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
