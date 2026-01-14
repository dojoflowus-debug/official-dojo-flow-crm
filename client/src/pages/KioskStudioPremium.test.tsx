import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KioskStudioPremium from './KioskStudioPremium';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { trpc } from '@/lib/trpc';

// Mock TRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    kiosk: {
      listLocations: {
        useQuery: vi.fn(() => ({
          data: [{ id: 1, name: 'Main Dojo' }],
          isLoading: false,
        })),
      },
    },
    kioskDevice: {
      listByLocation: {
        useQuery: vi.fn(() => ({
          data: [{ id: 1, name: 'Lobby Kiosk', slug: 'lobby' }],
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
      getById: {
        useQuery: vi.fn(() => ({
          data: {
            id: 1,
            name: 'Lobby Kiosk',
            slug: 'lobby',
            draftConfig: {
              background: { type: 'solid', color: '#000000', blur: 0, dim: 0 },
              theme: { accentColor: '#ef4444', fontFamily: 'system' },
              typography: { titleSize: 48, titleWeight: 700, letterSpacing: 0, buttonFontSize: 16, subtitleSize: 14 },
              content: { leftTile: { title: 'Next Class' }, rightTile: { title: 'Today\'s Focus' } },
            },
            publishedConfig: null,
          },
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
      saveDraft: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({}),
          isLoading: false,
        })),
      },
      publish: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({}),
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock components
vi.mock('@/components/kiosk/KioskPreviewLive', () => ({
  default: ({ config }: any) => <div data-testid="preview">Preview: {config?.background?.type}</div>,
}));

vi.mock('@/components/DeviceEmulator', () => ({
  DeviceEmulator: ({ config, onOpenPublicKiosk }: any) => (
    <div data-testid="device-emulator">
      <button onClick={onOpenPublicKiosk}>Open Public</button>
    </div>
  ),
}));

vi.mock('@/components/KioskBackgroundPresets', () => ({
  KioskBackgroundPresets: ({ onSelectPreset }: any) => (
    <div data-testid="background-presets">
      <button onClick={() => onSelectPreset('preset1')}>Select Preset</button>
    </div>
  ),
}));

vi.mock('@/components/KioskBackgroundUpload', () => ({
  KioskBackgroundUpload: ({ onUploadSuccess }: any) => (
    <div data-testid="background-upload">
      <button onClick={() => onUploadSuccess('https://example.com/image.png')}>Upload</button>
    </div>
  ),
}));

vi.mock('@/components/Toast', () => ({
  default: ({ message, type }: any) => (
    <div data-testid={`toast-${type}`}>{message}</div>
  ),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <KioskStudioPremium />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('KioskStudioPremium - Functional Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the premium UI with command bar', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Kiosk Studio')).toBeInTheDocument();
      expect(screen.getByText('Lobby Kiosk')).toBeInTheDocument();
    });
  });

  it('should have save and publish buttons', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });
  });

  it('should display design modules (Background, Appearance, Typography, Content)', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Typography')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('should render the preview component', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('preview')).toBeInTheDocument();
    });
  });

  it('should render the device emulator', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('device-emulator')).toBeInTheDocument();
    });
  });

  it('should show "All saved" status when no changes', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('All saved')).toBeInTheDocument();
    });
  });

  it('should expand/collapse design modules on click', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Background')).toBeInTheDocument();
    });

    const backgroundButton = screen.getByRole('button', { name: /Background/ });
    await user.click(backgroundButton);

    // After clicking, the module should expand and show its content
    await waitFor(() => {
      expect(screen.getByText('Type')).toBeInTheDocument();
    });
  });

  it('should render background type selector', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Background')).toBeInTheDocument();
    });

    const backgroundButton = screen.getByRole('button', { name: /Background/ });
    await user.click(backgroundButton);

    await waitFor(() => {
      expect(screen.getByText('Type')).toBeInTheDocument();
    });
  });

  it('should have color picker for solid background', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Background')).toBeInTheDocument();
    });

    const backgroundButton = screen.getByRole('button', { name: /Background/ });
    await user.click(backgroundButton);

    await waitFor(() => {
      const colorInput = screen.getByDisplayValue('#000000');
      expect(colorInput).toBeInTheDocument();
    });
  });

  it('should have appearance controls (accent color, font family)', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    const appearanceButton = screen.getByRole('button', { name: /Appearance/ });
    await user.click(appearanceButton);

    await waitFor(() => {
      expect(screen.getByText('Accent Color')).toBeInTheDocument();
      expect(screen.getByText('Font Family')).toBeInTheDocument();
    });
  });

  it('should have typography controls (title size, weight, letter spacing, button size)', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Typography')).toBeInTheDocument();
    });

    const typographyButton = screen.getByRole('button', { name: /Typography/ });
    await user.click(typographyButton);

    await waitFor(() => {
      expect(screen.getByText('Title Size')).toBeInTheDocument();
      expect(screen.getByText('Title Weight')).toBeInTheDocument();
      expect(screen.getByText('Letter Spacing')).toBeInTheDocument();
      expect(screen.getByText('Button Size')).toBeInTheDocument();
    });
  });

  it('should have content controls (left and right tile titles)', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    const contentButton = screen.getByRole('button', { name: /Content/ });
    await user.click(contentButton);

    await waitFor(() => {
      expect(screen.getByText('Left Tile Title')).toBeInTheDocument();
      expect(screen.getByText('Right Tile Title')).toBeInTheDocument();
    });
  });

  it('should have open public kiosk button in device emulator', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Open Public')).toBeInTheDocument();
    });
  });
});
