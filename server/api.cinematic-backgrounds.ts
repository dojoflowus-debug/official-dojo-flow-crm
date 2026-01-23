import { Router } from "express";
import { db } from "./db";
import { customCinematicBackgrounds } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut, storageGet } from "./storage";

const router = Router();

// Upload custom cinematic background
router.post("/upload", async (req, res) => {
  try {
    const { organizationId, userId, name, description, file } = req.body;

    if (!organizationId || !userId || !name || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate file
    const buffer = Buffer.from(file, "base64");
    const mimeType = req.body.mimeType || "image/jpeg";
    const fileSize = buffer.length;

    // File size limit: 5MB
    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 5MB limit" });
    }

    // Upload to S3
    const s3Key = `custom-backgrounds/${organizationId}/${userId}/${Date.now()}-${name.replace(/\s+/g, "-")}`;
    const { url } = await storagePut(s3Key, buffer, mimeType);

    // Create thumbnail (simplified - just use same image)
    const thumbnailUrl = url;

    // Store in database
    const result = await db.insert(customCinematicBackgrounds).values({
      organizationId,
      userId,
      name,
      description: description || null,
      imageUrl: url,
      thumbnailUrl,
      s3Key,
      fileSize,
      mimeType,
      isActive: 1,
      sortOrder: 0,
    });

    res.json({
      id: result.insertId,
      name,
      imageUrl: url,
      thumbnailUrl,
      s3Key,
    });
  } catch (error) {
    console.error("[Custom Background Upload] Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get user's custom backgrounds
router.get("/list/:organizationId/:userId", async (req, res) => {
  try {
    const { organizationId, userId } = req.params;

    const backgrounds = await db
      .select()
      .from(customCinematicBackgrounds)
      .where(
        and(
          eq(customCinematicBackgrounds.organizationId, parseInt(organizationId)),
          eq(customCinematicBackgrounds.userId, parseInt(userId)),
          eq(customCinematicBackgrounds.isActive, 1)
        )
      )
      .orderBy(customCinematicBackgrounds.sortOrder);

    res.json(backgrounds);
  } catch (error) {
    console.error("[Custom Background List] Error:", error);
    res.status(500).json({ error: "Failed to fetch backgrounds" });
  }
});

// Delete custom background
router.delete("/:id/:organizationId/:userId", async (req, res) => {
  try {
    const { id, organizationId, userId } = req.params;

    // Verify ownership
    const background = await db
      .select()
      .from(customCinematicBackgrounds)
      .where(eq(customCinematicBackgrounds.id, parseInt(id)))
      .limit(1);

    if (!background.length) {
      return res.status(404).json({ error: "Background not found" });
    }

    if (
      background[0].organizationId !== parseInt(organizationId) ||
      background[0].userId !== parseInt(userId)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Soft delete
    await db
      .update(customCinematicBackgrounds)
      .set({ isActive: 0 })
      .where(eq(customCinematicBackgrounds.id, parseInt(id)));

    res.json({ success: true });
  } catch (error) {
    console.error("[Custom Background Delete] Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
