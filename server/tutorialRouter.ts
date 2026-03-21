/**
 * Kai Contextual Training System — Tutorial tRPC Router
 *
 * Stores tutorial completion state in organizations.settings JSON.
 * No new migration needed — the settings column already exists.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, orgScopedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { organizations } from "../drizzle/schema";
import type { TutorialModule } from "../shared/tutorialRegistry";

const TUTORIAL_MODULES = [
  "students",
  "leads",
  "classes",
  "billing",
  "kiosk",
] as const;

type OrgSettings = {
  tutorialCompleted?: Partial<Record<TutorialModule, boolean>>;
  tutorialLastStep?: Partial<Record<TutorialModule, string>>;
  [key: string]: unknown;
};

async function getOrgSettings(orgId: number): Promise<OrgSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!row) throw new Error("Organization not found");
  try {
    return row.settings ? JSON.parse(row.settings) : {};
  } catch {
    return {};
  }
}

async function saveOrgSettings(
  orgId: number,
  settings: OrgSettings
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(organizations)
    .set({ settings: JSON.stringify(settings) })
    .where(eq(organizations.id, orgId));
}

export const tutorialRouter = router({
  /**
   * Get tutorial completion status for all modules.
   */
  getStatus: orgScopedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const orgId = ctx.currentOrganizationId as number;
    const settings = await getOrgSettings(orgId);
    return {
      completed: settings.tutorialCompleted ?? {},
      lastStep: settings.tutorialLastStep ?? {},
    };
  }),

  /**
   * Mark a tutorial module as completed.
   */
  markComplete: orgScopedProcedure
    .input(
      z.object({
        module: z.enum(TUTORIAL_MODULES),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { module: TutorialModule } }) => {
      const orgId = ctx.currentOrganizationId as number;
      const settings = await getOrgSettings(orgId);
      settings.tutorialCompleted = {
        ...(settings.tutorialCompleted ?? {}),
        [input.module]: true,
      };
      await saveOrgSettings(orgId, settings);
      return { success: true };
    }),

  /**
   * Save the last completed step for a module (for resume support).
   */
  saveProgress: orgScopedProcedure
    .input(
      z.object({
        module: z.enum(TUTORIAL_MODULES),
        stepId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { module: TutorialModule; stepId: string } }) => {
      const orgId = ctx.currentOrganizationId as number;
      const settings = await getOrgSettings(orgId);
      settings.tutorialLastStep = {
        ...(settings.tutorialLastStep ?? {}),
        [input.module]: input.stepId,
      };
      await saveOrgSettings(orgId, settings);
      return { success: true };
    }),

  /**
   * Reset a tutorial module (for re-running it).
   */
  reset: orgScopedProcedure
    .input(
      z.object({
        module: z.enum(TUTORIAL_MODULES),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { module: TutorialModule } }) => {
      const orgId = ctx.currentOrganizationId as number;
      const settings = await getOrgSettings(orgId);
      if (settings.tutorialCompleted) {
        delete settings.tutorialCompleted[input.module];
      }
      if (settings.tutorialLastStep) {
        delete settings.tutorialLastStep[input.module];
      }
      await saveOrgSettings(orgId, settings);
      return { success: true };
    }),
});
