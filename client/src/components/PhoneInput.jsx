import React, { useState, useEffect } from 'react';

/**
 * Phone Input Component with Auto-Formatting
 * Formats phone numbers as user types based on country
 */

// Phone formatting functions
const formatPhoneUS = (value) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

const formatPhoneUK = (value) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) {
    return `+44 ${digits}`;
  } else if (digits.length <= 6) {
    return `+44 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  } else {
    return `+44 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
  }
};

const normalizePhone = (value) => {
  // Remove all non-digits
  return value.replace(/\D/g, '');
};

export default function PhoneInput({ 
  value, 
  onChange, 
  country = 'United States',
  className = '',
  placeholder = '',
  required = false,
  disabled = false
}) {
  const [displayValue, setDisplayValue] = useState('');

  // Update display value when prop value changes
  useEffect(() => {
    if (value) {
      // Format the value for display
      const formatted = formatPhone(value, country);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value, country]);

  const formatPhone = (phone, country) => {
    if (!phone) return '';
    
    const digits = normalizePhone(phone);
    
    switch (country) {
      case 'United States':
      case 'Canada':
        return formatPhoneUS(digits);
      case 'United Kingdom':
        return formatPhoneUK(digits);
      default:
        return formatPhoneUS(digits);
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    
    // Remove all non-digits
    const digits = normalizePhone(input);
    
    // Limit length based on country
    let maxLength = 10; // US/Canada
    if (country === 'United Kingdom') maxLength = 11;
    
    if (digits.length > maxLength) {
      return; // Don't allow more digits
    }
    
    // Format for display
    const formatted = formatPhone(digits, country);
    setDisplayValue(formatted);
    
    // Pass normalized digits to parent
    onChange(digits);
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (country) {
      case 'United States':
      case 'Canada':
        return '(281) 818-9288';
      case 'United Kingdom':
        return '+44 20 7946 0958';
      default:
        return '(281) 818-9288';
    }
  };

  return (
    <input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={getPlaceholder()}
      required={required}
      disabled={disabled}
    />
  );
}

