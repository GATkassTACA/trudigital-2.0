import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { join } from 'path';

import authRoutes from './routes/auth';
import generateRoutes from './routes/generate';
import contentRoutes from './routes/content';
import displayRoutes from './routes/displays';
import playlistRoutes from './routes/playlists';
import weatherRoutes from './routes/weather';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
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
