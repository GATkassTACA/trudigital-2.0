import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const UPLOADS_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Upload content (base64 image)
router.post('/upload', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req as any;
    const { name, dataUrl, type = 'IMAGE' } = req.body;

    console.log('Upload request received:', {
      hasDataUrl: !!dataUrl,
      dataUrlLength: dataUrl?.length,
      dataUrlPrefix: dataUrl?.substring(0, 50),
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
    const filename = `${randomUUID()}.${extension}`;
    const filepath = join(UPLOADS_DIR, filename);

    // Save file
    writeFileSync(filepath, buffer);

    // Create URL (will be served by express static)
    const url = `/uploads/${filename}`;

    // Save to database
    const content = await prisma.content.create({
      data: {
        name: name || `Design ${Date.now()}`,
        type: type as any,
        url,
        thumbnailUrl: url,
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
