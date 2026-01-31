// Test different path formats with the downloadUrl API
import { ENV } from './server/_core/env.ts';

async function testDownloadUrl(path) {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;
  
  const url = new URL("v1/storage/downloadUrl", baseUrl + '/');
  url.searchParams.set("path", path);
  
  console.log(`Testing path: ${path}`);
  console.log(`URL: ${url.toString()}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  const result = await response.json();
  console.log(`Response (${response.status}):`, JSON.stringify(result, null, 2));
  console.log('---');
  return result;
}

async function main() {
  // Try different path formats
  await testDownloadUrl('test-uploads/test-1769879588813.png');
  await testDownloadUrl('310419663031545745/2Awpr243D2Jitpj6Cn66Rx/test-uploads/test-1769879588813.png');
  await testDownloadUrl('2Awpr243D2Jitpj6Cn66Rx/test-uploads/test-1769879588813.png');
}

main().catch(console.error);
