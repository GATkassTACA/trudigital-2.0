import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { join } from 'path';

import authRoutes from './routes/auth';
import generateRoutes from './routes/generate';
import editRoutes from './routes/edit';
import contentRoutes from './routes/content';
import displayRoutes from './routes/displays';
import playlistRoutes from './routes/playlists';
import weatherRoutes from './routes/weather';

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://trudigital-2-0-web.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for auth routes
  message: { error: 'Too many login attempts, please try again later' }
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '50mb' })); // Larger limit for base64 images

// Serve uploaded files
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/edit', editRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/displays', displayRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/weather', weatherRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`TruDigital API running on port ${PORT}`);
});
