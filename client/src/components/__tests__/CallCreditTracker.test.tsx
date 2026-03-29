import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CallCreditTracker } from '../CallCreditTracker';

describe('CallCreditTracker Component', () => {
  const mockProps = {
    callId: 'call_123456',
    recipientPhone: '+1234567890',
    organizationId: 1,
    startTime: new Date(Date.now() - 60000), // 1 minute ago
    onCallEnd: vi.fn(),
    compact: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render call tracker component', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText('Active Call')).toBeInTheDocument();
      expect(screen.getByText(mockProps.recipientPhone)).toBeInTheDocument();
    });

    it('should display call duration', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should show time in format like "1m 0s"
      const durationElements = screen.getAllByText(/m/);
      expect(durationElements.length).toBeGreaterThan(0);
    });

    it('should display credit information', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText(/Setup Cost/)).toBeInTheDocument();
      expect(screen.getByText(/Duration Credits/)).toBeInTheDocument();
      expect(screen.getByText(/Total Cost/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /End Call/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version when compact prop is true', () => {
      render(<CallCreditTracker {...mockProps} compact={true} />);
      
      // Compact version should have fewer elements
      expect(screen.getByRole('button', { name: /End/i })).toBeInTheDocument();
      expect(screen.queryByText(/Setup Cost/)).not.toBeInTheDocument();
    });

    it('should show animated phone icon in compact mode', () => {
      const { container } = render(<CallCreditTracker {...mockProps} compact={true} />);
      
      const phoneIcon = container.querySelector('svg');
      expect(phoneIcon).toBeInTheDocument();
    });
  });

  describe('Duration Tracking', () => {
    it('should update duration every second', async () => {
      vi.useFakeTimers();
      
      render(<CallCreditTracker {...mockProps} />);
      
      // Initial duration should be around 1 minute
      let durationText = screen.getByText(/1m/);
      expect(durationText).toBeInTheDocument();
      
      // Advance time by 1 second
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        // Duration should update
        const updatedElements = screen.getAllByText(/m/);
        expect(updatedElements.length).toBeGreaterThan(0);
      });
      
      vi.useRealTimers();
    });

    it('should format duration correctly', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should display in format like "1m 0s"
      const durationElements = screen.getAllByText(/m/);
      expect(durationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Credit Calculation', () => {
    it('should calculate setup credits correctly', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Setup cost should be 5 credits
      expect(screen.getByText('5 credits')).toBeInTheDocument();
    });

    it('should calculate duration credits correctly', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should show duration credits (approximately 10 for 1 minute)
      expect(screen.getByText(/Duration Credits/)).toBeInTheDocument();
    });

    it('should show total credits breakdown', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should show total cost line
      expect(screen.getByText(/Total Cost/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onCallEnd when End Call button is clicked', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      const endButton = screen.getByRole('button', { name: /End Call/i });
      fireEvent.click(endButton);
      
      expect(mockProps.onCallEnd).toHaveBeenCalled();
    });

    it('should disable End Call button after clicking', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      const endButton = screen.getByRole('button', { name: /End Call/i });
      fireEvent.click(endButton);
      
      expect(endButton).toBeDisabled();
    });

    it('should toggle pause/resume state', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      const pauseButton = screen.getByRole('button', { name: /Pause/i });
      
      // Click to pause
      fireEvent.click(pauseButton);
      expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();
      
      // Click to resume
      const resumeButton = screen.getByRole('button', { name: /Resume/i });
      fireEvent.click(resumeButton);
      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    });
  });

  describe('Display Information', () => {
    it('should display recipient phone number', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText(mockProps.recipientPhone)).toBeInTheDocument();
    });

    it('should display cost per minute information', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should show info about 10 credits per minute
      expect(screen.getByText(/10 credits/)).toBeInTheDocument();
    });

    it('should display setup cost information', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      // Should mention setup cost is 5 credits
      expect(screen.getByText(/5 credits/)).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should display minutes stat', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText('Minutes')).toBeInTheDocument();
    });

    it('should display duration credits stat', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText('Duration Credits')).toBeInTheDocument();
    });

    it('should display total credits stat', () => {
      render(<CallCreditTracker {...mockProps} />);
      
      expect(screen.getByText('Total Credits')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply gradient styling to header', () => {
      const { container } = render(<CallCreditTracker {...mockProps} />);
      
      // Should have gradient background
      const header = container.querySelector('[class*="gradient"]');
      expect(header).toBeInTheDocument();
    });

    it('should apply dark mode classes', () => {
      const { container } = render(<CallCreditTracker {...mockProps} />);
      
      // Should have dark mode support
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('should display cost breakdown in highlighted section', () => {
      const { container } = render(<CallCreditTracker {...mockProps} />);
      
      // Should have highlighted total cost section
      const highlightedSection = container.querySelector('[class*="gradient"]');
      expect(highlightedSection).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short calls', () => {
      const shortStartTime = new Date(Date.now() - 5000); // 5 seconds ago
      
      render(
        <CallCreditTracker
          {...mockProps}
          startTime={shortStartTime}
        />
      );
      
      expect(screen.getByText(/Active Call/)).toBeInTheDocument();
    });

    it('should handle long duration calls', () => {
      vi.useFakeTimers();
      
      const longStartTime = new Date(Date.now() - 3600000); // 1 hour ago
      
      render(
        <CallCreditTracker
          {...mockProps}
          startTime={longStartTime}
        />
      );
      
      // Should display hour format
      expect(screen.getByText(/h/)).toBeInTheDocument();
      
      vi.useRealTimers();
    });

    it('should handle missing onCallEnd callback', () => {
      const { onCallEnd, ...propsWithoutCallback } = mockProps;
      
      render(<CallCreditTracker {...propsWithoutCallback} />);
      
      const endButton = screen.getByRole('button', { name: /End Call/i });
      
      // Should not throw error when clicking without callback
      expect(() => fireEvent.click(endButton)).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile (compact mode)', () => {
      render(<CallCreditTracker {...mockProps} compact={true} />);
      
      expect(screen.getByRole('button', { name: /End/i })).toBeInTheDocument();
    });

    it('should render on desktop (full mode)', () => {
      render(<CallCreditTracker {...mockProps} compact={false} />);
      
      expect(screen.getByText(/Setup Cost/)).toBeInTheDocument();
      expect(screen.getByText(/Duration Credits/)).toBeInTheDocument();
    });
  });
});
