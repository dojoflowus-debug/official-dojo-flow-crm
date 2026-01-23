import { Router } from "express";

const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Custom backgrounds router is working!" });
});

// Upload custom cinematic background
router.post("/upload", async (req, res) => {
  try {
    const { organizationId, userId, name, file, mimeType } = req.body;

    if (!organizationId || !userId || !name || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // For now, just return success to test the endpoint
    res.json({
      success: true,
      message: "Upload endpoint is working",
      received: { organizationId, userId, name, mimeType },
    });
  } catch (error) {
    console.error("[Custom Backgrounds Upload] Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get custom backgrounds list
router.get("/list/:organizationId/:userId", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("[Custom Backgrounds List] Error:", error);
    res.status(500).json({ error: "Failed to fetch backgrounds" });
  }
});

// Delete custom background
router.delete("/:id/:organizationId/:userId", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error("[Custom Backgrounds Delete] Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
