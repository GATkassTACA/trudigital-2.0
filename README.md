# TruDigital AI

AI-powered digital signage platform. Generate custom content with AI and push to displays.

## Architecture

```
trudigital-ai/
├── apps/
│   ├── web/          # Consumer portal (Next.js) - TODO
│   ├── api/          # Backend API (Express + Prisma)
│   └── display-player/ # Display app (React) - TODO
└── packages/
    ├── ai-service/   # Stability AI integration
    └── shared/       # Shared types/utils
```

## Tech Stack

- **API**: Node.js, Express, Prisma, PostgreSQL
- **AI**: Stability AI (SDXL)
- **Frontend**: Next.js 14, TailwindCSS (coming soon)
- **Auth**: JWT
- **Storage**: S3/Cloudflare R2

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
# Start PostgreSQL (or use a cloud provider)
cd apps/api
npm run db:push
```

### 4. Run development

```bash
# API
npm run dev:api

# Web (coming soon)
npm run dev:web
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
- `GET /api/content/:id` - Get single content
- `DELETE /api/content/:id` - Delete content
- `GET /api/content/folders/list` - List folders
- `POST /api/content/folders` - Create folder

### Displays
- `GET /api/displays` - List displays
- `POST /api/displays` - Register display
- `PATCH /api/displays/:id` - Update display
- `DELETE /api/displays/:id` - Delete display
- `GET /api/displays/player/:deviceKey` - Player heartbeat (public)

### Playlists
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `PATCH /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/items` - Add content to playlist
- `DELETE /api/playlists/:id/items/:itemId` - Remove from playlist
- `PUT /api/playlists/:id/reorder` - Reorder items

## AI Generation

### Signage Presets

| Preset | Size | Best For |
|--------|------|----------|
| `landscape-standard` | 1344x768 | Most horizontal displays |
| `landscape-wide` | 1536x640 | Ultra-wide banners |
| `portrait-standard` | 768x1344 | Vertical displays |
| `portrait-tall` | 640x1536 | Tall kiosks |
| `square` | 1024x1024 | Square displays |
| `menu-board` | 896x1152 | Restaurant menus |
| `lobby-display` | 1344x768 | Corporate lobbies |
| `retail-banner` | 1536x640 | Retail promotions |
| `event-poster` | 768x1344 | Event announcements |

### Example Generation Request

```json
POST /api/generate
{
  "prompt": "Summer sale promotion with beach theme and palm trees",
  "preset": "retail-banner",
  "style": "digital-art",
  "samples": 2,
  "saveToLibrary": true
}
```

## Database Schema

- **Organization** - Multi-tenant accounts
- **User** - Account users with roles
- **Generation** - AI generation history
- **Content** - Images, videos, webpages
- **Folder** - Content organization
- **Display** - Physical signage devices
- **Playlist** - Content playlists
- **PlaylistItem** - Content in playlists

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `STABILITY_API_KEY` | Stability AI API key |
| `S3_*` | Storage configuration |
| `STRIPE_*` | Payment processing |

## Coming Soon

- [ ] Web portal frontend
- [ ] Display player app
- [ ] File upload (images, videos)
- [ ] Stripe billing integration
- [ ] Team invites
- [ ] Advanced scheduling
- [ ] Analytics dashboard
