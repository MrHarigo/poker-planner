# Poker Planner 🎰

A web app to help you plan and organize poker games with friends.

## Features

- **Create Games**: Set up poker sessions with date/time ranges and rate options
- **Player Passcodes**: Generate unique passcodes for your friends
- **Availability Selection**: Players can mark when they can play (Can / Maybe / Unavailable)
- **Rate Preferences**: Players indicate their preferred stakes (Preferred / Playable / Won't Play)
- **Anonymous Schedule View**: Players see aggregated availability without names
- **Admin Dashboard**: View all responses in a convenient table format
- **Game Visibility**: Hide games when they're done

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
npx prisma migrate dev
```

### 3. Configure environment

Create a `.env` file (already created with defaults):

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="your-secure-password"
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### As Admin

1. Go to `/admin` and login with your admin password
2. Go to **Manage Players** to generate passcodes for your friends
3. Go to **New Game** to create a poker session
4. Share the **Game Code** + each friend's **Passcode**
5. View responses in the game detail page

### As Player

1. Open the app and enter the Game Code + your Passcode
2. Set your nickname
3. Select your rate preferences
4. Mark your availability for each time slot
5. View the anonymous schedule to see who else is available

## Tech Stack

- **Next.js 14** (App Router)
- **Prisma** (SQLite)
- **Tailwind CSS**
- **TypeScript**

## Deployment

### Vercel + Neon/Supabase

1. Create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Deploy to Vercel and add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `ADMIN_PASSWORD` - A secure admin password

## License

MIT
