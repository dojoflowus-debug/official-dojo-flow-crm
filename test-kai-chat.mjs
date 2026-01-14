import { searchStudents } from './server/db.ts';

// Test the search function directly
console.log('Testing searchStudents function...');
const results = await searchStudents('marcus johnson');
console.log('Search results:', JSON.stringify(results, null, 2));
