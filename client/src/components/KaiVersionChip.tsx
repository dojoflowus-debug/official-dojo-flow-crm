import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { KAI_VERSION, KAI_VERSION_FULL } from "@/config/kai-version";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KaiVersionChipProps {
  isDarkMode?: boolean;
  isCinematic?: boolean;
}

export function KaiVersionChip({ isDarkMode = true, isCinematic = false }: KaiVersionChipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/kai"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
              "hover:shadow-lg hover:shadow-red-500/20",
              isCinematic
                ? "bg-black/60 border-red-500/40 text-white hover:bg-black/80 hover:border-red-500/60"
                : isDarkMode
                ? "bg-zinc-900/80 border-red-500/30 text-white hover:bg-zinc-900 hover:border-red-500/50"
                : "bg-white border-red-200 text-gray-900 hover:bg-gray-50 hover:border-red-300"
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
          >
            {/* Red status indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            
            {/* Version text */}
            <span className={cn(
              "text-sm font-medium tracking-wide",
              isCinematic ? "text-white" : isDarkMode ? "text-white" : "text-gray-900"
            )}>
              KAI • v{KAI_VERSION}
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-zinc-900 border-red-500/30 text-white">
          <p className="text-xs">{KAI_VERSION_FULL}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
