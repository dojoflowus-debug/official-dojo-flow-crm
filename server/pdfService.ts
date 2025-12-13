import PDFDocument from 'pdfkit';
import { storagePut } from './storage';

/**
 * PDF Generation Service for Signed Waivers
 * Creates professional PDF documents with embedded signatures
 */

interface WaiverPdfData {
  studentId: number;
  studentName: string;
  studentEmail?: string;
  studentDob?: string;
  waiverTitle: string;
  waiverContent: string;
  signatureDataUrl: string; // base64 data URL
  signerName: string;
  signedAt: Date;
  guardianSignatureDataUrl?: string; // For minors
  guardianName?: string;
  isMinor: boolean;
}

/**
 * Convert base64 data URL to Buffer
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Generate a signed waiver PDF with embedded signature
 */
export async function generateWaiverPdf(data: WaiverPdfData): Promise<{ url: string; key: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `${data.waiverTitle} - ${data.studentName}`,
          Author: 'DojoFlow',
          Subject: 'Signed Liability Waiver',
          CreationDate: data.signedAt,
        },
      });

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          
          // Generate unique filename
          const timestamp = Date.now();
          const sanitizedName = data.studentName.replace(/[^a-zA-Z0-9]/g, '_');
          const fileKey = `waivers/${data.studentId}/${sanitizedName}_waiver_${timestamp}.pdf`;
          
          // Upload to S3
          const { url, key } = await storagePut(fileKey, pdfBuffer, 'application/pdf');
          
          resolve({ url, key });
        } catch (uploadError) {
          reject(uploadError);
        }
      });

      doc.on('error', reject);

      // === PDF CONTENT ===

      // Header with logo placeholder and title
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('DojoFlow', { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#dc2626')
        .text(data.waiverTitle, { align: 'center' });
      
      doc.moveDown(0.3);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('SIGNED DOCUMENT', { align: 'center' });

      doc.moveDown(1);

      // Horizontal line
      doc.strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke();

      doc.moveDown(1);

      // Student Information Box
      doc.rect(50, doc.y, 512, 80)
        .fillColor('#f8f8f8')
        .fill();
      
      const infoBoxY = doc.y + 15;
      doc.fillColor('#1a1a1a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PARTICIPANT INFORMATION', 65, infoBoxY);
      
      doc.font('Helvetica')
        .fontSize(11)
        .text(`Name: ${data.studentName}`, 65, infoBoxY + 18);
      
      if (data.studentEmail) {
        doc.text(`Email: ${data.studentEmail}`, 65, infoBoxY + 33);
      }
      
      if (data.studentDob) {
        doc.text(`Date of Birth: ${data.studentDob}`, 65, infoBoxY + 48);
      }
      
      doc.text(`Document ID: WVR-${data.studentId}-${Date.now().toString(36).toUpperCase()}`, 300, infoBoxY + 18);
      doc.text(`Signed: ${data.signedAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 300, infoBoxY + 33);

      doc.y = infoBoxY + 80;
      doc.moveDown(1);

      // Waiver Content
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('WAIVER AND RELEASE OF LIABILITY', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(data.waiverContent, {
          align: 'justify',
          lineGap: 3,
        });

      doc.moveDown(1.5);

      // Signature Section
      doc.strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke();

      doc.moveDown(1);

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('ACKNOWLEDGMENT AND SIGNATURE');

      doc.moveDown(0.5);

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('By signing below, I acknowledge that I have read, understood, and agree to the terms of this waiver.');

      doc.moveDown(1);

      // Participant/Guardian Signature
      const signatureY = doc.y;
      
      if (data.isMinor && data.guardianSignatureDataUrl && data.guardianName) {
        // Two-column layout for minor (guardian + participant)
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text('Parent/Guardian Signature:', 50, signatureY);
        
        // Guardian signature image
        try {
          const guardianSigBuffer = dataUrlToBuffer(data.guardianSignatureDataUrl);
          doc.image(guardianSigBuffer, 50, signatureY + 15, { 
            width: 200, 
            height: 60,
            fit: [200, 60],
          });
        } catch (e) {
          doc.text('[Signature on file]', 50, signatureY + 30);
        }
        
        doc.fontSize(9)
          .font('Helvetica')
          .text(`Name: ${data.guardianName}`, 50, signatureY + 80);
        
        // Participant signature on right
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .text('Participant Signature:', 300, signatureY);
        
        try {
          const sigBuffer = dataUrlToBuffer(data.signatureDataUrl);
          doc.image(sigBuffer, 300, signatureY + 15, { 
            width: 200, 
            height: 60,
            fit: [200, 60],
          });
        } catch (e) {
          doc.text('[Signature on file]', 300, signatureY + 30);
        }
        
        doc.fontSize(9)
          .font('Helvetica')
          .text(`Name: ${data.signerName}`, 300, signatureY + 80);

        doc.y = signatureY + 100;
      } else {
        // Single signature for adults
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .text('Signature:', 50, signatureY);
        
        // Signature image
        try {
          const sigBuffer = dataUrlToBuffer(data.signatureDataUrl);
          doc.image(sigBuffer, 50, signatureY + 15, { 
            width: 250, 
            height: 80,
            fit: [250, 80],
          });
        } catch (e) {
          doc.text('[Signature on file]', 50, signatureY + 40);
        }
        
        doc.fontSize(9)
          .font('Helvetica')
          .text(`Printed Name: ${data.signerName}`, 50, signatureY + 100);
        
        doc.text(`Date: ${data.signedAt.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, 300, signatureY + 100);

        doc.y = signatureY + 120;
      }

      doc.moveDown(2);

      // Footer
      doc.strokeColor('#e5e5e5')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text('This document was electronically signed and is legally binding.', { align: 'center' });
      
      doc.text(`Generated by DojoFlow on ${new Date().toISOString()}`, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a simple receipt PDF
 */
export async function generateReceiptPdf(data: {
  studentId: number;
  studentName: string;
  amount: number;
  description: string;
  transactionId: string;
  paidAt: Date;
}): Promise<{ url: string; key: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const timestamp = Date.now();
          const fileKey = `receipts/${data.studentId}/receipt_${timestamp}.pdf`;
          const { url, key } = await storagePut(fileKey, pdfBuffer, 'application/pdf');
          resolve({ url, key });
        } catch (uploadError) {
          reject(uploadError);
        }
      });

      doc.on('error', reject);

      // Receipt content
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('DojoFlow', { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc.fontSize(16)
        .text('Payment Receipt', { align: 'center' });

      doc.moveDown(2);

      doc.fontSize(12)
        .font('Helvetica')
        .text(`Student: ${data.studentName}`)
        .text(`Amount: $${(data.amount / 100).toFixed(2)}`)
        .text(`Description: ${data.description}`)
        .text(`Transaction ID: ${data.transactionId}`)
        .text(`Date: ${data.paidAt.toLocaleDateString()}`);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
