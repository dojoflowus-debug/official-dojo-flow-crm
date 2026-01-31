// Test if we can get a presigned URL for the uploaded file
import { storageGet } from './server/storage.ts';

async function main() {
  try {
    const key = 'student-photos/360018/student-360018-1769878835224-51e5z0.jpeg';
    console.log('Getting presigned URL for:', key);
    const result = await storageGet(key);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
