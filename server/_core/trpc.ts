import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware to ensure user has an organization context
 * Prevents cross-organization access
 */
const requireOrganization = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (!ctx.currentOrganizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization selected. Please select an organization to continue.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      currentOrganizationId: ctx.currentOrganizationId,
    },
  });
});

/**
 * Protected procedure with organization scope
 * Use this for any operation that should be scoped to a specific organization
 */
export const orgScopedProcedure = t.procedure.use(requireUser).use(requireOrganization);

/**
 * Middleware to ensure Kiosk session has location context
 * Prevents access to Kiosk features outside of physical kiosk locations
 */
const requireKioskLocation = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.locationSlug) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available at kiosk locations.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      locationSlug: ctx.locationSlug,
    },
  });
});

/**
 * Kiosk-scoped procedure
 * Use this for operations that should only be accessible from physical kiosk locations
 */
export const kioskProcedure = t.procedure.use(requireKioskLocation);
