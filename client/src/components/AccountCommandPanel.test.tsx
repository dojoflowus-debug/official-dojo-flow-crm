import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AccountCommandPanel } from './AccountCommandPanel'
import { BrowserRouter } from 'react-router-dom'

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      bio: '',
      photoUrl: null,
      role: 'user',
    },
    logout: vi.fn(),
    loading: false,
  }),
}))

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      auth: {
        me: { invalidate: vi.fn() },
      },
    }),
    auth: {
      updateProfile: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
      uploadProfilePicture: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
      deleteProfilePicture: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
    credits: {
      getBalance: {
        useQuery: () => ({
          data: { balance: 1000 },
        }),
      },
    },
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/components/BrandLogo', () => ({
  BrandLogo: () => <div>Brand Logo</div>,
}))

const mockOnClose = vi.fn()
const mockAnchorRef = { current: document.createElement('div') }

describe('AccountCommandPanel - Modal Layering & Pointer Events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset body styles
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''
  })

  it('should render modal with correct z-index when open', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    const modal = container.querySelector('[role="dialog"]')
    expect(modal).toBeInTheDocument()

    // Check z-index is z-50
    const computedStyle = window.getComputedStyle(modal!)
    const zIndex = computedStyle.zIndex
    expect(zIndex).toBe('50')
  })

  it('should render overlay with z-40 (below modal)', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    // Find the overlay (first fixed div with inset-0)
    const overlays = container.querySelectorAll('[style*="inset"]')
    let overlay = null
    for (const el of overlays) {
      const style = (el as HTMLElement).getAttribute('style')
      if (style?.includes('inset')) {
        overlay = el
        break
      }
    }

    expect(overlay).toBeInTheDocument()
    const computedStyle = window.getComputedStyle(overlay as HTMLElement)
    const zIndex = computedStyle.zIndex
    expect(zIndex).toBe('40')
  })

  it('should have pointer-events: auto on modal when open', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    const modal = container.querySelector('[role="dialog"]')
    const style = (modal as HTMLElement).getAttribute('style')
    
    // Check inline style has pointerEvents: auto
    expect(style).toContain('pointer-events')
    const computedStyle = window.getComputedStyle(modal!)
    expect(computedStyle.pointerEvents).toBe('auto')
  })

  it('should have pointer-events: none on modal when closed', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={false} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    const modal = container.querySelector('[role="dialog"]')
    const computedStyle = window.getComputedStyle(modal!)
    expect(computedStyle.pointerEvents).toBe('none')
  })

  it('should NOT set pointer-events: none on body', () => {
    render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    // Body should NOT have pointer-events: none
    expect(document.body.style.pointerEvents).not.toBe('none')
  })

  it('should set overflow: hidden on body when modal is open', () => {
    render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore overflow: auto on body when modal closes', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    expect(document.body.style.overflow).toBe('hidden')

    // Rerender with isOpen={false}
    rerender(
      <BrowserRouter>
        <AccountCommandPanel isOpen={false} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('auto')
    })
  })

  it('should allow clicking on modal sidebar items', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    const modal = container.querySelector('[role="dialog"]')
    expect(modal).toBeInTheDocument()

    // Modal should be clickable (pointer-events: auto)
    const computedStyle = window.getComputedStyle(modal!)
    expect(computedStyle.pointerEvents).toBe('auto')
  })

  it('should call onClose when clicking overlay', () => {
    const { container } = render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    // Find overlay and click it
    const overlays = container.querySelectorAll('div')
    for (const overlay of overlays) {
      const style = window.getComputedStyle(overlay)
      if (style.zIndex === '40' && style.position === 'fixed') {
        fireEvent.click(overlay)
        break
      }
    }

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal on Escape key', () => {
    render(
      <BrowserRouter>
        <AccountCommandPanel isOpen={true} onClose={mockOnClose} anchorRef={mockAnchorRef} />
      </BrowserRouter>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })
})
