/**
 * Report Template Service
 * Provides branded HTML report templates with school logo for printing/PDF export
 */

import { getDb } from "../db";
import { dojoSettings } from "../../drizzle/schema";

// Default fallback logo
const DEFAULT_LOGO = "https://dojoflow.com/logo.png";

/**
 * Get the school logo URL from database settings
 */
export async function getSchoolLogo(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_LOGO;

    const [settings] = await db.select().from(dojoSettings).limit(1);
    return settings?.logoSquare || DEFAULT_LOGO;
  } catch (error) {
    console.error("Error fetching school logo:", error);
    return DEFAULT_LOGO;
  }
}

/**
 * Get school info from database settings
 */
export async function getSchoolInfo(): Promise<{
  name: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        name: "DojoFlow",
        phone: "",
        email: "",
        address: "",
        logo: DEFAULT_LOGO
      };
    }

    const [settings] = await db.select().from(dojoSettings).limit(1);
    return {
      name: settings?.businessName || "DojoFlow",
      phone: settings?.businessPhone || "",
      email: settings?.businessEmail || "",
      address: settings?.address || "",
      logo: settings?.logoSquare || DEFAULT_LOGO
    };
  } catch (error) {
    console.error("Error fetching school info:", error);
    return {
      name: "DojoFlow",
      phone: "",
      email: "",
      address: "",
      logo: DEFAULT_LOGO
    };
  }
}

/**
 * Generate branded report HTML wrapper
 */
export async function wrapInReportTemplate(
  title: string,
  content: string,
  options?: {
    showLogo?: boolean;
    showFooter?: boolean;
    showDate?: boolean;
    orientation?: 'portrait' | 'landscape';
  }
): Promise<string> {
  const { 
    showLogo = true, 
    showFooter = true, 
    showDate = true,
    orientation = 'portrait' 
  } = options || {};
  
  const schoolInfo = await getSchoolInfo();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${schoolInfo.name}</title>
  <style>
    @page {
      size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
      margin: 1in;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #333333;
      line-height: 1.5;
      font-size: 12pt;
    }
    
    .report-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
    }
    
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #dc2626;
      margin-bottom: 24px;
    }
    
    .report-logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .report-logo {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
    }
    
    .report-school-info {
      text-align: left;
    }
    
    .report-school-name {
      font-size: 18pt;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 4px 0;
    }
    
    .report-school-contact {
      font-size: 9pt;
      color: #666666;
      margin: 0;
    }
    
    .report-meta {
      text-align: right;
    }
    
    .report-title {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 4px 0;
    }
    
    .report-date {
      font-size: 10pt;
      color: #666666;
      margin: 0;
    }
    
    .report-body {
      min-height: 400px;
    }
    
    .report-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 9pt;
      color: #888888;
    }
    
    /* Table styles for reports */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }
    
    tr:hover {
      background-color: #fafafa;
    }
    
    /* Section styles */
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }
    
    .stat-card {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24pt;
      font-weight: 700;
      color: #dc2626;
    }
    
    .stat-label {
      font-size: 10pt;
      color: #666;
      margin-top: 4px;
    }
    
    /* Print styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .report-container {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div class="report-logo-section">
        ${showLogo ? `<img src="${schoolInfo.logo}" alt="${schoolInfo.name}" class="report-logo" />` : ''}
        <div class="report-school-info">
          <h1 class="report-school-name">${schoolInfo.name}</h1>
          ${schoolInfo.phone || schoolInfo.email ? `
          <p class="report-school-contact">
            ${schoolInfo.phone ? schoolInfo.phone : ''}
            ${schoolInfo.phone && schoolInfo.email ? ' | ' : ''}
            ${schoolInfo.email ? schoolInfo.email : ''}
          </p>
          ` : ''}
          ${schoolInfo.address ? `<p class="report-school-contact">${schoolInfo.address}</p>` : ''}
        </div>
      </div>
      <div class="report-meta">
        <h2 class="report-title">${title}</h2>
        ${showDate ? `<p class="report-date">Generated: ${currentDate}</p>` : ''}
      </div>
    </div>
    
    <div class="report-body">
      ${content}
    </div>
    
    ${showFooter ? `
    <div class="report-footer">
      <p>&copy; ${new Date().getFullYear()} ${schoolInfo.name}. All rights reserved.</p>
      <p>Powered by DojoFlow</p>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate a student roster report
 */
