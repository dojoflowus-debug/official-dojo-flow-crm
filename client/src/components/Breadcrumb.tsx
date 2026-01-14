import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            ) : item.onClick ? (
              <button
                onClick={item.onClick}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </button>
            ) : (
              <span className="flex items-center gap-1">
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
