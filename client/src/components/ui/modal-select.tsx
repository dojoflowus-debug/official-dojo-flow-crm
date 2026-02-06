import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ModalSelect - A reliable select component for use inside Dialog modals.
 * Renders dropdown INLINE (no portal) with absolute positioning and high z-index.
 * This avoids the "outside click closes dialog" problem that portals cause.
 */

interface ModalSelectOption {
  value: string;
  label: string;
}

interface ModalSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ModalSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ModalSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: ModalSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsOpen((prev) => !prev);
    },
    [disabled]
  );

  const handleSelect = React.useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onValueChange(optionValue);
      setIsOpen(false);
    },
    [onValueChange]
  );

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Use capture phase to catch clicks before they propagate
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen]);

  // Close on escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-colors",
          "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "h-9",
          className
        )}
      >
        <span className={cn("line-clamp-1", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={cn("size-4 opacity-50 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div
          className="bg-popover text-popover-foreground rounded-md border shadow-lg max-h-[300px] overflow-y-auto"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "180px",
            zIndex: 50,
          }}
          onMouseDown={(e) => {
            // Prevent this click from propagating to dialog overlay
            e.stopPropagation();
          }}
        >
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={(e) => handleSelect(option.value, e)}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  "relative flex w-full cursor-pointer items-center rounded-sm py-2 pr-8 pl-3 text-sm select-none",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  value === option.value && "bg-accent/50 font-medium"
                )}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
