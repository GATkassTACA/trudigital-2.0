import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { put, del } from '@vercel/blob';
import { randomUUID } from 'crypto';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM'));
    }
  }
});

// Upload content (base64 image)
router.post('/upload', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, dataUrl, type = 'IMAGE' } = req.body;

    console.log('Upload request received:', {
      hasDataUrl: !!dataUrl,
      dataUrlLength: dataUrl?.length,
      name,
      type
    });

    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid image format, dataUrl starts with:', dataUrl.substring(0, 100));
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const filename = `${user.organizationId}/${randomUUID()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: `image/${extension}`
    });

    // Save to database with Vercel Blob URL
    const content = await prisma.content.create({
      data: {
        name: name || `Design ${Date.now()}`,
        type: type as any,
        url: blob.url,
        thumbnailUrl: blob.url,
        isGenerated: false,
        organizationId: user.organizationId,
        userId: user.id,
        fileSize: buffer.length,
        mimeType: `image/${extension}`
      }
    });

    res.json({ success: true, content });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Direct file upload (multipart form data)
router.post('/upload/file', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { user } = req as any;
    const file = req.file;
    const { name } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Determine content type
    const isVideo = file.mimetype.startsWith('video/');
    const type = isVideo ? 'VIDEO' : 'IMAGE';

    // Get file extension from mimetype
    const extension = file.mimetype.split('/')[1];

    // Generate filename with org prefix for organization
    const filename = `${user.organizationId}/${randomUUID()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype
    });

    // Save to database
    const content = await prisma.content.create({
      data: {
        name: name || file.originalname || `Upload ${Date.now()}`,
        type: type as any,
        url: blob.url,
        thumbnailUrl: blob.url, // For videos, you'd generate a thumbnail
        isGenerated: false,
        organizationId: user.organizationId,
        userId: user.id,
        fileSize: file.size,
        mimeType: file.mimetype
      }
    });

    res.json({ success: true, content, blob: { url: blob.url } });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Get all content
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { folderId } = req.query;

    const content = await prisma.content.findMany({
      where: {
        organizationId: user.organizationId,
        ...(folderId ? { folderId: folderId as string } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// Get single content
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const content = await prisma.content.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      },
      include: { generation: true }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// Delete content
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    // Get content first to get the blob URL
    const content = await prisma.content.findFirst({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    if (content?.url && content.url.includes('vercel-storage.com')) {
      // Delete from Vercel Blob
      try {
        await del(content.url);
      } catch (e) {
        console.warn('Failed to delete blob:', e);
      }
    }

    await prisma.content.deleteMany({
      where: {
        id: req.params.id,
        organizationId: user.organizationId
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get folders
router.get('/folders/list', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;

    const folders = await prisma.folder.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' }
    });

    res.json({ folders });
  } catch (error) {
    next(error);
  }
});

// Create folder
router.post('/folders', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, parentId } = req.body;

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        organizationId: user.organizationId
      }
    });

    res.json({ folder });
  } catch (error) {
    next(error);
  }
});

export default router;
