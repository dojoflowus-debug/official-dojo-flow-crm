import { useState, useRef, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { User, Users, Bot, GraduationCap, Calendar } from 'lucide-react';

interface Mention {
  type: 'student' | 'staff' | 'kai' | 'class';
  id: number | string;
  displayName: string;
  avatar?: string;
  subtitle?: string;
  studentCount?: number;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Message... (Type @ to mention)",
  className = "",
  disabled = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch students for suggestions
  const { data: studentsData } = trpc.students.getAll.useQuery(
    { search: searchQuery, limit: 5 },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Fetch staff for suggestions
  const { data: staffData } = trpc.staff.getAll.useQuery(
    { search: searchQuery, limit: 5 },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Fetch classes for bulk messaging
  const { data: classesData } = trpc.messaging.getClassesForMention.useQuery(
    { search: searchQuery },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Build suggestions list
  const suggestions: Mention[] = [];
  
  // Add Kai as first option if query matches
  if (!searchQuery || 'kai'.includes(searchQuery.toLowerCase())) {
    suggestions.push({
      type: 'kai',
      id: 'kai',
      displayName: 'Kai',
      subtitle: 'AI Assistant',
    });
  }

  // Add students
  if (studentsData?.students) {
    studentsData.students.forEach((student: any) => {
      suggestions.push({
        type: 'student',
        id: student.id,
        displayName: student.name || `${student.firstName} ${student.lastName}`,
        avatar: student.photoUrl,
        subtitle: `${student.beltRank || 'White'} Belt • Student`,
      });
    });
  }

  // Add staff
  if (staffData?.staff) {
    staffData.staff.forEach((member: any) => {
      suggestions.push({
        type: 'staff',
        id: member.id,
        displayName: member.name,
        avatar: member.photoUrl,
        subtitle: member.role || 'Staff',
      });
    });
  }

  // Add classes for bulk messaging
  if (classesData?.classes) {
    classesData.classes.forEach((cls: any) => {
      suggestions.push({
        type: 'class',
        id: cls.id,
        displayName: cls.name,
        subtitle: `${cls.studentCount} students • ${cls.schedule || 'Class'}`,
        studentCount: cls.studentCount,
      });
    });
  }

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    onChange(newValue);

    // Check if we're typing after @
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing mention)
      if (!textAfterAt.includes(' ')) {
        setSearchQuery(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setSearchQuery('');
  }, [onChange]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: Mention) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.slice(cursorPosition);
    
    // Replace @query with @DisplayName
    const newValue = 
      value.slice(0, lastAtIndex) + 
      `@${suggestion.displayName} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setMentions([...mentions, suggestion]);
    setShowSuggestions(false);
    setSearchQuery('');
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [value, cursorPosition, mentions, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
        e.preventDefault();
        onSubmit(value, mentions);
        setMentions([]);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, onSubmit, value, mentions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for suggestion type
  const getIcon = (type: string) => {
    switch (type) {
      case 'kai':
        return <Bot className="w-4 h-4 text-red-500" />;
      case 'student':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'staff':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'class':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${className}`}
        rows={1}
      />

      {/* Mention chips display */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {mentions.map((mention, index) => (
            <span
              key={`${mention.type}-${mention.id}-${index}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            >
              {getIcon(mention.type)}
              @{mention.displayName}
            </span>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="p-2 text-xs text-muted-foreground border-b border-border">
            Mention a student, instructor, or Kai
          </div>
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                {/* Avatar or icon */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {suggestion.avatar ? (
                    <img
                      src={suggestion.avatar}
                      alt={suggestion.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getIcon(suggestion.type)
                  )}
                </div>
                
                {/* Name and subtitle */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {suggestion.displayName}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  suggestion.type === 'kai' 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : suggestion.type === 'student'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : suggestion.type === 'class'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  {suggestion.type === 'kai' ? 'AI' : suggestion.type === 'class' ? `${suggestion.studentCount} students` : suggestion.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MentionInput;
