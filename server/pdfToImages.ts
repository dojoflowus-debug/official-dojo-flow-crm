/**
 * pdfToImages.ts
 * Converts PDF bytes to an array of base64 PNG data URLs using pdfjs-dist + canvas.
 * Pure Node.js — no system binaries required (works in deployed containers).
 *
 * Each page is rendered at scale 2.0 (≈150dpi) and returned as
 * "data:image/png;base64,..." strings suitable for OpenAI image_url blocks.
 */

let _initialized = false;
let _getDocument: any;
let _GlobalWorkerOptions: any;
let _createCanvas: any;

async function ensureInitialized() {
  if (_initialized) return;
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
  _getDocument = pdfjs.getDocument;
  _GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;

  const canvasModule = await import('canvas');
  _createCanvas = canvasModule.createCanvas;
  const { DOMMatrix } = canvasModule;

  // Polyfill DOMMatrix for pdfjs (not available in Node by default)
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = DOMMatrix;
  }

  // Point to the worker file bundled with pdfjs-dist
  if (!_GlobalWorkerOptions.workerSrc) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const pdfjsPath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
    _GlobalWorkerOptions.workerSrc = pdfjsPath.replace('pdf.mjs', 'pdf.worker.mjs');
  }

  _initialized = true;
}

export async function pdfToBase64Images(
  pdfBytes: Uint8Array,
  maxPages = 10,
  scale = 2.0
): Promise<string[]> {
  await ensureInitialized();

  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pdfjsDir = require.resolve('pdfjs-dist/package.json').replace('package.json', '');

  const pdf = await _getDocument({
    data: pdfBytes,
    standardFontDataUrl: `${pdfjsDir}standard_fonts/`,
  }).promise;

  const numPages = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = _createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background so text is readable on the PNG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    const buf: Buffer = canvas.toBuffer('image/png');
    images.push(`data:image/png;base64,${buf.toString('base64')}`);
  }

  return images;
}
