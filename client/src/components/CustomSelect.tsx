import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  isDark?: boolean;
  error?: boolean;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  isDark = true,
  error = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  // Calculate dropdown position based on trigger button viewport position
  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(options.length * 44 + 8, 300);
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      ...(openUpward
        ? { bottom: viewportHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4, bottom: 'auto' }),
    });
  }, [options.length]);

  const handleOpen = () => {
    updateDropdownPosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const portalDropdown = document.querySelector('[data-custom-select-dropdown]');
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!portalDropdown || !portalDropdown.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => updateDropdownPosition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const dropdown = isOpen ? (
    <div
      data-custom-select-dropdown="true"
      style={{
        ...dropdownStyle,
        maxHeight: '300px',
        overflowY: 'auto',
        borderRadius: '12px',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
        background: isDark ? '#111113' : '#ffffff',
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!option.disabled) handleSelect(option.value);
          }}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            textAlign: 'left',
            fontSize: '15px',
            cursor: option.disabled ? 'not-allowed' : 'pointer',
            color: option.disabled
              ? (isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db')
              : option.value === value
              ? '#ffffff'
              : (isDark ? '#ffffff' : '#111827'),
            background: option.value === value ? '#dc2626' : 'transparent',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => {
            if (!option.disabled && option.value !== value) {
              (e.currentTarget as HTMLButtonElement).style.background = '#dc2626';
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (!option.disabled && option.value !== value) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#ffffff' : '#111827';
            }
          }}
        >
          <span>{option.label}</span>
          {option.value === value && <Check style={{ width: 16, height: 16, flexShrink: 0 }} />}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`h-12 w-full text-base rounded-xl px-3 border transition-colors flex items-center justify-between ${
          isDark
            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-white/20'
            : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 focus:border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          isDark ? 'focus:ring-white/20' : 'focus:ring-gray-200'
        } ${error ? 'border-amber-500' : ''} ${className}`}
      >
        <span className={selectedOption ? '' : isDark ? 'text-white/50' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal-rendered dropdown — never clipped by overflow:hidden/auto parents */}
      {typeof document !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
