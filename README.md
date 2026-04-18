# The Left-Behind Club

A private group platform for friends to stay connected through shared activities. Built with Next.js 16, Supabase, and deployed on Vercel.

## Current Modules

- **FIFA World Cup 2026** (`/fifa2026`) - Predict match winners, exact scores, and answer fun questions. Compete on the leaderboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Monorepo | Nx |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL |
| ORM | Drizzle ORM |
| i18n | next-intl (Chinese / English) |
| Email | Resend |
| Hosting | Vercel |
| Package Manager | pnpm |

## Project Structure

```
the-left-behind-club/
├── apps/
│   └── web/                    # Next.js app
│       ├── app/
│       │   ├── page.tsx        # Portal (module hub)
│       │   ├── login/          # Google sign-in
│       │   ├── auth/callback/  # OAuth callback
│       │   └── fifa2026/       # World Cup module
│       │       ├── page.tsx            # Dashboard
│       │       ├── matches/            # Match list & detail
│       │       ├── champion/           # Tournament winner guess
│       │       ├── leaderboard/        # Rankings
│       │       └── my-guesses/         # Personal history
│       ├── components/ui/      # shadcn/ui components
│       ├── lib/
│       │   ├── supabase/       # Supabase client (server/client/middleware)
│       │   └── utils.ts        # Utility functions
│       ├── i18n/               # next-intl config
│       └── messages/           # en.json, zh.json
├── packages/
│   └── db/                     # Shared database package
│       └── src/schema/         # Drizzle schema (core + fifa2026)
├── supabase/
│   ├── config.toml             # Local Supabase config
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Seed data
└── .env.example                # Environment variable template
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase, allocate >= 8 GB RAM)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

## Getting Started

### 1. Clone and install

```bash
git clone git@github.com:dn3point/the-left-behind-club.git
cd the-left-behind-club
pnpm install
```

### 2. Start local Supabase

Make sure Docker Desktop is running with at least 8 GB memory allocated.

```bash
supabase start
```

This will:
- Start local PostgreSQL, Auth, Studio, and other services
- Apply migrations to create all tables
- Seed initial data (allowed emails, FIFA 2026 module)

After startup, you'll see the local URLs and keys printed in the terminal.

### 3. Configure environment

Copy the example env file:

```bash
cp .env.example apps/web/.env.local
```

Update `apps/web/.env.local` with the values from `supabase start` output:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 4. (Optional) Set up Google OAuth for local testing

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services > Credentials > Create OAuth Client ID**
3. Add authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
4. Create a `.env` file in the project root:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
5. Restart Supabase: `supabase stop --no-backup && supabase start`

### 5. Start the dev server

```bash
pnpm nx dev web
```

Visit [http://localhost:3000](http://localhost:3000).

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm nx dev web` | Start dev server |
| `pnpm nx build web` | Production build |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase db reset` | Reset DB and re-apply migrations + seed |
| `supabase studio` | Open Supabase Studio (http://127.0.0.1:54323) |

## Local Services

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Supabase API | http://127.0.0.1:54321 |
| Supabase Studio | http://127.0.0.1:54323 |
| Inbucket (email) | http://127.0.0.1:54324 |

## Database Schema

The schema is designed to be extensible for future modules:

- **Core tables**: `users`, `modules`, `module_members`, `allowed_emails`
- **FIFA 2026 tables**: `teams`, `matches`, `guess_questions`, `user_guesses`, `tournament_winner_guesses`, `leaderboards`

Guess questions support two scoring modes:
- `exact` - Points for matching the correct answer (match winner, score predictions)
- `majority` - Points for picking the most popular answer (fun/culture questions)

## Access Control

This is a private app. Only whitelisted email addresses can access it:
1. User signs in with Google
2. Middleware checks if the user's email exists in `allowed_emails` table
3. If not whitelisted, they see an unauthorized message

Add members by inserting emails into the `allowed_emails` table via Supabase Studio or a seed file.
