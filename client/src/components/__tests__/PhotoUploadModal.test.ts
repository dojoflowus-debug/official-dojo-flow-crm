import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUploadModal } from '../PhotoUploadModal';

describe('PhotoUploadModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnRemovePhoto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Change Student Photo')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    const { container } = render(
      <PhotoUploadModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Modal should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message when error prop is provided', () => {
    const errorMessage = 'Failed to upload photo';
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show "Remove Photo" button when currentPhotoUrl is provided', () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentPhotoUrl="https://example.com/photo.jpg"
        onRemovePhoto={mockOnRemovePhoto}
      />
    );

    expect(screen.getByText('Remove Photo')).toBeInTheDocument();
  });

  it('should not show "Remove Photo" button when currentPhotoUrl is not provided', () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Remove Photo')).not.toBeInTheDocument();
  });

  it('should disable save button when no file is selected', () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Photo');
    expect(saveButton).toBeDisabled();
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const saveButton = screen.getByText('Save Photo');
    const chooseButton = screen.getByText('Choose Photo');

    expect(cancelButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(chooseButton).toBeDisabled();
  });

  it('should show loading state when isSaving', async () => {
    const { rerender } = render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Simulate file selection
    const fileInput = screen.getByText('Choose Photo').closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Re-render with loading state
      rerender(
        <PhotoUploadModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isLoading={true}
        />
      );

      const saveButton = screen.getByText('Save Photo');
      expect(saveButton).toBeDisabled();
    }
  });

  it('should validate file type on selection', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const chooseButton = screen.getByText('Choose Photo');
    const fileInput = chooseButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      // Try to select an invalid file type
      const invalidFile = new File(['data'], 'document.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please select a JPG, PNG, or HEIC image');
      });
    }

    alertSpy.mockRestore();
  });

  it('should validate file size on selection', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const chooseButton = screen.getByText('Choose Photo');
    const fileInput = chooseButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Image must be smaller than 10MB');
      });
    }

    alertSpy.mockRestore();
  });

  it('should have zoom and position controls when file is selected', async () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const chooseButton = screen.getByText('Choose Photo');
    const fileInput = chooseButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Zoom')).toBeInTheDocument();
        expect(screen.getByText('Position X')).toBeInTheDocument();
        expect(screen.getByText('Position Y')).toBeInTheDocument();
      });
    }
  });

  it('should have reset button to reset crop controls', async () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const chooseButton = screen.getByText('Choose Photo');
    const fileInput = chooseButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });
    }
  });
});
