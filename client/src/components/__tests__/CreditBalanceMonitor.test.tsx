import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CreditBalanceMonitor from '../CreditBalanceMonitor';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the trpc hook
vi.mock('../../utils/trpc', () => ({
  trpc: {
    credits: {
      getBalance: {
        useQuery: () => ({
          data: {
            creditsRemaining: 500,
            creditsUsed: 100,
            planAllowance: 1000,
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          isLoading: false,
          refetch: vi.fn(),
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

describe('CreditBalanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render compact version by default', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );
    
    expect(screen.getByText(/500 credits/)).toBeInTheDocument();
  });

  it('should display healthy balance with green indicator', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should display warning level when balance is low', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 30,
        creditsUsed: 970,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  it('should display critical level when balance is very low', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 5,
        creditsUsed: 995,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });
  });

  it('should display blocked level when balance is zero', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 0,
        creditsUsed: 1000,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('🚫')).toBeInTheDocument();
    });
  });

  it('should display detailed information when showDetails is true', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    expect(screen.getByText('Credit Balance: 500')).toBeInTheDocument();
    expect(screen.getByText('Used This Period')).toBeInTheDocument();
    expect(screen.getByText('Plan Allowance')).toBeInTheDocument();
    expect(screen.getByText('Renewal')).toBeInTheDocument();
  });

  it('should display progress bar in detailed view', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    // Check for progress bar text
    expect(screen.getByText(/% of plan allowance remaining/)).toBeInTheDocument();
  });

  it('should display correct percentage in progress bar', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    // 500 / 1000 = 50%
    expect(screen.getByText('50% of plan allowance remaining')).toBeInTheDocument();
  });

  it('should display renewal date when available', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    expect(screen.getByText(/Renewal/)).toBeInTheDocument();
  });

  it('should not render when organizationId is not provided', () => {
    const { container } = renderWithTheme(
      <CreditBalanceMonitor showDetails={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display loading state', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    const { container } = renderWithTheme(
      <CreditBalanceMonitor organizationId={1} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display healthy message for good balance', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    expect(screen.getByText(/You have 500 credits available/)).toBeInTheDocument();
  });

  it('should display warning message for low balance', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 30,
        creditsUsed: 970,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Warning: Low balance/)).toBeInTheDocument();
    });
  });

  it('should display critical message for very low balance', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 5,
        creditsUsed: 995,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Critical: Only 5 credits remaining/)).toBeInTheDocument();
    });
  });

  it('should display blocked message when no credits', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.credits.getBalance.useQuery).mockReturnValue({
      data: {
        creditsRemaining: 0,
        creditsUsed: 1000,
        planAllowance: 1000,
        renewalDate: new Date(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    await waitFor(() => {
      expect(screen.getByText(/No credits available/)).toBeInTheDocument();
    });
  });

  it('should display all credit statistics in detailed view', () => {
    renderWithTheme(
      <CreditBalanceMonitor organizationId={1} showDetails={true} />
    );

    expect(screen.getByText('100')).toBeInTheDocument(); // creditsUsed
    expect(screen.getByText('1000')).toBeInTheDocument(); // planAllowance
  });

  it('should have compact and detailed modes', () => {
    const { rerender } = renderWithTheme(
      <CreditBalanceMonitor organizationId={1} compact={true} />
    );

    expect(screen.getByText(/500 credits/)).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <CreditBalanceMonitor organizationId={1} compact={false} showDetails={true} />
      </ThemeProvider>
    );

    expect(screen.getByText('Credit Balance: 500')).toBeInTheDocument();
  });
});
