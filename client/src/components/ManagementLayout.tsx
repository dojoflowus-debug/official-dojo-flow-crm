/**
 * ManagementLayout - DEPRECATED
 * 
 * This component is now a pass-through wrapper.
 * All layout is handled by AppShell (bottom nav) and individual pages.
 * 
 * Historical note: This previously rendered a top navigation bar,
 * but that has been consolidated into AppShell to enforce a single
 * canonical navigation system.
 */

interface ManagementLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
  return children
}
