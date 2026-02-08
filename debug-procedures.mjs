import { appRouter } from './server/routers.ts';

const procedures = Object.keys(appRouter._def.procedures || {});
console.log('Total procedures:', procedures.length);
console.log('\nAll procedures:');
procedures.sort().forEach(p => console.log('  -', p));

console.log('\nLooking for settings and scheduleExtractor:');
const settingsProcs = procedures.filter(p => p.startsWith('settings.'));
const scheduleProcs = procedures.filter(p => p.startsWith('scheduleExtractor.'));

console.log('Settings procedures:', settingsProcs.length);
settingsProcs.forEach(p => console.log('  -', p));

console.log('ScheduleExtractor procedures:', scheduleProcs.length);
scheduleProcs.forEach(p => console.log('  -', p));
