import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BillingSuccess from './BillingSuccess';
import * as useAuthModule from '@/_core/hooks/useAuth';

// Mock the useAuth hook
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('BillingSuccess Component', () => {
  beforeEach(() => {
    // Mock useAuth to return a user
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 1, name: 'Test User', activeOrgId: 1 },
      loading: false,
      error: null,
      isAuthenticated: true,
      refresh: vi.fn(),
      logout: vi.fn(),
    } as any);

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render invalid session message when no session_id', () => {
    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Invalid Session')).toBeInTheDocument();
    expect(screen.getByText('No checkout session found. Please try again.')).toBeInTheDocument();
  });

  it('should render trial success message when trial=true', () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Trial Activated! 🎉')).toBeInTheDocument();
    expect(screen.getByText('Your 7-day free trial is now active. Enjoy unlimited access to all premium features!')).toBeInTheDocument();
  });

  it('should render subscription success message when trial=false', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=false',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Subscription Activated!')).toBeInTheDocument();
    expect(screen.getByText('Your payment was successful and your subscription is now active.')).toBeInTheDocument();
  });

  it('should display trial-specific content when trial=true', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('You have 100 AI credits to explore Kai\'s capabilities')).toBeInTheDocument();
    expect(screen.getByText('Your trial expires in 7 days - no credit card required')).toBeInTheDocument();
  });

  it('should display subscription-specific content when trial=false', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=false',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Your AI credits have been added to your account')).toBeInTheDocument();
  });

  it('should display redirect countdown', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText(/Redirecting to dashboard in/)).toBeInTheDocument();
  });

  it('should have Go to Dashboard Now button', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Go to Dashboard Now')).toBeInTheDocument();
  });

  it('should have View Billing button', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('View Billing')).toBeInTheDocument();
  });

  it('should redirect to dashboard after countdown', async () => {
    vi.useFakeTimers();

    Object.defineProperty(window, 'location', {
      value: {
        search: '?session_id=cs_test_123&trial=true',
        href: '',
      },
      writable: true,
    });

    render(
      <BrowserRouter>
        <BillingSuccess />
      </BrowserRouter>
    );

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });

    vi.useRealTimers();
  });
});
