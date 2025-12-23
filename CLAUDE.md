# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poker Planner is a Next.js web application for organizing poker games with friends. It allows admins to create games with customizable blinds and schedules, generate passcodes for players, and track player availability and rate preferences anonymously.

## Development Commands

### Database Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Run database migrations (development)
npx prisma migrate dev

# Run database migrations (production - used in build)
npx prisma migrate deploy

# Open Prisma Studio to browse database
npx prisma studio
```

### Development Workflow
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router with React 19)
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

### Database Schema

The application uses three main Prisma models:

1. **Player**: Stores player information with unique passcodes
   - `passcode`: 6-character unique identifier (uppercase)
   - `name`: Admin-set label (optional)
   - `nickname`: Player-set display name (optional)

2. **Game**: Represents a poker game session
   - `gameCode`: Unique game identifier (format: POKER-XXXX)
   - `rateOptions`: JSON array of blind levels (e.g., ["25-50", "50-100"])
   - `daySchedules`: JSON array of date/time ranges supporting overnight sessions
   - `isVisible`: Boolean to hide completed games

3. **GameResponse**: Links players to games with their preferences
   - Unique constraint on `[gameId, playerId]`
   - `ratePreferences`: JSON object mapping rates to preferences (preferred/playable/wont-play)
   - `timeSlots`: JSON object mapping ISO timestamps to availability (can/maybe/unavailable)

### Application Structure

```
app/
├── api/                    # API routes
│   ├── join/              # Player authentication endpoint
│   ├── admin/             # Admin-only endpoints (protected by lib/admin.ts)
│   │   ├── login/         # Admin authentication
│   │   ├── dashboard/     # Dashboard data
│   │   ├── games/         # CRUD for games
│   │   └── players/       # CRUD for players
│   └── games/[code]/      # Public game endpoints (require valid passcode)
│       ├── route.ts       # Get game details and submit responses
│       ├── respond/       # Submit player preferences
│       └── schedule/      # Get anonymous availability view
├── admin/                 # Admin pages (protected)
│   ├── dashboard/         # Main admin view with all games
│   ├── games/             # Game management
│   │   ├── new/          # Create new game
│   │   └── [id]/         # View game details and responses
│   └── players/           # Player passcode management
├── game/[code]/           # Player-facing game pages
│   ├── page.tsx          # Game response form
│   └── schedule/         # Anonymous schedule view
└── page.tsx               # Landing page (game code + passcode entry)

components/
├── ui/                    # Reusable UI components (Button, Card, Input)
└── PokerLogo.tsx          # App logo component

lib/
├── prisma.ts              # Prisma client singleton
├── admin.ts               # Admin authentication helpers
└── utils.ts               # Shared utilities (date/time formatting, schedules)
```

### Key Patterns

**Authentication**:
- Admin auth uses cookie-based tokens (base64-encoded "admin:" prefix). See `lib/admin.ts:verifyAdmin()`
- Player auth uses passcode validation against database, stored in sessionStorage client-side
- API routes in `app/api/admin/*` should call `requireAdmin()` to protect endpoints

**Time Handling**:
- Games support overnight sessions (e.g., 18:00 → 05:00 the next day)
- Time slots are stored as ISO timestamp strings in JSON
- Use `lib/utils.ts:generateTimeSlots()` to create hourly slots for a day schedule
- Use `lib/utils.ts:formatHour()` for consistent 12-hour time display

**Data Serialization**:
- `rateOptions`, `daySchedules`, `ratePreferences`, and `timeSlots` are stored as JSON strings in the database
- Always parse with `JSON.parse()` when reading and stringify with `JSON.stringify()` when writing
- Type definitions in `lib/utils.ts`: `DaySchedule`, `TimeSlot`, `RatePreference`

**Client-Side State**:
- Player session uses sessionStorage: `playerId` and `playerPasscode`
- Admin session uses HTTP-only cookies (managed by Next.js)

### Environment Variables

Required in `.env`:
```env
DATABASE_URL="postgresql://..."  # PostgreSQL connection string
ADMIN_PASSWORD="..."             # Plain text admin password (compare in login endpoint)
```

### Styling Conventions

The app uses a custom dark theme with CSS variables defined in `app/globals.css`:
- Background colors: `bg-dark`, `bg-card`, `bg-elevated`
- Text colors: `text-primary`, `text-secondary`, `text-muted`
- Accent color: `gold` (#D4AF37)
- Border colors: `border-subtle`

Use the custom UI components (`Button`, `Card`, `Input`) for consistency rather than raw Tailwind classes.

### Production Deployment

The app is configured for Vercel deployment with PostgreSQL (Neon):
1. Build command runs migrations: `prisma generate && prisma migrate deploy && next build`
2. Set `DATABASE_URL` and `ADMIN_PASSWORD` in Vercel environment variables
3. Google Analytics is configured (G-CN0L2GFMH0) in `app/layout.tsx`
