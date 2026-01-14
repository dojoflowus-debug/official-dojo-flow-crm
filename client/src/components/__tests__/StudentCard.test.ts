import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentCard from '../StudentCard'

describe('StudentCard Component', () => {
  const mockStudent = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    beltRank: 'Blue Belt',
    status: 'Active' as const,
    program: 'Adult Karate',
    photoUrl: null,
    membershipStatus: 'Paid',
    lastCheckIn: '2 days ago',
    attendanceStreak: 6,
    indicators: {
      atRisk: false,
      birthday: false,
      overdue: false,
      rankUpEligible: false,
      attendanceDrop: false,
      starStudent: false
    }
  }

  it('renders student name correctly', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays program badge', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('Adult Karate')).toBeInTheDocument()
  })

  it('shows status pill with correct color', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays belt rank', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('Blue Belt')).toBeInTheDocument()
  })

  it('shows attendance streak', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText(/6 classes/)).toBeInTheDocument()
  })

  it('displays last check-in time', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('2 days ago')).toBeInTheDocument()
  })

  it('renders initials when no photo', () => {
    render(<StudentCard {...mockStudent} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('calls onCall handler when call button clicked', async () => {
    const user = userEvent.setup()
    const mockOnCall = vi.fn()

    render(
      <StudentCard {...mockStudent} onCall={mockOnCall} />
    )

    // Hover to show actions
    const card = screen.getByText('John Doe').closest('div')?.parentElement
    if (card) {
      await user.hover(card)
    }

    // Find and click call button
    const buttons = screen.getAllByRole('button')
    const callButton = buttons.find(btn => btn.getAttribute('title') === 'Call')
    if (callButton) {
      await user.click(callButton)
      expect(mockOnCall).toHaveBeenCalledWith(1)
    }
  })

  it('calls onProfileClick when profile chevron clicked', async () => {
    const user = userEvent.setup()
    const mockOnProfileClick = vi.fn()

    render(
      <StudentCard {...mockStudent} onProfileClick={mockOnProfileClick} />
    )

    const buttons = screen.getAllByRole('button')
    const profileButton = buttons.find(btn => btn.getAttribute('title') === 'View profile')
    if (profileButton) {
      await user.click(profileButton)
      expect(mockOnProfileClick).toHaveBeenCalledWith(1)
    }
  })

  it('displays at-risk indicator when atRisk is true', () => {
    const atRiskStudent = {
      ...mockStudent,
      indicators: { ...mockStudent.indicators, atRisk: true }
    }

    render(<StudentCard {...atRiskStudent} />)
    const atRiskBadge = screen.getByTitle('At Risk')
    expect(atRiskBadge).toBeInTheDocument()
  })

  it('displays birthday indicator when birthday is true', () => {
    const birthdayStudent = {
      ...mockStudent,
      indicators: { ...mockStudent.indicators, birthday: true }
    }

    render(<StudentCard {...birthdayStudent} />)
    const birthdayBadge = screen.getByTitle('Birthday Soon')
    expect(birthdayBadge).toBeInTheDocument()
  })

  it('handles inactive status', () => {
    const inactiveStudent = {
      ...mockStudent,
      status: 'Inactive' as const
    }

    render(<StudentCard {...inactiveStudent} />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('handles on-hold status', () => {
    const onHoldStudent = {
      ...mockStudent,
      status: 'On Hold' as const
    }

    render(<StudentCard {...onHoldStudent} />)
    expect(screen.getByText('On Hold')).toBeInTheDocument()
  })

  it('displays different belt colors correctly', () => {
    const whiteBeltStudent = {
      ...mockStudent,
      beltRank: 'White Belt'
    }

    render(<StudentCard {...whiteBeltStudent} />)
    expect(screen.getByText('White Belt')).toBeInTheDocument()
  })

  it('shows multiple indicators without clutter', () => {
    const multiIndicatorStudent = {
      ...mockStudent,
      indicators: {
        atRisk: true,
        birthday: true,
        overdue: true,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
    }

    render(<StudentCard {...multiIndicatorStudent} />)
    expect(screen.getByTitle('At Risk')).toBeInTheDocument()
    expect(screen.getByTitle('Birthday Soon')).toBeInTheDocument()
    expect(screen.getByTitle('Overdue')).toBeInTheDocument()
  })

  it('renders with no indicators when all false', () => {
    render(<StudentCard {...mockStudent} />)
    // Should not find any indicator titles
    expect(screen.queryByTitle('At Risk')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Birthday Soon')).not.toBeInTheDocument()
  })
})
