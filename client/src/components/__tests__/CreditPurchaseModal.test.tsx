import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreditPurchaseModal from '../CreditPurchaseModal';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the trpc hook
vi.mock('../../utils/trpc', () => ({
  trpc: {
    fluidPay: {
      purchaseCredits: {
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

describe('CreditPurchaseModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = renderWithTheme(
      <CreditPurchaseModal isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
  });

  it('should display all credit packages', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument();
  });

  it('should select Growth plan by default', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('should allow selecting different packages', async () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    
    const buttons = screen.getAllByText('Credits');
    fireEvent.click(buttons[0].closest('button')!);
    
    await waitFor(() => {
      expect(screen.getByText('500 credits per dollar')).toBeInTheDocument();
    });
  });

  it('should close modal when cancel button is clicked', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message when purchase fails', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.fluidPay.purchaseCredits.useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Payment failed')),
      isPending: false,
    } as any);

    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const purchaseButton = screen.getByText('Purchase Credits');
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('should display credit information box', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText(/How credits work:/)).toBeInTheDocument();
    expect(screen.getByText(/AI chats cost 1 credit/)).toBeInTheDocument();
  });

  it('should calculate credits per dollar correctly', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    
    // Growth plan: 1500 credits for $99.99 = ~15 credits per dollar
    expect(screen.getByText(/15\.0[0-9] credits per dollar/)).toBeInTheDocument();
  });

  it('should show savings for bulk packages', () => {
    renderWithTheme(
      <CreditPurchaseModal isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText(/Save \$/)).toBeInTheDocument();
  });
});
