import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { trpc } from '@/lib/trpc';
import { User, Users, Bot, GraduationCap, Calendar, Shield, Briefcase } from 'lucide-react';

export interface Mention {
  type: 'student' | 'staff' | 'kai' | 'class';
  id: number | string;
  displayName: string;
  avatar?: string;
  subtitle?: string;
  studentCount?: number;
  role?: string;
  beltRank?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'apple';
  theme?: 'light' | 'dark' | 'cinematic';
}

export interface MentionInputRef {
  focus: () => void;
  clear: () => void;
  getMentions: () => Mention[];
}

interface SuggestionGroup {
  title: string;
  type: 'kai' | 'student' | 'staff' | 'class';
  items: Mention[];
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = "Message Kai… Type @ to mention",
  className = "",
  disabled = false,
  variant = 'apple',
  theme = 'light',
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      onChange('');
      setMentions([]);
    },
    getMentions: () => mentions
  }));

  // Fetch students for suggestions
  const { data: studentsData } = trpc.students.getAll.useQuery(
    { search: searchQuery, limit: 8 },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Fetch staff for suggestions
  const { data: staffData } = trpc.staff.getAll.useQuery(
    { search: searchQuery, limit: 8 },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Fetch classes for bulk messaging
  const { data: classesData } = trpc.messaging.getClassesForMention.useQuery(
    { search: searchQuery },
    { enabled: showSuggestions && searchQuery.length > 0 }
  );

  // Build grouped suggestions
  const suggestionGroups: SuggestionGroup[] = [];
  
  // Kai group (always first)
  if (!searchQuery || 'kai'.includes(searchQuery.toLowerCase())) {
    suggestionGroups.push({
      title: 'AI Assistant',
      type: 'kai',
      items: [{
        type: 'kai',
        id: 'kai',
        displayName: 'Kai',
        subtitle: 'AI-powered assistant for your dojo',
      }]
    });
  }

  // Students group
  if (studentsData?.students && studentsData.students.length > 0) {
    suggestionGroups.push({
      title: 'Students',
      type: 'student',
      items: studentsData.students.map((student: any) => ({
        type: 'student' as const,
        id: student.id,
        displayName: student.name || `${student.firstName} ${student.lastName}`,
        avatar: student.photoUrl,
        subtitle: student.email || '',
        beltRank: student.beltRank || 'White',
        role: 'Student',
      }))
    });
  }

  // Staff group
  if (staffData?.staff && staffData.staff.length > 0) {
    suggestionGroups.push({
      title: 'Staff & Instructors',
      type: 'staff',
      items: staffData.staff.map((member: any) => ({
        type: 'staff' as const,
        id: member.id,
        displayName: member.name,
        avatar: member.photoUrl,
        subtitle: member.email || '',
        role: member.role || 'Staff',
      }))
    });
  }

  // Classes group (for bulk messaging)
  if (classesData?.classes && classesData.classes.length > 0) {
    suggestionGroups.push({
      title: 'Classes',
      type: 'class',
      items: classesData.classes.map((cls: any) => ({
        type: 'class' as const,
        id: cls.id,
        displayName: cls.name,
        subtitle: cls.schedule || 'Class',
        studentCount: cls.studentCount,
      }))
    });
  }

  // Flatten for keyboard navigation
  const flatSuggestions = suggestionGroups.flatMap(g => g.items);

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
    
    // Focus back on input immediately
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      // Set cursor position after the inserted mention
      const newCursorPos = lastAtIndex + suggestion.displayName.length + 2; // +2 for @ and space
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    });
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
          prev < flatSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (flatSuggestions[selectedIndex]) {
          selectSuggestion(flatSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        inputRef.current?.focus();
        break;
    }
  }, [showSuggestions, flatSuggestions, selectedIndex, selectSuggestion, onSubmit, value, mentions]);

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
  const getIcon = (type: string, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    switch (type) {
      case 'kai':
        return <Bot className={`${sizeClass} text-red-500`} strokeWidth={2} />;
      case 'student':
        return <GraduationCap className={`${sizeClass} text-blue-500`} strokeWidth={2} />;
      case 'staff':
        return <Users className={`${sizeClass} text-green-500`} strokeWidth={2} />;
      case 'class':
        return <Calendar className={`${sizeClass} text-purple-500`} strokeWidth={2} />;
      default:
        return <User className={`${sizeClass} text-gray-500`} strokeWidth={2} />;
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    const lowerRole = role?.toLowerCase() || '';
    if (lowerRole.includes('admin') || lowerRole.includes('owner') || lowerRole.includes('manager')) {
      return <Shield className="w-3 h-3" />;
    }
    if (lowerRole.includes('instructor') || lowerRole.includes('coach')) {
      return <Users className="w-3 h-3" />;
    }
    return <Briefcase className="w-3 h-3" />;
  };

  // Get belt color
  const getBeltColor = (belt: string) => {
    const lowerBelt = belt?.toLowerCase() || 'white';
    const colors: Record<string, string> = {
      'white': 'bg-gray-200 text-gray-700',
      'yellow': 'bg-yellow-400 text-yellow-900',
      'orange': 'bg-orange-400 text-orange-900',
      'green': 'bg-green-500 text-white',
      'blue': 'bg-blue-500 text-white',
      'purple': 'bg-purple-500 text-white',
      'brown': 'bg-amber-700 text-white',
      'black': 'bg-gray-900 text-white',
      'red': 'bg-red-600 text-white',
    };
    return colors[lowerBelt] || colors['white'];
  };

  // Determine theme-based styling
  const isDark = theme === 'dark' || theme === 'cinematic';
  const isCinematic = theme === 'cinematic';

  // Apple-style input classes
  const inputClasses = variant === 'apple' 
    ? `w-full resize-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[15px] leading-relaxed ${
        isCinematic 
          ? 'text-white placeholder:text-white/70 caret-white' 
          : isDark 
            ? 'text-white placeholder:text-white/50 caret-white' 
            : 'text-slate-800 placeholder:text-slate-400 caret-slate-800'
      }`
    : `w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`;

  // Apple-style dropdown classes
  const dropdownClasses = variant === 'apple'
    ? `absolute bottom-full left-0 right-0 mb-3 rounded-2xl overflow-hidden z-[100] ${
        isCinematic 
          ? 'bg-black/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' 
          : isDark 
            ? 'bg-[#1C1C1E] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
            : 'bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
      }`
    : 'absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50';

  // Track global index for keyboard navigation
  let globalIndex = 0;

  return (
    <div className={`relative flex-1 ${className}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        rows={1}
        style={{ 
          minHeight: '24px',
          maxHeight: '120px',
          height: 'auto',
          overflow: 'hidden',
          lineHeight: '1.5'
        }}
        onInput={(e) => {
          // Auto-resize textarea
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 120) + 'px';
        }}
      />

      {/* Suggestions dropdown - Apple-style with grouped sections */}
      {showSuggestions && flatSuggestions.length > 0 && (
        <div ref={suggestionsRef} className={dropdownClasses}>
          {/* Header */}
          <div className={`px-4 py-2.5 text-xs font-medium tracking-wide uppercase ${
            isCinematic 
              ? 'text-white/50 border-b border-white/10' 
              : isDark 
                ? 'text-white/40 border-b border-white/5' 
                : 'text-slate-400 border-b border-slate-100'
          }`}>
            Mention someone
          </div>
          
          {/* Grouped suggestions list */}
          <div className="max-h-80 overflow-y-auto">
            {suggestionGroups.map((group, groupIdx) => (
              <div key={group.type}>
                {/* Section header */}
                <div className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 ${
                  groupIdx > 0 ? 'border-t' : ''
                } ${
                  isCinematic 
                    ? 'text-white/40 border-white/10 bg-white/5' 
                    : isDark 
                      ? 'text-white/30 border-white/5 bg-white/[0.02]' 
                      : 'text-slate-400 border-slate-100 bg-slate-50/50'
                }`}>
                  {getIcon(group.type, 'sm')}
                  {group.title}
                  <span className={`ml-auto text-[10px] font-normal ${
                    isCinematic ? 'text-white/30' : isDark ? 'text-white/20' : 'text-slate-300'
                  }`}>
                    {group.items.length}
                  </span>
                </div>
                
                {/* Section items */}
                {group.items.map((suggestion) => {
                  const currentIndex = globalIndex++;
                  return (
                    <button
                      key={`${suggestion.type}-${suggestion.id}`}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                        currentIndex === selectedIndex 
                          ? isCinematic 
                            ? 'bg-white/10' 
                            : isDark 
                              ? 'bg-white/5' 
                              : 'bg-slate-50'
                          : ''
                      } ${
                        isCinematic 
                          ? 'hover:bg-white/10' 
                          : isDark 
                            ? 'hover:bg-white/5' 
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar or icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
                        suggestion.avatar 
                          ? '' 
                          : isCinematic 
                            ? 'bg-white/10' 
                            : isDark 
                              ? 'bg-white/5' 
                              : 'bg-slate-100'
                      }`}>
                        {suggestion.avatar ? (
                          <img
                            src={suggestion.avatar}
                            alt={suggestion.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getIcon(suggestion.type, 'md')
                        )}
                      </div>
                      
                      {/* Name and subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-[15px] truncate ${
                          isCinematic 
                            ? 'text-white' 
                            : isDark 
                              ? 'text-white' 
                              : 'text-slate-800'
                        }`}>
                          {suggestion.displayName}
                        </div>
                        {suggestion.subtitle && (
                          <div className={`text-xs truncate mt-0.5 ${
                            isCinematic 
                              ? 'text-white/50' 
                              : isDark 
                                ? 'text-white/40' 
                                : 'text-slate-500'
                          }`}>
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Badge - Role for staff, Belt for students, AI for Kai */}
                      {suggestion.type === 'kai' && (
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          isCinematic 
                            ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 text-red-300' 
                            : isDark 
                              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400' 
                              : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-600'
                        }`}>
                          <Bot className="w-3 h-3" />
                          AI
                        </span>
                      )}
                      
                      {suggestion.type === 'student' && suggestion.beltRank && (
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${getBeltColor(suggestion.beltRank)}`}>
                          <GraduationCap className="w-3 h-3" />
                          {suggestion.beltRank}
                        </span>
                      )}
                      
                      {suggestion.type === 'staff' && suggestion.role && (
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          isCinematic 
                            ? 'bg-green-500/20 text-green-300' 
                            : isDark 
                              ? 'bg-green-500/15 text-green-400' 
                              : 'bg-green-50 text-green-600'
                        }`}>
                          {getRoleIcon(suggestion.role)}
                          {suggestion.role}
                        </span>
                      )}
                      
                      {suggestion.type === 'class' && (
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          isCinematic 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : isDark 
                              ? 'bg-purple-500/15 text-purple-400' 
                              : 'bg-purple-50 text-purple-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {suggestion.studentCount} students
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Footer hint */}
          <div className={`px-4 py-2 text-[11px] border-t ${
            isCinematic 
              ? 'text-white/40 border-white/10' 
              : isDark 
                ? 'text-white/30 border-white/5' 
                : 'text-slate-400 border-slate-100'
          }`}>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
              isCinematic 
                ? 'bg-white/10' 
                : isDark 
                  ? 'bg-white/5' 
                  : 'bg-slate-100'
            }`}>↑↓</span>
            to navigate
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mx-1 ${
              isCinematic 
                ? 'bg-white/10' 
                : isDark 
                  ? 'bg-white/5' 
                  : 'bg-slate-100'
            }`}>↵</span>
            to select
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mx-1 ${
              isCinematic 
                ? 'bg-white/10' 
                : isDark 
                  ? 'bg-white/5' 
                  : 'bg-slate-100'
            }`}>esc</span>
            to close
          </div>
        </div>
      )}
    </div>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;
