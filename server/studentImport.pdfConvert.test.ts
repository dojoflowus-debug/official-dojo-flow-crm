/**
 * Tests for the PDF-to-image conversion pipeline used in parseStudentsFromDocument.
 * Verifies that pdftoppm (poppler-utils) is available and produces valid PNG output
 * that can be sent as base64 image_url blocks to GPT-4o vision.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { mkdtempSync, readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('PDF-to-image conversion via pdftoppm', () => {
  const testPdfPath = '/home/ubuntu/upload/kai_test_roster_realnames.pdf';

  it('pdftoppm should be available on the server', () => {
    const result = spawnSync('which', ['pdftoppm']);
    expect(result.status).toBe(0);
    const path = result.stdout.toString().trim();
    expect(path).toContain('pdftoppm');
  });

  it('should convert a PDF to PNG pages via stdin', () => {
    if (!existsSync(testPdfPath)) {
      console.warn('Test PDF not found, skipping');
      return;
    }
    const pdfBytes = readFileSync(testPdfPath);
    const tmpDir = mkdtempSync(join(tmpdir(), 'kai-pdf-test-'));
    const outPrefix = join(tmpDir, 'page');

    const result = spawnSync(
      'pdftoppm',
      ['-r', '150', '-png', '-', outPrefix],
      { input: pdfBytes, timeout: 15000, maxBuffer: 50 * 1024 * 1024 }
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);

    const pageFiles = readdirSync(tmpDir).filter((f: string) => f.endsWith('.png')).sort();
    expect(pageFiles.length).toBeGreaterThan(0);

    // Verify the PNG is a valid PNG (starts with PNG magic bytes)
    const firstPage = readFileSync(join(tmpDir, pageFiles[0]));
    expect(firstPage.length).toBeGreaterThan(1000); // at least 1KB
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(firstPage[0]).toBe(0x89);
    expect(firstPage[1]).toBe(0x50); // 'P'
    expect(firstPage[2]).toBe(0x4E); // 'N'
    expect(firstPage[3]).toBe(0x47); // 'G'
  });

  it('should produce a valid base64 data URL from the PNG', () => {
    if (!existsSync(testPdfPath)) {
      console.warn('Test PDF not found, skipping');
      return;
    }
    const pdfBytes = readFileSync(testPdfPath);
    const tmpDir = mkdtempSync(join(tmpdir(), 'kai-pdf-test2-'));
    const outPrefix = join(tmpDir, 'page');

    spawnSync('pdftoppm', ['-r', '150', '-png', '-', outPrefix], {
      input: pdfBytes, timeout: 15000, maxBuffer: 50 * 1024 * 1024
    });

    const pageFiles = readdirSync(tmpDir).filter((f: string) => f.endsWith('.png')).sort();
    const imgBuf = readFileSync(join(tmpDir, pageFiles[0]));
    const dataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`;

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('should build correct imageBlocks array for invokeLLM', () => {
    if (!existsSync(testPdfPath)) {
      console.warn('Test PDF not found, skipping');
      return;
    }
    const pdfBytes = readFileSync(testPdfPath);
    const tmpDir = mkdtempSync(join(tmpdir(), 'kai-pdf-test3-'));
    const outPrefix = join(tmpDir, 'page');

    spawnSync('pdftoppm', ['-r', '150', '-png', '-', outPrefix], {
      input: pdfBytes, timeout: 15000, maxBuffer: 50 * 1024 * 1024
    });

    const pageFiles = readdirSync(tmpDir)
      .filter((f: string) => f.endsWith('.png'))
      .sort()
      .slice(0, 10);

    const imageBlocks = pageFiles.map((f: string) => {
      const imgBuf = readFileSync(join(tmpDir, f));
      return {
        type: 'image_url' as const,
        image_url: { url: `data:image/png;base64,${imgBuf.toString('base64')}`, detail: 'high' as const },
      };
    });

    expect(imageBlocks.length).toBeGreaterThan(0);
    expect(imageBlocks[0].type).toBe('image_url');
    expect(imageBlocks[0].image_url.detail).toBe('high');
    expect(imageBlocks[0].image_url.url).toMatch(/^data:image\/png;base64,/);
  });
});
