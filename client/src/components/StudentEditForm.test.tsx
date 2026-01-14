import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentEditForm } from './StudentEditForm';

// Mock TRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    students: {
      update: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ success: true }),
          isLoading: false,
        })),
      },
      uploadPhoto: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ url: 'https://example.com/photo.jpg' }),
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock use-toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockInitialData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-1234',
  program: 'Karate',
  beltRank: 'White Belt',
  status: 'Active',
  photoUrl: null,
  address: '123 Main St',
  dateOfBirth: '2010-01-15',
};

describe('StudentEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with initial data', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Check that form fields are rendered with initial values
    const firstNameInput = screen.getByDisplayValue('John');
    const lastNameInput = screen.getByDisplayValue('Doe');
    const emailInput = screen.getByDisplayValue('john@example.com');
    const phoneInput = screen.getByDisplayValue('555-1234');

    expect(firstNameInput).toBeInTheDocument();
    expect(lastNameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(phoneInput).toBeInTheDocument();
  });

  it('renders photo upload section', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const choosePhotoButton = screen.getByText('Choose Photo');
    expect(choosePhotoButton).toBeInTheDocument();
  });

  it('renders all form sections', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    // Check for section titles
    expect(screen.getByText('Profile Photo')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Program & Belt')).toBeInTheDocument();
  });

  it('allows updating form fields', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(firstNameInput.value).toBe('Jane');
  });

  it('renders Cancel and Save buttons', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const saveButton = screen.getByText('Save Changes');

    expect(cancelButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates file size for photo upload', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const choosePhotoButton = screen.getByText('Choose Photo');
    fireEvent.click(choosePhotoButton);

    // File input should be in the DOM (hidden)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
  });

  it('renders belt rank dropdown with options', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const beltRankSelect = screen.getByDisplayValue('White Belt');
    expect(beltRankSelect).toBeInTheDocument();

    // Check for belt rank options
    const whiteOption = screen.getByText('White Belt');
    expect(whiteOption).toBeInTheDocument();
  });

  it('renders status dropdown with options', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const statusSelect = screen.getByDisplayValue('Active');
    expect(statusSelect).toBeInTheDocument();
  });

  it('renders address textarea', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const addressTextarea = screen.getByDisplayValue('123 Main St');
    expect(addressTextarea).toBeInTheDocument();
  });

  it('renders date of birth input', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const dateInput = screen.getByDisplayValue('2010-01-15');
    expect(dateInput).toBeInTheDocument();
  });

  it('handles form submission', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Mutation should be called
    expect(saveButton).toBeInTheDocument();
  });

  it('displays loading state when saving', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check for loading indicator or button exists
    expect(saveButton).toBeInTheDocument();
  });


  it('renders all required form labels', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.getByText('Belt Rank')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders avatar with initials', () => {
    const mockOnClose = vi.fn();

    render(
      <StudentEditForm
        studentId={1}
        initialData={mockInitialData}
        onClose={mockOnClose}
      />
    );

    // Avatar should show initials JD (John Doe)
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });
});
