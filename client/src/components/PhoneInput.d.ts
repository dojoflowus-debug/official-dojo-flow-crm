import { ReactNode } from 'react';

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  country?: string;
}

export default function PhoneInput(props: PhoneInputProps): ReactNode;
