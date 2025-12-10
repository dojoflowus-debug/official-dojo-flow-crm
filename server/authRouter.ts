import { router, protectedProcedure } from "./_core/trpc";
import { getUserByOpenId } from "./db";

/**
 * Authentication Router
 * 
 * Provides endpoints for user authentication and profile management
 */
export const authRouter = router({
  /**
   * Get current authenticated user
   * Returns user profile with role information
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserByOpenId(ctx.user.openId);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),
});
