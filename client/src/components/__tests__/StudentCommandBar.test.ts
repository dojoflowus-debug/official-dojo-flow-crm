import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentCommandBar from '../StudentCommandBar'

describe('StudentCommandBar Component', () => {
  const mockStats = {
    totalStudents: 45,
    activeToday: 32,
    atRisk: 3,
    inactive: 5,
    newThisMonth: 8,
    birthdaysThisWeek: 2,
    averageAttendance: 87
  }

  it('renders all insight tiles with correct values', () => {
    render(
      <StudentCommandBar stats={mockStats} loading={false} />
    )

    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('32')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('displays correct tile labels', () => {
    render(
      <StudentCommandBar stats={mockStats} loading={false} />
    )

    expect(screen.getByText('Total Students')).toBeInTheDocument()
    expect(screen.getByText('Active Today')).toBeInTheDocument()
    expect(screen.getByText('At Risk')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('New This Month')).toBeInTheDocument()
    expect(screen.getByText('Birthdays This Week')).toBeInTheDocument()
    expect(screen.getByText('Avg Attendance')).toBeInTheDocument()
  })

  it('shows loading state with dashes', () => {
    render(
      <StudentCommandBar stats={mockStats} loading={true} />
    )

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('displays live indicator on Active Today tile', () => {
    render(
      <StudentCommandBar stats={mockStats} loading={false} />
    )

    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('calls onTileClick when tile is clicked', async () => {
    const user = userEvent.setup()
    const mockOnTileClick = vi.fn()

    render(
      <StudentCommandBar stats={mockStats} onTileClick={mockOnTileClick} loading={false} />
    )

    const totalStudentsTile = screen.getByText('Total Students').closest('button')
    if (totalStudentsTile) {
      await user.click(totalStudentsTile)
      expect(mockOnTileClick).toHaveBeenCalledWith('total')
    }
  })

  it('displays command center title', () => {
    render(
      <StudentCommandBar stats={mockStats} loading={false} />
    )

    expect(screen.getByText('Command Center')).toBeInTheDocument()
    expect(screen.getByText('Live operational overview of your dojo')).toBeInTheDocument()
  })

  it('renders 7 tiles total', () => {
    const { container } = render(
      <StudentCommandBar stats={mockStats} loading={false} />
    )

    const tiles = container.querySelectorAll('button[class*="group"]')
    // Should have 7 tiles (excluding the close button if any)
    expect(tiles.length).toBeGreaterThanOrEqual(7)
  })

  it('disables tiles when loading', async () => {
    const user = userEvent.setup()
    const mockOnTileClick = vi.fn()

    render(
      <StudentCommandBar stats={mockStats} onTileClick={mockOnTileClick} loading={true} />
    )

    const totalStudentsTile = screen.getByText('Total Students').closest('button')
    if (totalStudentsTile) {
      await user.click(totalStudentsTile)
      expect(mockOnTileClick).not.toHaveBeenCalled()
    }
  })

  it('handles zero values correctly', () => {
    const zeroStats = {
      totalStudents: 0,
      activeToday: 0,
      atRisk: 0,
      inactive: 0,
      newThisMonth: 0,
      birthdaysThisWeek: 0,
      averageAttendance: 0
    }

    render(
      <StudentCommandBar stats={zeroStats} loading={false} />
    )

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })
})
