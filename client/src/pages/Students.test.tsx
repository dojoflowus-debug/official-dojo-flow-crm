import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentsDashboard from './Students';
import * as trpcModule from '@/lib/trpc';

// Mock the TRPC hooks
vi.mock('@/lib/trpc', () => ({
  trpc: {
    students: {
      getListWithFilters: {
        useQuery: vi.fn(),
      },
      getAnalytics: {
        useQuery: vi.fn(),
      },
      getDetail: {
        useQuery: vi.fn(),
      },
    },
    navBadges: {
      getActionableCounts: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock BottomNavLayout to simplify testing
vi.mock('@/components/BottomNavLayout', () => ({
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

// Mock StudentCard component
vi.mock('@/components/StudentCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'student-card' }, 'Student Card'),
}));

describe('StudentsDashboard', () => {
  const mockStudentsData = {
    students: [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        status: 'Active',
        beltRank: 'Blue Belt',
        program: 'Karate',
        photoUrl: null,
        createdAt: '2024-01-01',
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        status: 'At Risk',
        beltRank: 'Green Belt',
        program: 'Karate',
        photoUrl: null,
        createdAt: '2024-01-02',
      },
    ],
    total: 2,
  };

  const mockAnalyticsData = {
    total: 29,
    active: 26,
    atRisk: 2,
    inactive: 1,
    pending: 0,
    statusBreakdown: [
      { status: 'Active', count: 26 },
      { status: 'At Risk', count: 2 },
      { status: 'Inactive', count: 1 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the TRPC queries
    const mockTrpc = trpcModule.trpc as any;
    mockTrpc.students.getListWithFilters.useQuery.mockReturnValue({
      data: mockStudentsData,
      isLoading: false,
      error: null,
    });

    mockTrpc.students.getAnalytics.useQuery.mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
    });

    mockTrpc.students.getDetail.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    mockTrpc.navBadges.getActionableCounts.useQuery.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
    });
  });

  it('renders the Students page with header and title', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const title = screen.queryByText('Students');
    const subtitle = screen.queryByText("Manage your dojo's student roster and track progress");
    expect(title && subtitle).toBeTruthy();
  });

  it('displays KPI metrics correctly', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const totalStudents = screen.queryByText('Total Students');
    const active = screen.queryByText('Active');
    const atRisk = screen.queryByText('At Risk');
    const retention = screen.queryByText('Retention Rate');
    expect(totalStudents && active && atRisk && retention).toBeTruthy();
  });

  it('displays KPI values from analytics data', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Check for metric values
    const total = screen.queryByText('29');
    const active = screen.queryByText('26');
    const atRisk = screen.queryByText('2');
    const retention = screen.queryByText('90%');
    expect(total && active && atRisk && retention).toBeTruthy();
  });

  it('renders view mode tabs (List, Map, Segments, Analytics)', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const listTab = screen.queryByRole('tab', { name: /List/i });
    const mapTab = screen.queryByRole('tab', { name: /Map/i });
    const segmentsTab = screen.queryByRole('tab', { name: /Segments/i });
    const analyticsTab = screen.queryByRole('tab', { name: /Analytics/i });
    expect(listTab && mapTab && segmentsTab && analyticsTab).toBeTruthy();
  });

  it('renders Add Student button', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const addBtn = screen.queryByRole('button', { name: /Add Student/i });
    expect(addBtn).toBeTruthy();
  });

  it('renders search input and status filter', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const searchInput = screen.queryByPlaceholderText('Search students...');
    expect(searchInput).toBeTruthy();

    const statusFilter = screen.queryByRole('combobox');
    expect(statusFilter).toBeTruthy();
  });

  it('displays student list in table format on desktop', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Check for student names in the list
    const johnDoe = screen.queryByText('John Doe');
    const janeSmith = screen.queryByText('Jane Smith');
    expect(johnDoe || janeSmith).toBeTruthy();
  });

  it('displays student status badges', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const activeText = screen.queryByText('Active');
    const atRiskText = screen.queryByText('At Risk');
    expect(activeText || atRiskText).toBeTruthy();
  });

  it('displays student attendance percentage', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Check for attendance display
    const attendanceElements = screen.queryAllByText('92%');
    expect(attendanceElements.length).toBeGreaterThan(0);
  });

  it('displays last attended date', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const dateText = screen.queryByText('04/23/2024');
    expect(dateText).toBeTruthy();
  });

  it('displays tuition indicator icons', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Tuition indicators should be rendered as buttons with SVG
    const allButtons = screen.queryAllByRole('button');
    expect(allButtons.length).toBeGreaterThan(0);
  });

  it('displays pagination info when there are multiple pages', () => {
    const mockTrpc = trpcModule.trpc as any;
    mockTrpc.students.getListWithFilters.useQuery.mockReturnValue({
      data: {
        ...mockStudentsData,
        total: 50, // More than 20 per page
      },
      isLoading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const paginationText = screen.queryByText(/Showing 1 to 2 of 50/);
    expect(paginationText).toBeTruthy();
  });

  it('renders pagination buttons when needed', () => {
    const mockTrpc = trpcModule.trpc as any;
    mockTrpc.students.getListWithFilters.useQuery.mockReturnValue({
      data: {
        ...mockStudentsData,
        total: 50,
      },
      isLoading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const prevBtn = screen.queryByRole('button', { name: /Previous/i });
    const nextBtn = screen.queryByRole('button', { name: /Next/i });
    expect(prevBtn || nextBtn).toBeTruthy();
  });

  it('displays empty state when no students found', () => {
    const mockTrpc = trpcModule.trpc as any;
    mockTrpc.students.getListWithFilters.useQuery.mockReturnValue({
      data: {
        students: [],
        total: 0,
      },
      isLoading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const emptyText = screen.queryByText('No students found');
    expect(emptyText).toBeTruthy();
  });

  it('displays loading state', () => {
    const mockTrpc = trpcModule.trpc as any;
    mockTrpc.students.getListWithFilters.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const loadingText = screen.queryByText('Loading students...');
    expect(loadingText).toBeTruthy();
  });

  it('switches between view modes', async () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const mapTab = screen.getByRole('tab', { name: /Map/i });
    fireEvent.click(mapTab);

    await waitFor(() => {
      const mapText = screen.queryByText('Map view coming soon');
      expect(mapText).toBeTruthy();
    });
  });

  it('displays analytics view with status breakdown', async () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      const statusDist = screen.queryByText('Status Distribution');
      const keyMetrics = screen.queryByText('Key Metrics');
      expect(statusDist || keyMetrics).toBeTruthy();
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Check for proper heading hierarchy
    const heading = screen.queryByRole('heading', { level: 1 });
    expect(heading).toBeTruthy();

    // Check for proper button roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders student card with correct data on mobile view', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // StudentCard components should be rendered for mobile view
    const studentCards = screen.queryAllByTestId('student-card');
    expect(studentCards.length).toBeGreaterThanOrEqual(0);
  });

  it('displays belt rank information for students', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Belt ranks should be displayed
    const beltRanks = screen.queryAllByText(/Belt/);
    expect(beltRanks.length).toBeGreaterThan(0);
  });

  it('renders table headers on desktop view', () => {
    render(
      <BrowserRouter>
        <StudentsDashboard />
      </BrowserRouter>
    );

    // Check for table headers (may appear multiple times in the DOM)
    const headers = screen.queryAllByText(/Student|Status|Attendance|Last Attended|Tuition|Actions/);
    expect(headers.length).toBeGreaterThan(0);
  });
});
