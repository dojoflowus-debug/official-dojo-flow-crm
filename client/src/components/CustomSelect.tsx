import { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute z-[9999] w-full mt-1 rounded-xl border shadow-lg overflow-hidden ${
            isDark 
              ? 'bg-gray-900 border-white/10' 
              : 'bg-white border-gray-200'
          }`}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && handleSelect(option.value)}
              className={`w-full px-3 py-2.5 text-left text-base flex items-center justify-between transition-colors ${
                option.disabled
                  ? isDark ? 'text-white/30 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                  : option.value === value
                  ? 'bg-red-600 text-white'
                  : isDark
                  ? 'text-white hover:bg-red-600 hover:text-white'
                  : 'text-gray-900 hover:bg-red-600 hover:text-white'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
