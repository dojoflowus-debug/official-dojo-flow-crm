// Test the storage API endpoints
import { ENV } from './server/_core/env.ts';

async function testEndpoint(endpoint, params = {}) {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;
  
  const url = new URL(endpoint, baseUrl + '/');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  console.log(`Testing: ${url.toString()}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('json')) {
    const json = await response.json();
    console.log(`Response (${response.status}):`, JSON.stringify(json, null, 2));
  } else {
    const text = await response.text();
    console.log(`Response (${response.status}):`, text.substring(0, 200));
  }
  console.log('---');
}

async function main() {
  // Try to discover available endpoints
  await testEndpoint('v1/storage');
  await testEndpoint('v1/storage/info');
  await testEndpoint('v1/storage/list');
  
  // Try different download formats
  await testEndpoint('v1/storage/download', { path: 'test-uploads/test-1769879588813.png' });
  await testEndpoint('v1/storage/file', { path: 'test-uploads/test-1769879588813.png' });
  await testEndpoint('v1/storage/get', { path: 'test-uploads/test-1769879588813.png' });
}

main().catch(console.error);
