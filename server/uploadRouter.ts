import express from 'express';
import multer from 'multer';
import { storagePut } from '../storage/index.js';
import crypto from 'crypto';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload merchandise image endpoint
router.post('/upload-merchandise-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const ext = req.file.originalname.split('.').pop();
    const fileKey = `merchandise/${randomSuffix}.${ext}`;

    // Upload to S3
    const result = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url: result.url, key: result.key });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
