import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App.tsx";
import "./index.css";
import "./styles/dojo-animations.css";
import "./radix-z-index-fix.css";

// DojoFlow v2 — onboarding overlay active
console.log('DojoFlow Kiosk - main.tsx loaded');

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect on public pages
  const publicRoutes = [
    '/lead-capture',
    '/lead-capture-location',
    '/locations',
    '/public',
    '/kiosk-home',
    '/kiosk-live',
    '/owner',
    '/staff/login',
    '/student-login',
    '/login',
    '/forgot-password',
    '/reset-password',
  ];
  
  const currentPath = window.location.pathname;
  const isPublicRoute = publicRoutes.some(route => 
    currentPath === route || currentPath.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    console.log('[Auth] Skipping redirect on public route:', currentPath);
    return;
  }

  // Redirect to owner login page
  window.location.href = "/owner";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suppress UNAUTHORIZED errors on public/login routes — they are expected
    const isUnauthedError = error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG;
    const currentPath = window.location.pathname;
    const isPublicPath = ['/owner', '/staff/login', '/student-login', '/login', '/kiosk-home', '/kiosk-live', '/lead-capture', '/public', '/forgot-password', '/reset-password'].some(
      r => currentPath === r || currentPath.startsWith(r + '/')
    );
    if (!(isUnauthedError && isPublicPath)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
