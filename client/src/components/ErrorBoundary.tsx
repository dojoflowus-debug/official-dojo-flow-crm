import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * Detects stale asset/chunk errors that happen after a new deployment.
 * When Vite builds a new version, old hashed JS chunk filenames are gone.
 * Any browser that still has the old page cached will fail to load those
 * chunks. We detect this and auto-reload once to pick up the new assets.
 */
function isStaleChunkError(error: Error): boolean {
  const msg = error?.message || "";
  const stack = error?.stack || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    stack.includes("Failed to fetch dynamically imported module")
  );
}

const RELOAD_KEY = "dojo_chunk_reload_ts";
const RELOAD_COOLDOWN_MS = 10_000; // don't loop-reload more than once per 10s

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const chunkError = isStaleChunkError(error);
    console.error("ErrorBoundary caught error:", error);

    if (chunkError) {
      // Guard against infinite reload loops
      const lastReload = parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10);
      const now = Date.now();
      if (now - lastReload > RELOAD_COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        // Hard reload to pick up new assets — happens before render
        window.location.reload();
      }
    }

    return { hasError: true, error, isChunkError: chunkError };
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        // Show a brief "updating" message while the reload fires
        return (
          <div className="flex items-center justify-center min-h-screen p-8 bg-background">
            <div className="flex flex-col items-center gap-4 text-center">
              <RotateCcw size={36} className="text-primary animate-spin" />
              <h2 className="text-lg font-medium text-foreground">
                New version available — refreshing…
              </h2>
              <p className="text-sm text-muted-foreground">
                If this takes more than a few seconds,{" "}
                <button
                  onClick={() => window.location.reload()}
                  className="underline text-primary cursor-pointer"
                >
                  click here to reload manually
                </button>
                .
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
