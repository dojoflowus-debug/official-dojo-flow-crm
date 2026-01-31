// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}

// Get file contents as ArrayBuffer directly from storage
export async function storageGetBuffer(relKey: string): Promise<ArrayBuffer> {
  const { url } = await storageGet(relKey);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from storage: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Extract the full storage path from a CloudFront URL
 * CloudFront URLs have format: https://xxx.cloudfront.net/{uid}/{projectId}/{relativePath}
 * The download API expects the full path: {uid}/{projectId}/{relativePath}
 */
export function extractStoragePathFromUrl(cloudFrontUrl: string): string {
  try {
    const url = new URL(cloudFrontUrl);
    // Remove leading slash from pathname
    return url.pathname.replace(/^\/+/, '');
  } catch {
    // If it's not a valid URL, assume it's already a path
    return cloudFrontUrl.replace(/^\/+/, '');
  }
}

/**
 * Fetch file directly from storage API with authentication
 * This bypasses CloudFront and fetches directly from the storage proxy
 * 
 * @param fullPath - The full storage path (including uid/projectId prefix) or a CloudFront URL
 */
export async function storageDownload(fullPath: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  
  // If it looks like a URL, extract the path
  const path = fullPath.startsWith('http') 
    ? extractStoragePathFromUrl(fullPath)
    : normalizeKey(fullPath);
  
  // Use the download endpoint with authentication
  const downloadUrl = new URL("v1/storage/download", ensureTrailingSlash(baseUrl));
  downloadUrl.searchParams.set("path", path);
  
  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage download failed (${response.status}): ${message}`);
  }
  
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();
  
  return { buffer, contentType };
}
