import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionPlans from '../SubscriptionPlans';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the trpc hook
vi.mock('../../utils/trpc', () => ({
  trpc: {
    fluidPay: {
      subscribeToplan: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ success: true }),
          isPending: false,
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

describe('SubscriptionPlans', () => {
  const mockOnSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all subscription plans', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });

  it('should mark Growth plan as most popular', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const popularBadges = screen.getAllByText('Most Popular');
    expect(popularBadges.length).toBe(1);
  });

  it('should display correct pricing for each plan', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    expect(screen.getByText('$49')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('$199')).toBeInTheDocument();
    expect(screen.getByText('$499')).toBeInTheDocument();
  });

  it('should display correct credit amounts for each plan', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    expect(screen.getByText('500 credits/month')).toBeInTheDocument();
    expect(screen.getByText('1,500 credits/month')).toBeInTheDocument();
    expect(screen.getByText('4,000 credits/month')).toBeInTheDocument();
    expect(screen.getByText('10,000 credits/month')).toBeInTheDocument();
  });

  it('should display plan features', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    expect(screen.getByText(/Basic support/)).toBeInTheDocument();
    expect(screen.getByText(/Priority support/)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 phone support/)).toBeInTheDocument();
  });

  it('should have subscribe buttons for each plan', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const subscribeButtons = screen.getAllByText('Subscribe');
    expect(subscribeButtons.length).toBe(4);
  });

  it('should handle subscription when subscribe button is clicked', async () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const subscribeButtons = screen.getAllByText('Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(mockOnSubscribe).toHaveBeenCalled();
    });
  });

  it('should display FAQ section', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText(/Can I change my plan anytime/)).toBeInTheDocument();
    expect(screen.getByText(/What happens to unused credits/)).toBeInTheDocument();
  });

  it('should display monthly billing label', () => {
    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const monthLabels = screen.getAllByText('/month');
    expect(monthLabels.length).toBeGreaterThan(0);
  });

  it('should display error message when subscription fails', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.fluidPay.subscribeToplan.useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Subscription failed')),
      isPending: false,
    } as any);

    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const subscribeButtons = screen.getAllByText('Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Subscription failed')).toBeInTheDocument();
    });
  });

  it('should show loading state when subscribing', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.fluidPay.subscribeToplan.useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})),
      isPending: true,
    } as any);

    renderWithTheme(
      <SubscriptionPlans onSubscribe={mockOnSubscribe} />
    );

    const subscribeButtons = screen.getAllByText('Subscribe');
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});
