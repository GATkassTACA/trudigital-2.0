# TruDigital AI

AI-powered digital signage platform. Generate custom content with AI and push to displays.

## Architecture

```
trudigital-ai/
├── apps/
│   ├── web/           # Dashboard portal (Next.js 14)
│   ├── api/           # Backend API (Express + Prisma)
│   └── player/        # Display player (Next.js)
└── packages/
    └── ai-service/    # Stability AI integration
```

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Zustand, Fabric.js
- **API**: Node.js, Express, Prisma, SQLite (dev) / PostgreSQL (prod)
- **AI**: Stability AI (SDXL) with Claude-powered prompt enhancement
- **Auth**: JWT with secure cookie handling
- **Widgets**: Weather (OpenWeatherMap), Clock, RSS, and more

## Features

- **AI Studio**: Generate custom images with AI using natural language prompts
- **Smart Prompts**: Claude AI enhances your prompts for better results
- **Canvas Editor**: Full-featured editor with 35+ fonts, 80+ colors, templates
- **Content Library**: Organize images in folders, upload custom content
- **Weather Widget**: Real-time weather with multiple styles (full, compact, minimal, forecast)
- **Displays**: Manage digital signage displays
- **Playlists**: Create content playlists for displays
- **Web Player**: Display content on any screen via URL

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your keys
```

### 3. Set up database

```bash
cd apps/api
npx prisma generate
npx prisma db push
npm run seed  # Optional: seed demo data
```

### 4. Run development

```bash
# From root - run all apps
npm run dev

# Or individually:
npm run dev:api    # API on http://localhost:3001
npm run dev:web    # Web on http://localhost:3000
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/web`
3. Add environment variables (see below)
4. Deploy

### API (Railway/Render/Fly.io)

The Express API needs a Node.js hosting provider:

1. Set root directory to `apps/api`
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start`
4. Add environment variables

### Database (Neon/Supabase/PlanetScale)

Use a managed PostgreSQL service for production:

```
DATABASE_URL="postgresql://user:pass@host:5432/trudigital?sslmode=require"
```

## Environment Variables

### Web App (apps/web)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `https://api.trudigital.io`) | Yes |

### API (apps/api)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | Yes |
| `STABILITY_API_KEY` | Stability AI API key for image generation | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for Smart Prompts | No |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key for weather widget | No |
| `PORT` | API port (default: 3001) | No |

### Example .env

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/trudigital"

# Authentication
JWT_SECRET="your-super-secret-key-min-32-chars-long"

# AI Services
STABILITY_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Weather Widget
OPENWEATHER_API_KEY="..."

# Server
PORT=3001
```

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### AI Generation
- `POST /api/generate` - Generate images
- `GET /api/generate/history` - Generation history
- `GET /api/generate/presets` - Available signage presets
- `GET /api/generate/balance` - Check API credits

### Content
- `GET /api/content` - List content
- `POST /api/content/upload` - Upload content
- `DELETE /api/content/:id` - Delete content
- `GET /api/content/folders/list` - List folders
- `POST /api/content/folders` - Create folder

### Displays
- `GET /api/displays` - List displays
- `POST /api/displays` - Register display
- `PATCH /api/displays/:id` - Update display
- `DELETE /api/displays/:id` - Delete display

### Playlists
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `PATCH /api/playlists/:id` - Update playlist
- `POST /api/playlists/:id/items` - Add content
- `PUT /api/playlists/:id/reorder` - Reorder items

### Weather
- `GET /api/weather?location=City&units=imperial` - Get weather by city
- `GET /api/weather/coords?lat=X&lon=Y` - Get weather by coordinates

## Database Schema

- **Organization** - Multi-tenant accounts
- **User** - Account users with roles
- **Generation** - AI generation history
- **Content** - Images, videos, webpages
- **Folder** - Content organization
- **Display** - Physical signage devices
- **Playlist** - Content playlists
- **PlaylistItem** - Content in playlists

## Development

### Project Structure

```
apps/web/src/
├── app/
│   ├── (auth)/        # Login, signup pages
│   ├── (dashboard)/   # Protected dashboard pages
│   └── player/        # Display player route
├── components/
│   ├── editor/        # Canvas editor components
│   └── widgets/       # Weather, clock widgets
└── lib/
    ├── api.ts         # API client
    ├── store.ts       # Zustand state
    └── utils.ts       # Utilities
```

### Adding New Features

1. Add API routes in `apps/api/src/routes/`
2. Add API client methods in `apps/web/src/lib/api.ts`
3. Create components in `apps/web/src/components/`
4. Add pages in `apps/web/src/app/`

## License

Proprietary - TruDigital