export async function generateStudentRosterReport(
  students: Array<{
    name: string;
    program: string;
    belt: string;
    status: string;
    phone?: string;
    email?: string;
  }>
): Promise<string> {
  const rows = students.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.program}</td>
      <td>${s.belt}</td>
      <td>${s.status}</td>
      <td>${s.phone || '-'}</td>
      <td>${s.email || '-'}</td>
    </tr>
  `).join('');

  const content = `
    <div class="section">
      <h3 class="section-title">Student Roster</h3>
      <p>Total Students: ${students.length}</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Program</th>
            <th>Belt</th>
            <th>Status</th>
            <th>Phone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  return wrapInReportTemplate('Student Roster', content);
}

/**
 * Generate an attendance report
 */
export async function generateAttendanceReport(
  period: string,
  stats: {
    totalClasses: number;
    totalAttendance: number;
    averageRate: number;
  },
  classData: Array<{
    className: string;
    date: string;
    attendance: number;
    capacity: number;
  }>
): Promise<string> {
  const rows = classData.map(c => `
    <tr>
      <td>${c.className}</td>
      <td>${c.date}</td>
      <td>${c.attendance}/${c.capacity}</td>
      <td>${Math.round((c.attendance / c.capacity) * 100)}%</td>
    </tr>
  `).join('');

  const content = `
    <div class="section">
      <h3 class="section-title">Attendance Summary - ${period}</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalClasses}</div>
          <div class="stat-label">Total Classes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalAttendance}</div>
          <div class="stat-label">Total Check-ins</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.averageRate}%</div>
          <div class="stat-label">Average Attendance</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Class Details</h3>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Date</th>
            <th>Attendance</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  return wrapInReportTemplate(`Attendance Report - ${period}`, content);
}

/**
 * Generate a revenue report
 */
export async function generateRevenueReport(
  period: string,
  stats: {
    totalRevenue: number;
    membershipRevenue: number;
    productRevenue: number;
    otherRevenue: number;
  },
  transactions: Array<{
    date: string;
    description: string;
    customer: string;
    amount: number;
    type: string;
  }>
): Promise<string> {
  const rows = transactions.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.description}</td>
      <td>${t.customer}</td>
      <td>${t.type}</td>
      <td style="text-align: right;">$${t.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <div class="section">
      <h3 class="section-title">Revenue Summary - ${period}</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">$${stats.totalRevenue.toLocaleString()}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${stats.membershipRevenue.toLocaleString()}</div>
          <div class="stat-label">Memberships</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${stats.productRevenue.toLocaleString()}</div>
          <div class="stat-label">Products</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${stats.otherRevenue.toLocaleString()}</div>
          <div class="stat-label">Other</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Transaction Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Customer</th>
            <th>Type</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  return wrapInReportTemplate(`Revenue Report - ${period}`, content);
}

/**
 * Generate a receipt/invoice
 */
export async function generateReceipt(
  receiptNumber: string,
  customer: {
    name: string;
    email?: string;
    phone?: string;
  },
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>,
  payment: {
    subtotal: number;
    tax: number;
    total: number;
    method: string;
    date: string;
  }
): Promise<string> {
  const itemRows = items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="text-align: right;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <h3 style="margin: 0 0 8px 0;">Bill To:</h3>
        <p style="margin: 0; font-weight: 600;">${customer.name}</p>
        ${customer.email ? `<p style="margin: 0; color: #666;">${customer.email}</p>` : ''}
        ${customer.phone ? `<p style="margin: 0; color: #666;">${customer.phone}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0;"><strong>Receipt #:</strong> ${receiptNumber}</p>
        <p style="margin: 0;"><strong>Date:</strong> ${payment.date}</p>
        <p style="margin: 0;"><strong>Payment:</strong> ${payment.method}</p>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right; border: none;"><strong>Subtotal:</strong></td>
          <td style="text-align: right; border: none;">$${payment.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; border: none;"><strong>Tax:</strong></td>
          <td style="text-align: right; border: none;">$${payment.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; border: none; font-size: 14pt;"><strong>Total:</strong></td>
          <td style="text-align: right; border: none; font-size: 14pt; color: #dc2626;"><strong>$${payment.total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>
    
    <div style="margin-top: 40px; padding: 16px; background: #f9f9f9; border-radius: 8px; text-align: center;">
      <p style="margin: 0; color: #666;">Thank you for your business!</p>
    </div>
  `;

  return wrapInReportTemplate(`Receipt #${receiptNumber}`, content, { showDate: false });
}
