import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KioskBackgroundUpload } from './KioskBackgroundUpload';
import { trpc } from '../lib/trpc';

// Mock TRPC
vi.mock('../lib/trpc', () => ({
  trpc: {
    kioskDevice: {
      uploadBackground: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('KioskBackgroundUpload', () => {
  let mockOnUploadComplete: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUploadComplete = vi.fn();
    mockOnError = vi.fn();
    mockMutateAsync = vi.fn();

    // Mock the TRPC mutation
    vi.mocked(trpc.kioskDevice.uploadBackground.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: vi.fn(),
      isLoading: false,
      isPending: false,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      reset: vi.fn(),
      status: 'idle',
      variables: undefined,
    } as any);
  });

  it('renders upload button', () => {
    render(
      <KioskBackgroundUpload
        kioskId={1}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Choose Image')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    const { container } = render(
      <KioskBackgroundUpload
        kioskId={1}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Please select an image file');
    });
  });

  it('validates file size', async () => {
    const { container } = render(
      <KioskBackgroundUpload
        kioskId={1}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Image must be smaller than 5MB');
    });
  });

  it('uploads valid image file', async () => {
    mockMutateAsync.mockResolvedValue({ url: 'https://example.com/image.jpg' });

    const { container } = render(
      <KioskBackgroundUpload
        kioskId={1}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  it('handles upload errors', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Upload failed'));

    const { container } = render(
      <KioskBackgroundUpload
        kioskId={1}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });
});
