// Test the download API with uid prefix
import { ENV } from './server/_core/env.ts';

async function testDownload(path) {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;
  
  const url = new URL("v1/storage/download", baseUrl + '/');
  url.searchParams.set("path", path);
  
  console.log(`Testing path: ${path}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();
    console.log(`Success! Content-Type: ${contentType}, Size: ${buffer.byteLength}`);
  } else {
    const error = await response.text();
    console.log(`Error (${response.status}): ${error}`);
  }
  console.log('---');
}

async function main() {
  // The uid from the CloudFront URL
  const uid = '310419663031545745';
  
  // Try with uid prefix
  await testDownload(`${uid}/test-uploads/test-1769879588813.png`);
  
  // Try with uid and project prefix
  await testDownload(`${uid}/2Awpr243D2Jitpj6Cn66Rx/test-uploads/test-1769879588813.png`);
}

main().catch(console.error);
