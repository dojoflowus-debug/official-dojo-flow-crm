import { ReactNode } from 'react';

export interface AddressAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (address: any) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete(props: AddressAutocompleteProps): ReactNode;
