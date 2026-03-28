import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentSettings from '../PaymentSettings';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the trpc hooks
vi.mock('../../utils/trpc', () => ({
  trpc: {
    fluidPay: {
      getPaymentProvider: {
        useQuery: () => ({
          data: {
            id: 'prov_123',
            status: 'connected',
            environment: 'SANDBOX',
            publicKeyLast4: '3BOf',
            merchantId: 'merchant_123',
            lastVerifiedAt: '2026-03-28T10:00:00Z',
          },
        }),
      },
      setupPaymentProvider: {
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

describe('PaymentSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment settings page', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText('Payment Settings')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should display environment information', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText(/Environment: SANDBOX/)).toBeInTheDocument();
  });

  it('should display form fields', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByLabelText('Public Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Private Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Merchant ID (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Environment')).toBeInTheDocument();
  });

  it('should have public key input field', () => {
    renderWithTheme(<PaymentSettings />);
    const publicKeyInput = screen.getByPlaceholderText('pub_...');
    expect(publicKeyInput).toBeInTheDocument();
  });

  it('should have private key input field with password type', () => {
    renderWithTheme(<PaymentSettings />);
    const privateKeyInput = screen.getByPlaceholderText('api_...');
    expect(privateKeyInput).toHaveAttribute('type', 'password');
  });

  it('should have merchant ID input field', () => {
    renderWithTheme(<PaymentSettings />);
    const merchantIdInput = screen.getByPlaceholderText('Your merchant ID');
    expect(merchantIdInput).toBeInTheDocument();
  });

  it('should have environment select with SANDBOX and PRODUCTION options', () => {
    renderWithTheme(<PaymentSettings />);
    const environmentSelect = screen.getByLabelText('Environment');
    expect(environmentSelect).toBeInTheDocument();
    expect(screen.getByText('Sandbox (Testing)')).toBeInTheDocument();
    expect(screen.getByText('Production (Live)')).toBeInTheDocument();
  });

  it('should have save button', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText('Save Payment Settings')).toBeInTheDocument();
  });

  it('should display helpful instructions', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText('How to get your Fluid Pay credentials:')).toBeInTheDocument();
    expect(screen.getByText(/Log in to your Fluid Pay merchant dashboard/)).toBeInTheDocument();
  });

  it('should allow entering public key', () => {
    renderWithTheme(<PaymentSettings />);
    const publicKeyInput = screen.getByPlaceholderText('pub_...') as HTMLInputElement;
    fireEvent.change(publicKeyInput, { target: { value: 'pub_test123' } });
    expect(publicKeyInput.value).toBe('pub_test123');
  });

  it('should allow entering private key', () => {
    renderWithTheme(<PaymentSettings />);
    const privateKeyInput = screen.getByPlaceholderText('api_...') as HTMLInputElement;
    fireEvent.change(privateKeyInput, { target: { value: 'api_test456' } });
    expect(privateKeyInput.value).toBe('api_test456');
  });

  it('should allow selecting different environment', () => {
    renderWithTheme(<PaymentSettings />);
    const environmentSelect = screen.getByLabelText('Environment') as HTMLSelectElement;
    fireEvent.change(environmentSelect, { target: { value: 'PRODUCTION' } });
    expect(environmentSelect.value).toBe('PRODUCTION');
  });

  it('should handle form submission', async () => {
    renderWithTheme(<PaymentSettings />);
    
    const publicKeyInput = screen.getByPlaceholderText('pub_...');
    const privateKeyInput = screen.getByPlaceholderText('api_...');
    const saveButton = screen.getByText('Save Payment Settings');

    fireEvent.change(publicKeyInput, { target: { value: 'pub_test123' } });
    fireEvent.change(privateKeyInput, { target: { value: 'api_test456' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should display success message after saving', async () => {
    renderWithTheme(<PaymentSettings />);
    
    const publicKeyInput = screen.getByPlaceholderText('pub_...');
    const privateKeyInput = screen.getByPlaceholderText('api_...');
    const saveButton = screen.getByText('Save Payment Settings');

    fireEvent.change(publicKeyInput, { target: { value: 'pub_test123' } });
    fireEvent.change(privateKeyInput, { target: { value: 'api_test456' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.fluidPay.setupPaymentProvider.useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Failed to save')),
      isPending: false,
    } as any);

    renderWithTheme(<PaymentSettings />);
    
    const publicKeyInput = screen.getByPlaceholderText('pub_...');
    const privateKeyInput = screen.getByPlaceholderText('api_...');
    const saveButton = screen.getByText('Save Payment Settings');

    fireEvent.change(publicKeyInput, { target: { value: 'pub_test123' } });
    fireEvent.change(privateKeyInput, { target: { value: 'api_test456' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
  });

  it('should display last verified timestamp', () => {
    renderWithTheme(<PaymentSettings />);
    expect(screen.getByText(/Last verified:/)).toBeInTheDocument();
  });

  it('should show loading state while saving', async () => {
    const { trpc } = await import('../../utils/trpc');
    vi.mocked(trpc.fluidPay.setupPaymentProvider.useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})),
      isPending: true,
    } as any);

    renderWithTheme(<PaymentSettings />);
    
    const publicKeyInput = screen.getByPlaceholderText('pub_...');
    const privateKeyInput = screen.getByPlaceholderText('api_...');
    const saveButton = screen.getByText('Save Payment Settings');

    fireEvent.change(publicKeyInput, { target: { value: 'pub_test123' } });
    fireEvent.change(privateKeyInput, { target: { value: 'api_test456' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});
