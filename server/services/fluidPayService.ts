import crypto from 'crypto';

/**
 * Fluid Pay API Service
 * Handles all interactions with Fluid Pay payment processor
 * Supports both SANDBOX and PRODUCTION environments
 */

export interface FluidPayConfig {
  publicKey: string;
  privateKey: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  merchantId?: string;
}

export interface PaymentRequest {
  amount: number; // in cents
  currency: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
  message?: string;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: number;
  signature: string;
}

class FluidPayService {
  private config: FluidPayConfig;
  private baseUrl: string;

  constructor(config: FluidPayConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'SANDBOX' 
      ? 'https://sandbox.fluidpay.com/api/v1'
      : 'https://api.fluidpay.com/api/v1';
  }

  /**
   * Generate HMAC signature for request authentication
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.privateKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Make authenticated request to Fluid Pay API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const payload = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(payload);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.publicKey,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString(),
      },
      body: payload || undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fluid Pay API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a payment charge
   */
  async createCharge(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const payload = {
        amount: request.amount,
        currency: request.currency || 'USD',
        description: request.description,
        customerId: request.customerId,
        metadata: request.metadata || {},
      };

      const response = await this.makeRequest('POST', '/charges', payload);

      return {
        success: true,
        transactionId: response.id,
        status: response.status,
        message: 'Charge created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    planId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResponse> {
    try {
      const payload = {
        customerId,
        planId,
        metadata: metadata || {},
      };

      const response = await this.makeRequest('POST', '/subscriptions', payload);

      return {
        success: true,
        transactionId: response.id,
        status: response.status,
        message: 'Subscription created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve transaction details
   */
  async getTransaction(transactionId: string): Promise<any> {
    try {
      return await this.makeRequest('GET', `/transactions/${transactionId}`);
    } catch (error) {
      throw new Error(`Failed to retrieve transaction: ${error}`);
    }
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<PaymentResponse> {
    try {
      const payload = amount ? { amount } : {};
      const response = await this.makeRequest(
        'POST',
        `/transactions/${transactionId}/refund`,
        payload
      );

      return {
        success: true,
        transactionId: response.id,
        status: response.status,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Create a customer record
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResponse> {
    try {
      const payload = {
        email,
        name,
        metadata: metadata || {},
      };

      const response = await this.makeRequest('POST', '/customers', payload);

      return {
        success: true,
        transactionId: response.id,
        message: 'Customer created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List transactions for a customer
   */
  async listCustomerTransactions(customerId: string): Promise<any> {
    try {
      return await this.makeRequest('GET', `/customers/${customerId}/transactions`);
    } catch (error) {
      throw new Error(`Failed to list transactions: ${error}`);
    }
  }
}

export default FluidPayService;
