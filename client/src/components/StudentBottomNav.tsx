import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  MessageSquare,
  CreditCard,
  User,
  Award,
} from 'lucide-react';

// Navigation items for student bottom bar
const STUDENT_NAVIGATION = [
  { id: 'home', name: 'Home', href: '/student-dashboard', icon: Home },
  { id: 'schedule', name: 'Schedule', href: '/student-schedule', icon: Calendar },
  { id: 'belt-tests', name: 'Belt Tests', href: '/student-belt-tests', icon: Award },
  { id: 'messages', name: 'Messages', href: '/student-messages', icon: MessageSquare },
  { id: 'payments', name: 'Payments', href: '/student-payments', icon: CreditCard },
  { id: 'profile', name: 'Profile', href: '/student-profile', icon: User },
];

interface StudentBottomNavProps {
  className?: string;
}

export default function StudentBottomNav({ className = '' }: StudentBottomNavProps) {
  const location = useLocation();

  // Check if a nav item is active
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 z-[1500]
        h-16 bg-white border-t border-gray-200
        shadow-[0_-2px_10px_rgba(0,0,0,0.08)]
        ${className}
      `}
    >
      <div className="h-full max-w-lg mx-auto flex items-center justify-around px-2">
        {STUDENT_NAVIGATION.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={`
                flex flex-col items-center justify-center gap-0.5
                py-2 px-3 min-w-[60px]
                transition-all duration-200
                ${active 
                  ? 'text-orange-500' 
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <div className="relative">
                <Icon 
                  className={`
                    h-5 w-5 transition-all duration-200
                    ${active ? 'scale-110' : ''}
                  `}
                />
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </div>
              <span 
                className={`
                  text-[10px] font-medium mt-0.5
                  ${active ? 'text-orange-500' : ''}
                `}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
