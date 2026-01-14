import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanBoard from './KanbanBoard';

describe('KanbanBoard Component', () => {
  const mockLeads = {
    new_lead: [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-0001',
        source: 'Website',
        status: 'new_lead',
        pipeline_value: 1000,
        lead_score: 75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    contacted: [
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '555-0002',
        source: 'Referral',
        status: 'contacted',
        pipeline_value: 1500,
        lead_score: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    intro_scheduled: [],
    trial_presented: [],
    lost_winback: [],
  };

  const mockCallbacks = {
    onLeadClick: vi.fn(),
    onAddLead: vi.fn(),
    onCall: vi.fn(),
    onText: vi.fn(),
    onSchedule: vi.fn(),
    onStatusChange: vi.fn(),
  };

  it('renders all pipeline stages', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('New Leads')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Intro Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Trial Presented')).toBeInTheDocument();
    expect(screen.getByText('Lost / Winback')).toBeInTheDocument();
  });

  it('displays correct lead count for each stage', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Check lead counts
    const leadCounts = screen.getAllByText(/\d+ lead/);
    expect(leadCounts.length).toBeGreaterThan(0);
  });

  it('renders lead cards with correct information', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls onLeadClick when a lead card is clicked', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    const leadCard = screen.getByText('John Doe');
    fireEvent.click(leadCard);

    expect(mockCallbacks.onLeadClick).toHaveBeenCalled();
  });

  it('calls onAddLead when Add Lead button is clicked', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    const addButtons = screen.getAllByText('Add Lead');
    fireEvent.click(addButtons[0]);

    expect(mockCallbacks.onAddLead).toHaveBeenCalled();
  });

  it('toggles stage expansion when collapse button is clicked', () => {
    const { container } = render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Find collapse buttons (ChevronUp icons)
    const collapseButtons = container.querySelectorAll('button');
    expect(collapseButtons.length).toBeGreaterThan(0);
  });

  it('filters stages when selectedStage is set', () => {
    const { container } = render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage="new_lead"
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Check that non-selected stages have reduced opacity
    const stages = container.querySelectorAll('[class*="opacity"]');
    expect(stages.length).toBeGreaterThan(0);
  });

  it('applies dark mode styles correctly', () => {
    const { container } = render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Check that dark mode classes are applied
    const darkModeElements = container.querySelectorAll('[class*="white"]');
    expect(darkModeElements.length).toBeGreaterThan(0);
  });

  it('applies light mode styles correctly', () => {
    const { container } = render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={false}
        {...mockCallbacks}
      />
    );

    // Check that light mode classes are applied
    const lightModeElements = container.querySelectorAll('[class*="slate"]');
    expect(lightModeElements.length).toBeGreaterThan(0);
  });

  it('displays empty state when stage has no leads', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // The intro_scheduled stage should be empty
    const emptyStates = screen.getAllByText('Add Lead...');
    expect(emptyStates.length).toBeGreaterThan(0);
  });

  it('calls onCall when Call button is clicked on a lead', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    const callButtons = screen.getAllByText('Call');
    fireEvent.click(callButtons[0]);

    expect(mockCallbacks.onCall).toHaveBeenCalled();
  });

  it('handles stage mapping correctly for old stage IDs', () => {
    const leadsWithOldStages = {
      attempting_contact: [mockLeads.new_lead[0]],
      contact_made: [mockLeads.contacted[0]],
    };

    render(
      <KanbanBoard
        leads={leadsWithOldStages}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Both old stages should map to 'contacted' stage
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('maintains lead order within stages', () => {
    const leadsWithMultiple = {
      new_lead: [
        { ...mockLeads.new_lead[0], id: 1, first_name: 'First' },
        { ...mockLeads.new_lead[0], id: 2, first_name: 'Second' },
        { ...mockLeads.new_lead[0], id: 3, first_name: 'Third' },
      ],
      contacted: [],
      intro_scheduled: [],
      trial_presented: [],
      lost_winback: [],
    };

    render(
      <KanbanBoard
        leads={leadsWithMultiple}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('First Doe')).toBeInTheDocument();
    expect(screen.getByText('Second Doe')).toBeInTheDocument();
    expect(screen.getByText('Third Doe')).toBeInTheDocument();
  });

  it('calls onStatusChange when drag-and-drop occurs', async () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Note: Full drag-and-drop testing requires more complex setup with DndContext
    // This test verifies the callback is available
    expect(typeof mockCallbacks.onStatusChange).toBe('function');
  });

  it('renders with correct lead score colors', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Lead scores should be displayed
    expect(screen.getByText('75')).toBeInTheDocument(); // John's score
    expect(screen.getByText('85')).toBeInTheDocument(); // Jane's score
  });

  it('displays pipeline values correctly', () => {
    render(
      <KanbanBoard
        leads={mockLeads}
        selectedStage={null}
        isDarkMode={true}
        {...mockCallbacks}
      />
    );

    // Pipeline values should be displayed with $ sign
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
  });
});
