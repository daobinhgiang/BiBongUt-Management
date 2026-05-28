# BiBongUt LLC - Family Management App

## Project Overview
A family management mobile app built with Expo + Supabase. Features gamification (XP, levels, streaks, badges, coins), task management, chore charts, challenges, bucket lists, calendar, rewards shop, and more.

## Production Deployment
- **Frontend (web):** Hosted on **Vercel** — [https://bibongut.vercel.app/](https://bibongut.vercel.app/)
- **Backend:** Hosted on **Supabase** — project ref `bmyvkytdbarrfrkgsmak`, URL `https://bmyvkytdbarrfrkgsmak.supabase.co`
- **Database migrations** are applied via `npx supabase db push` or the Supabase dashboard (not automated on merge).

## Tech Stack
- **Framework:** Expo SDK 54, Expo Router v6, React Native 0.81
- **Language:** TypeScript strict (no `any` unless explicitly approved)
- **Styling:** NativeWind v4 (Tailwind CSS 3)
- **Backend:** Supabase (auth + Postgres DB + Edge Functions + Storage)
- **Auth storage:** expo-sqlite/localStorage (synchronous) — NOT AsyncStorage
- **State:** TanStack Query v5 (server), Zustand v5 (local UI), React Hook Form + Zod v4 (forms)
- **Icons:** Phosphor React Native

## Project Structure
```
bibongut/
  app/
    _layout.tsx          # Root layout: QueryClientProvider + SessionProvider + AuthGate + SplashScreen
    (auth)/              # login.tsx, signup.tsx (unauthenticated)
    (app)/family-setup.tsx # Family create/join (no family yet)
    (app)/(tabs)/        # 5 tabs: index (Tasks), challenges, plan, lists, me
    (app)/tasks/         # Task CRUD routes
    (app)/challenges/    # Challenge routes
    (app)/calendar/      # Calendar routes
    (app)/bucket-list/   # Bucket list routes
    (app)/chore-charts/  # Chore chart routes
    (app)/rewards/       # Reward shop routes
    (app)/settings/      # Settings + notification prefs
  components/            # AnimatedTabBar, StatsHeader, ui/ (Button, Input, Card, etc.)
  features/              # Feature modules (see pattern below)
  lib/
    supabase.ts          # Supabase client (URL polyfill + localStorage polyfill)
    auth/ctx.tsx         # SessionProvider + useSession hook
    query-client.ts      # TanStack Query client config
    stores/              # Zustand stores (developer-mode, etc.)
    date.ts              # Date/timezone utilities
  supabase/
    config.toml          # Supabase CLI config
    migrations/          # Timestamped SQL migrations
    functions/           # Edge Functions (send-push, etc.)
  types/
    database.types.ts    # Generated from `npm run db:types`
```

## Feature Module Pattern
Each feature in `features/` follows this structure:
```
features/<name>/
  api/          # Typed Supabase wrappers (all DB calls go here)
  hooks/        # React hooks
  components/   # UI components
  screens/      # Screen components
  schemas.ts    # Zod schemas
  types.ts      # TypeScript types
  index.ts      # Barrel export
```

### Implemented Features
- **Auth** — login, signup, session management
- **Families** — create/join, invite codes, member management
- **Tasks** — CRUD, recurring, difficulty, activity log, filter bar, due dates with timezone support
- **Gamification** — levels, badges (15 seeded), streaks, leaderboard, XP feed, profile, avatar upload
- **Challenges** — task-linked boss battles (dev mode only)
- **Bucket List** — photo journals, completion flow, timeline
- **Chore Charts** — weekly scheduling with admin role, server-side cron generation
- **Calendar** — events CRUD, month grid, attendees
- **Rewards** — coin shop, redemption history
- **Push Notifications** — Edge Function + Database Webhook + Expo Push API

### Not Yet Implemented
Shopping List, Meal Planning, Movies, Voting, Pantry

## Git & Shipping

### Branches
- `main` — production (auto-deploys to Vercel)
- `dev` — working branch (all development happens here)

### Shipping with `/ship`
Use the `/ship` skill to commit, push, and create PRs. The git repo is inside `bibongut/` (not the parent directory).

| Command | What it does |
|---------|-------------|
| `/ship` | Stage all changes, auto-generate commit message, push to `dev`, create PR to `main` |
| `/ship "Fix the auth bug"` | Same as above but use the quoted text as the commit message summary |
| `/ship and merge` | Ship + immediately merge the PR to `main` |
| `/ship here` | Ship ONLY files touched in this Claude Code session (other uncommitted changes stay) |
| `/ship here "Message"` | Session-only ship with a custom commit message |
| `/ship and review` | Ship, then run a code review on the diff using the senior-engineer skill |
| `/ship here merge` | Session-only ship + merge to main |
| `/ship merge review` | Ship + merge + code review |
| `/ship here merge review` | All modes combined |

**Post-merge note:** Database migrations are NOT auto-applied on merge. After shipping migrations, run `npx supabase db push` to apply them to production.

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Expo dev server |
| `npm run web` | Start for web |
| `npm run ios` | Start for iOS |
| `npm run android` | Start for Android |
| `npm run build:web` | Export for web |
| `npm run typecheck` | Run TypeScript check |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run db:types` | Generate Supabase types |

---

## Rules

### Workflow
- Pause after each major step, summarize what was done, wait for confirmation before continuing.
- Use the terminal to run commands directly; don't just write them in docs.

### TypeScript
- Strict mode. No `any` unless explicitly approved.

### Database / Supabase
- Every migration goes in `supabase/migrations/` with a timestamp prefix and a descriptive name.
- Every new table gets RLS enabled in the same migration that creates it. No exceptions.

### Client Code
- Every Supabase call goes through a typed wrapper in `features/<feature>/api/`. No raw `supabase.from()` calls in components.

### State Management
- Server state via TanStack Query. Local UI state via Zustand or useState. Never mix.

### Linter Behavior
- A linter/formatter auto-runs and sometimes reverts Edit changes. Use full `Write` rewrites for affected files.

### General
- Don't generate placeholder/mock data unless explicitly asked.
- When hitting a real tradeoff, name it, pick a default, and move on. Don't ask about formatting or style.
- Don't add features, refactor code, or make "improvements" beyond what was asked.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen.
- Don't create helpers, utilities, or abstractions for one-time operations.
