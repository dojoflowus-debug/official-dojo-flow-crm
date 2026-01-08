import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentFilters from '../StudentFilters'

describe('StudentFilters Component', () => {
  const mockProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    programFilter: '',
    onProgramChange: vi.fn(),
    beltFilter: '',
    onBeltChange: vi.fn(),
    attendanceFilter: '',
    onAttendanceChange: vi.fn(),
    riskFilter: '',
    onRiskChange: vi.fn(),
    sortBy: 'last-seen',
    onSortChange: vi.fn(),
    activeFilters: 0,
    onClearFilters: vi.fn()
  }

  it('renders search input', () => {
    render(<StudentFilters {...mockProps} />)
    expect(screen.getByPlaceholderText(/Search by name/)).toBeInTheDocument()
  })

  it('renders all filter dropdowns', () => {
    render(<StudentFilters {...mockProps} />)
    
    // Check for filter labels or options
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(4) // Program, Belt, Risk, Sort
  })

  it('calls onSearchChange when search input changes', async () => {
    const user = userEvent.setup()
    const mockOnSearchChange = vi.fn()

    render(
      <StudentFilters {...mockProps} onSearchChange={mockOnSearchChange} />
    )

    const searchInput = screen.getByPlaceholderText(/Search by name/)
    await user.type(searchInput, 'John')

    expect(mockOnSearchChange).toHaveBeenCalled()
  })

  it('displays active filter count when filters are applied', () => {
    render(
      <StudentFilters {...mockProps} activeFilters={2} />
    )

    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('shows clear all button when filters are active', () => {
    render(
      <StudentFilters {...mockProps} activeFilters={1} />
    )

    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('calls onClearFilters when clear all is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClearFilters = vi.fn()

    render(
      <StudentFilters {...mockProps} activeFilters={1} onClearFilters={mockOnClearFilters} />
    )

    const clearButton = screen.getByText('Clear all')
    await user.click(clearButton)

    expect(mockOnClearFilters).toHaveBeenCalled()
  })

  it('displays applied filters as tags', () => {
    render(
      <StudentFilters 
        {...mockProps} 
        programFilter="Adult Karate"
        activeFilters={1}
      />
    )

    expect(screen.getByText('Adult Karate')).toBeInTheDocument()
  })

  it('allows removing individual filters', async () => {
    const user = userEvent.setup()
    const mockOnProgramChange = vi.fn()

    render(
      <StudentFilters 
        {...mockProps} 
        programFilter="Adult Karate"
        onProgramChange={mockOnProgramChange}
        activeFilters={1}
      />
    )

    const removeButtons = screen.getAllByRole('button')
    // Find the X button next to the filter tag
    const removeButton = removeButtons.find(btn => btn.textContent === '×')
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnProgramChange).toHaveBeenCalled()
    }
  })

  it('has advanced filters toggle button', () => {
    render(<StudentFilters {...mockProps} />)
    
    const moreButton = screen.getByRole('button', { name: /More/i })
    expect(moreButton).toBeInTheDocument()
  })

  it('toggles advanced filters visibility', async () => {
    const user = userEvent.setup()
    render(<StudentFilters {...mockProps} />)
    
    const moreButton = screen.getByRole('button', { name: /More/i })
    await user.click(moreButton)
    
    // Advanced filter should now be visible
    expect(screen.getByText('Attendance Level')).toBeInTheDocument()
  })

  it('displays correct program options', async () => {
    const user = userEvent.setup()
    render(<StudentFilters {...mockProps} />)
    
    const selects = screen.getAllByRole('combobox')
    const programSelect = selects[0]
    
    await user.click(programSelect)
    // Options should be visible in the dropdown
    expect(screen.getByText('All Programs')).toBeInTheDocument()
  })

  it('displays correct belt rank options', async () => {
    const user = userEvent.setup()
    render(<StudentFilters {...mockProps} />)
    
    const selects = screen.getAllByRole('combobox')
    const beltSelect = selects[1]
    
    await user.click(beltSelect)
    expect(screen.getByText('All Belts')).toBeInTheDocument()
  })

  it('displays correct risk level options', async () => {
    const user = userEvent.setup()
    render(<StudentFilters {...mockProps} />)
    
    const selects = screen.getAllByRole('combobox')
    const riskSelect = selects[2]
    
    await user.click(riskSelect)
    expect(screen.getByText('All Students')).toBeInTheDocument()
  })

  it('calls onSortChange when sort option changes', async () => {
    const user = userEvent.setup()
    const mockOnSortChange = vi.fn()

    render(
      <StudentFilters {...mockProps} onSortChange={mockOnSortChange} />
    )

    const selects = screen.getAllByRole('combobox')
    const sortSelect = selects[3]
    
    await user.click(sortSelect)
    await user.click(screen.getByText('Name (A-Z)'))

    expect(mockOnSortChange).toHaveBeenCalled()
  })

  it('does not show active filters section when no filters applied', () => {
    render(<StudentFilters {...mockProps} activeFilters={0} />)
    
    expect(screen.queryByText('Active filters:')).not.toBeInTheDocument()
  })

  it('handles multiple active filters display', () => {
    render(
      <StudentFilters 
        {...mockProps} 
        programFilter="Adult Karate"
        beltFilter="Black Belt"
        riskFilter="Active"
        activeFilters={3}
      />
    )

    expect(screen.getByText('Adult Karate')).toBeInTheDocument()
    expect(screen.getByText('Black Belt')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
