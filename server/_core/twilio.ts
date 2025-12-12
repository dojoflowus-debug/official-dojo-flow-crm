/**
 * Twilio SMS and Voice Helper Functions
 * 
 * This module provides helper functions for sending SMS messages
 * and making voice calls using the Twilio API.
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SendSMSOptions {
  to: string;
  body: string;
  from?: string;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MakeCallOptions {
  to: string;
  twiml?: string;
  url?: string;
  from?: string;
}

interface MakeCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Send an SMS message using Twilio
 * 
 * @param options - SMS options including recipient and message body
 * @returns Promise with success status and message ID
 * 
 * @example
 * const result = await sendSMS({
 *   to: '+1234567890',
 *   body: 'Hello from DojoFlow!'
 * });
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('[Twilio] Missing Twilio credentials');
    return {
      success: false,
      error: 'Twilio credentials not configured'
    };
  }

  const from = options.from || TWILIO_PHONE_NUMBER;
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: options.to,
        From: from,
        Body: options.body
      }).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Twilio] SMS send failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to send SMS'
      };
    }

    console.log('[Twilio] SMS sent successfully:', data.sid);
    return {
      success: true,
      messageId: data.sid
    };
  } catch (error) {
    console.error('[Twilio] SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Make a voice call using Twilio
 * 
 * @param options - Call options including recipient and TwiML or URL
 * @returns Promise with success status and call ID
 * 
 * @example
 * // Using TwiML directly
 * const result = await makeCall({
 *   to: '+1234567890',
 *   twiml: '<Response><Say>Hello from DojoFlow!</Say></Response>'
 * });
 * 
 * // Using a TwiML URL
 * const result = await makeCall({
 *   to: '+1234567890',
 *   url: 'https://your-domain.com/api/twiml/greeting'
 * });
 */
export async function makeCall(options: MakeCallOptions): Promise<MakeCallResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('[Twilio] Missing Twilio credentials');
    return {
      success: false,
      error: 'Twilio credentials not configured'
    };
  }

  if (!options.twiml && !options.url) {
    return {
      success: false,
      error: 'Either twiml or url must be provided'
    };
  }

  const from = options.from || TWILIO_PHONE_NUMBER;
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    
    const params: Record<string, string> = {
      To: options.to,
      From: from
    };

    if (options.twiml) {
      params.Twiml = options.twiml;
    } else if (options.url) {
      params.Url = options.url;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Twilio] Call failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to make call'
      };
    }

    console.log('[Twilio] Call initiated successfully:', data.sid);
    return {
      success: true,
      callId: data.sid
    };
  } catch (error) {
    console.error('[Twilio] Call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a bulk SMS to multiple recipients
 * 
 * @param recipients - Array of phone numbers
 * @param body - Message body
 * @returns Promise with results for each recipient
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string
): Promise<{ sent: number; failed: number; results: SendSMSResult[] }> {
  const results: SendSMSResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    const result = await sendSMS({ to, body });
    results.push(result);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, results };
}
