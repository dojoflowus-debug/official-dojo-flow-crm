import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const db = await getDb();
    if (!db) {
      return done(new Error("Database not available"), null);
    }
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://3001-irsc894q9xht7gijx14lw-a8283e50.manusvm.computer/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const db = await getDb();
          if (!db) {
            return done(new Error("Database not available"), undefined);
          }
          
          // Check if user exists with this Google ID
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.providerId, profile.id))
            .limit(1);

          if (existingUser.length > 0) {
            return done(null, existingUser[0]);
          }

          // Check if user exists with this email
          const email = profile.emails?.[0]?.value;
          if (email) {
            const userByEmail = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1);

            if (userByEmail.length > 0) {
              // Update existing user with Google provider info
              const updated = await db
                .update(users)
                .set({
                  provider: "google",
                  providerId: profile.id,
                })
                .where(eq(users.id, userByEmail[0].id))
                .returning();

              return done(null, updated[0]);
            }
          }

          // Create new user
          const newUser = await db
            .insert(users)
            .values({
              email: email || `google_${profile.id}@placeholder.com`,
              name: profile.displayName || "Google User",
              provider: "google",
              providerId: profile.id,
              role: "owner", // Default role for gym owners
            })
            .returning();

          done(null, newUser[0]);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
