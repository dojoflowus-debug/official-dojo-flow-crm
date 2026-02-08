import { readFileSync } from 'fs';
import { storagePut } from './server/storage.ts';

// Upload the file to storage
const fileBuffer = readFileSync('/home/ubuntu/upload/Tomball_Optimized_Schedule(3).xlsx');
const fileName = 'Tomball_Optimized_Schedule(3).xlsx';

console.log('[Test] Uploading file to storage...');
const result = await storagePut(`test-imports/${fileName}`, fileBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

console.log('[Test] File uploaded:', result);
console.log('[Test] Storage key:', result.key);
console.log('[Test] File URL:', result.url);
console.log('\n\nNow you can test the import with this file URL in the frontend or call the extractSchedule mutation with these parameters:');
console.log(JSON.stringify({
  storageKey: result.key,
  fileUrl: result.url,
  fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileName: fileName
}, null, 2));
