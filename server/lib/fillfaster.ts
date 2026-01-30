/**
 * FillFaster API Client
 * Documentation: https://documenter.getpostman.com/view/18912453/2s8ZDVZ3UJ
 */

const FILLFASTER_API_BASE = 'https://api.fillfaster.com/v1';
const FILLFASTER_API_KEY = process.env.FILLFASTER_API_KEY;
const PC_BANKCARD_FORM_ID = 'jnukQqZkA3'; // PCBancard MPA Dojo + Quick App

if (!FILLFASTER_API_KEY) {
  console.warn('⚠️  FILLFASTER_API_KEY not found in environment variables');
}

interface FillFasterSubmissionResponse {
  submission_id: string;
  submission_link: string;
}

interface FillFasterSubmissionStatus {
  status: 'pending' | 'opened' | 'saved' | 'submitted';
  submitted_at?: string;
}

interface PCBankCardData {
  // Step 1: Business Information
  businessName: string;
  dbaName?: string;
  ein: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone: string;
  businessEmail: string;
  
  // Step 2: Owner Information
  ownerFirstName: string;
  ownerLastName: string;
  ownerTitle: string;
  ownerSSN: string;
  ownerDOB: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  ownerPhone: string;
  
  // Step 3: Bank Information
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  
  // Step 5: Processing Information
  monthlyVolume: number;
  averageTicket: number;
  highestTicket: number;
  
  // Step 6: Business Details
  websiteURL?: string;
  businessDescription: string;
}

/**
 * Create a submission link for PC Bank Card application
 * @param data Application data to prefill
 * @param userMetadata Internal metadata (not shown to user)
 * @returns Submission ID and link
 */
export async function createPCBankCardSubmission(
  data: PCBankCardData,
  userMetadata?: Record<string, any>
): Promise<FillFasterSubmissionResponse> {
  if (!FILLFASTER_API_KEY) {
    throw new Error('FILLFASTER_API_KEY is not configured');
  }

  // Map DojoFlow fields to FillFaster field names
  const prefillData = mapToFillFasterFormat(data);

  const response = await fetch(`${FILLFASTER_API_BASE}/createSubmission`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FILLFASTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fid: PC_BANKCARD_FORM_ID,
      prefill_data: prefillData,
      user_data: userMetadata,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FillFaster API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get submission status
 * @param submissionId FillFaster submission ID
 * @returns Submission status
 */
export async function getSubmissionStatus(
  submissionId: string
): Promise<FillFasterSubmissionStatus> {
  if (!FILLFASTER_API_KEY) {
    throw new Error('FILLFASTER_API_KEY is not configured');
  }

  const response = await fetch(
    `${FILLFASTER_API_BASE}/getSubmissionStatus?submission_id=${submissionId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FILLFASTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FillFaster API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get signed PDF document
 * @param submissionId FillFaster submission ID
 * @returns PDF buffer
 */
export async function getSubmissionPDF(
  submissionId: string
): Promise<Buffer> {
  if (!FILLFASTER_API_KEY) {
    throw new Error('FILLFASTER_API_KEY is not configured');
  }

  const response = await fetch(
    `${FILLFASTER_API_BASE}/getSubmissionPDF?submission_id=${submissionId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FILLFASTER_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FillFaster API error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Map DojoFlow form data to FillFaster field format
 * Note: Field names must match exactly what's defined in the FillFaster form template
 * @param data DojoFlow application data
 * @returns FillFaster prefill data
 */
function mapToFillFasterFormat(data: PCBankCardData): Record<string, any> {
  // This mapping needs to be verified against the actual FillFaster form fields
  // Use the getFormFields API endpoint to get the exact field names
  return {
    // Business Information
    'Business Name': data.businessName,
    'DBA Name': data.dbaName || '',
    'EIN': data.ein,
    'Business Address': data.businessAddress,
    'Business City': data.businessCity,
    'Business State': data.businessState,
    'Business ZIP': data.businessZip,
    'Business Phone': data.businessPhone,
    'Business Email': data.businessEmail,
    
    // Owner Information
    'Owner First Name': data.ownerFirstName,
    'Owner Last Name': data.ownerLastName,
    'Owner Title': data.ownerTitle,
    'Owner SSN': data.ownerSSN,
    'Owner DOB': data.ownerDOB,
    'Owner Address': data.ownerAddress,
    'Owner City': data.ownerCity,
    'Owner State': data.ownerState,
    'Owner ZIP': data.ownerZip,
    'Owner Phone': data.ownerPhone,
    
    // Bank Information
    'Bank Name': data.bankName,
    'Routing Number': data.routingNumber,
    'Account Number': data.accountNumber,
    
    // Processing Information
    'Monthly Volume': data.monthlyVolume.toString(),
    'Average Ticket': data.averageTicket.toString(),
    'Highest Ticket': data.highestTicket.toString(),
    
    // Business Details
    'Website URL': data.websiteURL || '',
    'Business Description': data.businessDescription,
  };
}
