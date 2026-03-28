import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentHistory from '../PaymentHistory';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock payment data
const mockPaymentData = {
  payments: [
    {
      id: '1',
      type: 'charge' as const,
      amount: 99.99,
      credits: 1500,
      status: 'completed' as const,
      date: '2026-03-28T10:00:00Z',
      description: 'Purchase 1500 credits',
      transactionId: 'txn_123',
    },
    {
      id: '2',
      type: 'subscription' as const,
      amount: 49.99,
      credits: 500,
      status: 'completed' as const,
      date: '2026-03-27T10:00:00Z',
      description: 'Starter Plan - Monthly',
      transactionId: 'sub_456',
    },
    {
      id: '3',
      type: 'charge' as const,
      amount: 299.99,
      credits: 5000,
      status: 'pending' as const,
      date: '2026-03-26T10:00:00Z',
      description: 'Purchase 5000 credits',
      transactionId: 'txn_789',
    },
  ],
  total: 3,
};

// Mock the trpc hook
vi.mock('../../utils/trpc', () => ({
  trpc: {
    fluidPay: {
      getPaymentHistory: {
        useQuery: () => ({
          data: mockPaymentData,
          isLoading: false,
        }),
      },
    },
  },
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('PaymentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment history page', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Payment History')).toBeInTheDocument();
  });

  it('should display filter buttons', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('All Transactions')).toBeInTheDocument();
    expect(screen.getByText('One-time Purchase')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Refund')).toBeInTheDocument();
  });

  it('should display all transactions by default', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Purchase 1500 credits')).toBeInTheDocument();
    expect(screen.getByText('Starter Plan - Monthly')).toBeInTheDocument();
    expect(screen.getByText('Purchase 5000 credits')).toBeInTheDocument();
  });

  it('should filter by charge type', () => {
    renderWithTheme(<PaymentHistory />);
    const chargeFilter = screen.getByText('One-time Purchase');
    fireEvent.click(chargeFilter);

    expect(screen.getByText('Purchase 1500 credits')).toBeInTheDocument();
    expect(screen.getByText('Purchase 5000 credits')).toBeInTheDocument();
  });

  it('should filter by subscription type', () => {
    renderWithTheme(<PaymentHistory />);
    const subscriptionFilter = screen.getByText('Subscription');
    fireEvent.click(subscriptionFilter);

    expect(screen.getByText('Starter Plan - Monthly')).toBeInTheDocument();
  });

  it('should display transaction amounts', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('$299.99')).toBeInTheDocument();
  });

  it('should display credit amounts', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('+1,500')).toBeInTheDocument();
    expect(screen.getByText('+500')).toBeInTheDocument();
    expect(screen.getByText('+5,000')).toBeInTheDocument();
  });

  it('should display transaction status badges', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('Total Credits')).toBeInTheDocument();
    expect(screen.getByText('Avg. Cost per Credit')).toBeInTheDocument();
  });

  it('should calculate total spent correctly', () => {
    renderWithTheme(<PaymentHistory />);
    // 99.99 + 49.99 + 299.99 = 449.97
    expect(screen.getByText('$449.97')).toBeInTheDocument();
  });

  it('should calculate total credits correctly', () => {
    renderWithTheme(<PaymentHistory />);
    // 1500 + 500 + 5000 = 7000
    expect(screen.getByText('7,000')).toBeInTheDocument();
  });

  it('should calculate average cost per credit', () => {
    renderWithTheme(<PaymentHistory />);
    // 449.97 / 7000 = 0.0643 per credit
    expect(screen.getByText(/\$0\.064[0-9]/)).toBeInTheDocument();
  });

  it('should display loading state when data is loading', () => {
    vi.mocked(require('../../utils/trpc').trpc.fluidPay.getPaymentHistory.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Loading payment history...')).toBeInTheDocument();
  });

  it('should display empty state when no transactions', () => {
    vi.mocked(require('../../utils/trpc').trpc.fluidPay.getPaymentHistory.useQuery).mockReturnValue({
      data: { payments: [], total: 0 },
      isLoading: false,
    } as any);

    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText(/No transactions found/)).toBeInTheDocument();
  });

  it('should display table headers', () => {
    renderWithTheme(<PaymentHistory />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    renderWithTheme(<PaymentHistory />);
    // Check that dates are formatted (exact format depends on locale)
    const dateElements = screen.getAllByText(/\d+\/\d+\/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
