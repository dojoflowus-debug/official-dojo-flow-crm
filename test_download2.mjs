// Test the download API with full path
import { storageDownload, extractStoragePathFromUrl } from './server/storage.ts';

async function main() {
  try {
    // Test with the full CloudFront URL
    const url = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/2Awpr243D2Jitpj6Cn66Rx/test-uploads/test-1769879588813.png';
    
    console.log('Original URL:', url);
    const extractedPath = extractStoragePathFromUrl(url);
    console.log('Extracted path:', extractedPath);
    
    console.log('Downloading...');
    const result = await storageDownload(url);
    console.log('Success! Content-Type:', result.contentType);
    console.log('Buffer size:', result.buffer.byteLength);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
