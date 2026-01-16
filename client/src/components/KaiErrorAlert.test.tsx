import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KaiErrorAlert } from './KaiErrorAlert';

describe('KaiErrorAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should not render when error is null', () => {
    const { container } = render(
      <KaiErrorAlert error={null} onDismiss={vi.fn()} />
    );
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('should render error alert when error is provided', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} />
    );
    
    expect(screen.getByText('Service Error')).toBeInTheDocument();
    expect(screen.getByText(/AI service encountered an error/)).toBeInTheDocument();
  });

  it('should display timeout error correctly', () => {
    const error = {
      message: 'Request timed out',
      type: 'timeout' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} />
    );
    
    expect(screen.getByText('Request Timeout')).toBeInTheDocument();
    expect(screen.getByText(/took too long to respond/)).toBeInTheDocument();
  });

  it('should display network error correctly', () => {
    const error = {
      message: 'Network failed',
      type: 'network' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} />
    );
    
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect/)).toBeInTheDocument();
  });

  it('should display validation error correctly', () => {
    const error = {
      message: 'Invalid input',
      type: 'validation' as const,
      timestamp: new Date(),
      retryable: false
    };
    
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} />
    );
    
    expect(screen.getByText('Invalid Request')).toBeInTheDocument();
    expect(screen.getByText(/could not be processed/)).toBeInTheDocument();
  });

  it('should show retry button when error is retryable', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const onRetry = vi.fn();
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} onRetry={onRetry} />
    );
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('should not show retry button when error is not retryable', () => {
    const error = {
      message: 'Validation error',
      type: 'validation' as const,
      timestamp: new Date(),
      retryable: false
    };
    
    render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} />
    );
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const onDismiss = vi.fn();
    render(
      <KaiErrorAlert error={error} onDismiss={onDismiss} />
    );
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should call onDismiss when close button is clicked', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const onDismiss = vi.fn();
    const { container } = render(
      <KaiErrorAlert error={error} onDismiss={onDismiss} />
    );
    
    const closeButton = container.querySelector('button:last-child');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onDismiss).toHaveBeenCalled();
    }
  });

  it('should auto-dismiss after 10 seconds', async () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const onDismiss = vi.fn();
    render(
      <KaiErrorAlert error={error} onDismiss={onDismiss} />
    );
    
    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it('should apply dark theme styles when isDark is true', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const { container } = render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} isDark={true} />
    );
    
    const alertBox = container.querySelector('.bg-\\[\\#18181A\\]');
    expect(alertBox).toBeInTheDocument();
  });

  it('should apply cinematic theme styles when isCinematic is true', () => {
    const error = {
      message: 'Test error',
      type: 'server' as const,
      timestamp: new Date(),
      retryable: true
    };
    
    const { container } = render(
      <KaiErrorAlert error={error} onDismiss={vi.fn()} isCinematic={true} />
    );
    
    const alertBox = container.querySelector('.bg-black\\/80');
    expect(alertBox).toBeInTheDocument();
  });
});
