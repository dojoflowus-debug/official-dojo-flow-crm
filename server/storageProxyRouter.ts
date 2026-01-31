import express from 'express';
import { ENV } from './_core/env.js';

const router = express.Router();

/**
 * Storage proxy endpoint to serve S3 files that require authentication
 * This is needed because CloudFront URLs returned by the storage API
 * don't have public read access configured.
 * 
 * Usage: /api/storage-proxy/{path}
 * Example: /api/storage-proxy/student-photos/360018/photo.jpg
 * 
 * Can also accept a CloudFront URL as query param:
 * /api/storage-proxy?url=https://xxx.cloudfront.net/uid/project/path/file.jpg
 */

// Helper to fetch file from storage API
async function fetchFromStorage(relativePath: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const baseUrl = ENV.forgeApiUrl?.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;
  
  if (!baseUrl || !apiKey) {
    throw new Error('Storage credentials not configured');
  }
  
  // First, get the download URL (which gives us the CloudFront URL)
  // Then we need to fetch the file content through the storage API
  const downloadApiUrl = new URL("v1/storage/download", baseUrl + '/');
  downloadApiUrl.searchParams.set("path", relativePath);
  
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Storage fetch failed (${response.status}): ${errorText}`);
  }
  
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();
  
  return { buffer, contentType };
}

// Extract relative path from CloudFront URL
// URL format: https://xxx.cloudfront.net/{uid}/{projectId}/{relativePath}
function extractRelativePath(cloudFrontUrl: string): string {
  try {
    const url = new URL(cloudFrontUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip the first two parts (uid and projectId)
    if (pathParts.length > 2) {
      return pathParts.slice(2).join('/');
    }
    
    // If path doesn't have uid/projectId prefix, return as-is
    return pathParts.join('/');
  } catch {
    return cloudFrontUrl;
  }
}

router.get('/*', async (req, res) => {
  try {
    // Get the file path - either from URL param or path
    let filePath = req.params[0];
    
    // If a URL query param is provided, extract the relative path from it
    if (req.query.url && typeof req.query.url === 'string') {
      filePath = extractRelativePath(req.query.url);
    }
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Validate the path to prevent directory traversal
    if (filePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Remove leading slashes
    filePath = filePath.replace(/^\/+/, '');
    
    console.log(`[StorageProxy] Fetching file: ${filePath}`);
    
    // Fetch the file from storage
    const { buffer, contentType } = await fetchFromStorage(filePath);
    
    // Determine content type from file extension if not provided
    let finalContentType = contentType;
    if (contentType === 'application/octet-stream') {
      const ext = filePath.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
      };
      finalContentType = contentTypes[ext || ''] || contentType;
    }
    
    // Set cache headers (1 hour for images)
    res.set({
      'Content-Type': finalContentType,
      'Cache-Control': 'public, max-age=3600',
      'Content-Length': buffer.byteLength.toString(),
    });
    
    // Send the file
    res.send(Buffer.from(buffer));
    
  } catch (error: any) {
    console.error('[StorageProxy] Error fetching file:', error.message);
    
    // Return appropriate error status
    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch file', details: error.message });
  }
});

export default router;
