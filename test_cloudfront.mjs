// Test fetching CloudFront URL with different headers
import { ENV } from './server/_core/env.ts';

const cloudFrontUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/2Awpr243D2Jitpj6Cn66Rx/test-uploads/test-1769879588813.png';

async function testFetch(headers = {}) {
  console.log('Testing with headers:', JSON.stringify(headers));
  
  const response = await fetch(cloudFrontUrl, { headers });
  console.log(`Response: ${response.status} ${response.statusText}`);
  
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    console.log(`Success! Size: ${buffer.byteLength}`);
  } else {
    const text = await response.text();
    console.log(`Error: ${text.substring(0, 200)}`);
  }
  console.log('---');
}

async function main() {
  // Try without headers
  await testFetch({});
  
  // Try with Authorization header
  await testFetch({ 'Authorization': `Bearer ${ENV.forgeApiKey}` });
  
  // Try with Origin header
  await testFetch({ 'Origin': 'https://dojoflow-2awpr243.manus.space' });
  
  // Try with both
  await testFetch({ 
    'Authorization': `Bearer ${ENV.forgeApiKey}`,
    'Origin': 'https://dojoflow-2awpr243.manus.space'
  });
}

main().catch(console.error);
