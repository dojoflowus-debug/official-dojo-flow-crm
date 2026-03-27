/**
 * pdfToText.ts
 * 
 * Extracts plain text from a PDF buffer using pdfjs-dist (pure Node.js, no system binaries).
 * Works in any container environment without poppler-utils or other system dependencies.
 */

export async function pdfToText(pdfBytes: Uint8Array): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);

  // Disable the web worker — we run server-side in Node.js
  GlobalWorkerOptions.workerSrc = '';

  const loadingTask = getDocument({
    data: pdfBytes,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableWorker: true,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Each item is a TextItem or TextMarkedContent; only TextItem has .str
    const pageText = (textContent.items as any[])
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean)
      .join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n');
}
