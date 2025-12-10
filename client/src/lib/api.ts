/**
 * API client for DojoFlow Kiosk backend
 */

const API_BASE_URL = 'https://5000-is8una2ov9qox2fg0tlcd-a7881f62.manusvm.computer/api/kiosk';

export interface CheckInData {
  student_id: number;
  class_name?: string;
}

export interface VisitorData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  interest?: string;
  trial_date?: string;
  notes?: string;
}

export interface WaiverData {
  name: string;
  email?: string;
  phone?: string;
  waiver_type: 'Adult' | 'Minor';
  signature_data: string;
}

export interface PaymentData {
  student_id?: number;
  amount: number;
  payment_type: string;
  payment_method?: string;
  status?: string;
  notes?: string;
}

export interface StudentSearchData {
  type: 'phone' | 'qr' | 'name';
  value: string;
}

class KioskAPI {
  // Check-In APIs
  async createCheckIn(data: CheckInData) {
    const response = await fetch(`${API_BASE_URL}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async searchStudent(data: StudentSearchData) {
    const response = await fetch(`${API_BASE_URL}/checkin/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getRecentCheckIns() {
    const response = await fetch(`${API_BASE_URL}/checkin/recent`);
    return response.json();
  }

  // Visitor/Lead APIs
  async createVisitor(data: VisitorData) {
    const response = await fetch(`${API_BASE_URL}/visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getRecentVisitors() {
    const response = await fetch(`${API_BASE_URL}/visitor/recent`);
    return response.json();
  }

  // Waiver APIs
  async createWaiver(data: WaiverData) {
    const response = await fetch(`${API_BASE_URL}/waiver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getRecentWaivers() {
    const response = await fetch(`${API_BASE_URL}/waiver/recent`);
    return response.json();
  }

  async getWaiver(id: number) {
    const response = await fetch(`${API_BASE_URL}/waiver/${id}`);
    return response.json();
  }

  // Payment APIs
  async createPayment(data: PaymentData) {
    const response = await fetch(`${API_BASE_URL}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getRecentPayments() {
    const response = await fetch(`${API_BASE_URL}/payment/recent`);
    return response.json();
  }

  // Stats/Dashboard APIs
  async getTodayStats() {
    const response = await fetch(`${API_BASE_URL}/stats/today`);
    return response.json();
  }
}

export const kioskAPI = new KioskAPI();

