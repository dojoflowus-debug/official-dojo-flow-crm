import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Eye, Star } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface RoleConfig {
  label: string;
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  permissions: string[];
  restrictions: string[];
}

function getRoleConfig(role: string): RoleConfig {
  const r = (role || '').toLowerCase().trim();

  if (r === 'owner') {
    return {
      label: 'Owner',
      level: 'Level 5 · Full Access',
      color: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-300 dark:border-yellow-600',
      icon: <Star className="w-3 h-3" />,
      permissions: ['All permissions', 'Delete any record', 'Manage billing', 'Manage staff', 'View all reports'],
      restrictions: [],
    };
  }

  if (r === 'admin') {
    return {
      label: 'Admin',
      level: 'Level 4 · Admin Access',
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-300 dark:border-red-600',
      icon: <ShieldAlert className="w-3 h-3" />,
      permissions: ['Remove/archive students', 'Delete leads', 'Manage staff', 'Edit all records', 'View all reports'],
      restrictions: ['Cannot manage billing'],
    };
  }

  if (r === 'manager') {
    return {
      label: 'Manager',
      level: 'Level 3 · Manager Access',
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-300 dark:border-blue-600',
      icon: <ShieldCheck className="w-3 h-3" />,
      permissions: ['Add & update leads', 'Move pipeline stages', 'Edit student profiles', 'View revenue reports', 'Send SMS blasts'],
      restrictions: ['Cannot delete students or leads', 'Cannot manage staff'],
    };
  }

  if (r === 'master instructor' || r === 'master_instructor') {
    return {
      label: 'Master Instructor',
      level: 'Level 3 · Senior Instructor',
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-300 dark:border-purple-600',
      icon: <ShieldCheck className="w-3 h-3" />,
      permissions: ['Mark attendance', 'View at-risk students', 'View class roster', 'Add leads', 'Edit student profiles'],
      restrictions: ['Cannot delete records', 'Cannot view financials'],
    };
  }

  if (r === 'instructor') {
    return {
      label: 'Instructor',
      level: 'Level 2 · Instructor Access',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-300 dark:border-green-600',
      icon: <Shield className="w-3 h-3" />,
      permissions: ['Mark attendance', 'View at-risk students', 'View class roster', 'Search students'],
      restrictions: ['Cannot delete records', 'Cannot edit student profiles', 'Cannot view financials'],
    };
  }

  if (r === 'assistant instructor' || r === 'assistant_instructor') {
    return {
      label: 'Asst. Instructor',
      level: 'Level 2 · Assistant',
      color: 'text-teal-700 dark:text-teal-300',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      borderColor: 'border-teal-300 dark:border-teal-600',
      icon: <Shield className="w-3 h-3" />,
      permissions: ['Mark attendance', 'View class roster', 'Search students'],
      restrictions: ['Cannot edit records', 'Cannot view financials', 'Cannot manage leads'],
    };
  }

  if (r === 'receptionist' || r === 'front_desk' || r === 'front desk') {
    return {
      label: 'Front Desk',
      level: 'Level 1 · Front Desk',
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      borderColor: 'border-gray-300 dark:border-gray-600',
      icon: <Eye className="w-3 h-3" />,
      permissions: ['Add new leads', 'Search students', 'Search leads', 'View class schedule'],
      restrictions: ['Read-only for most records', 'Cannot delete anything', 'Cannot view financials'],
    };
  }

  // Default: Staff
  return {
    label: role || 'Staff',
    level: 'Level 1 · General Staff',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/40',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: <Eye className="w-3 h-3" />,
    permissions: ['Search students', 'View class schedule'],
    restrictions: ['Limited access', 'Cannot modify records', 'Cannot view financials'],
  };
}

export default function RoleBadge({ role, showTooltip = true, size = 'md' }: RoleBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const config = getRoleConfig(role);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <div className="relative inline-block">
      <span
        className={`
          inline-flex items-center font-semibold rounded-full border cursor-default select-none
          ${sizeClasses[size]}
          ${config.color}
          ${config.bgColor}
          ${config.borderColor}
          ${showTooltip ? 'cursor-help' : ''}
        `}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        {config.icon}
        {config.label}
      </span>

      {/* Permission Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl p-3"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
            <span className={`inline-flex items-center gap-1 font-bold text-sm ${config.color}`}>
              {config.icon}
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{config.level}</span>
          </div>

          {/* Can Do */}
          {config.permissions.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">✓ Can do</p>
              <ul className="space-y-0.5">
                {config.permissions.map((p, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cannot Do */}
          {config.restrictions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 mb-1">✗ Cannot do</p>
              <ul className="space-y-0.5">
                {config.restrictions.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}
