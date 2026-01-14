import { chatWithKai } from './server/services/openai.ts';

console.log('Testing LLM function calling...');
const response = await chatWithKai('Show me marcus johnson', [], 'Kai');
console.log('LLM Response:', JSON.stringify(response, null, 2));

if (response.functionCalls) {
  console.log('\n✅ LLM wants to call functions:', response.functionCalls.length);
  response.functionCalls.forEach(call => {
    console.log(`  - ${call.name}(${JSON.stringify(call.arguments)})`);
  });
} else {
  console.log('\n❌ LLM did not call any functions');
  console.log('Response text:', response.response);
}
