# BiBongUt LLC - Family Management App

## Project Overview
A family management mobile app built with Expo + Supabase. Currently in scaffolding-complete stage — data model + RLS policies are next, then feature implementation.

## Production deployment
- **Frontend (web):** Hosted on **Vercel** — [https://bibongut.vercel.app/](https://bibongut.vercel.app/)
- **Backend:** Hosted on **Supabase** — project ref `bmyvkytdbarrfrkgsmak`, URL `https://bmyvkytdbarrfrkgsmak.supabase.co`

## Tech Stack
- **Framework:** Expo SDK 54, Expo Router v6, React Native 0.81
- **Language:** TypeScript strict (no `any` unless explicitly approved)
- **Styling:** NativeWind v4 (Tailwind CSS 3)
- **Backend:** Supabase (auth + Postgres DB)
- **Auth storage:** expo-sqlite/localStorage (synchronous) — NOT AsyncStorage
- **State:** TanStack Query v5 (server), Zustand v5 (local UI), React Hook Form + Zod v4 (forms)

## Project Structure
```
bibongut/
  app/
    _layout.tsx          # Root layout: QueryClientProvider + SessionProvider + AuthGate
    (auth)/              # login.tsx, signup.tsx (unauthenticated)
    (app)/family-setup.tsx # Family create/join (no family yet)
    (app)/(tabs)/        # 5 tabs: index (Do), challenges, plan, lists, me (authenticated)
  components/ui/         # Button, Input, Card, Avatar, Badge, ProgressBar
  features/              # Feature modules (see below)
  lib/
    supabase.ts          # Supabase client (URL polyfill + localStorage polyfill)
    auth/ctx.tsx         # SessionProvider + useSession hook
    query-client.ts      # TanStack Query client config
  supabase/
    config.toml          # Supabase CLI config
    migrations/          # Timestamped SQL migrations
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
  types.ts      # TypeScript types
  index.ts      # Barrel export
```

### Scaffolded Features (no business logic yet)
auth, tasks, bucketList, movies, challenges, calendar, shoppingList, mealPlanning, pantry, voting, gamification (8 sub-modules), rewards (4 sub-modules)

## Key Architectural Decisions
- NativeWind v4 stable (not v5 preview)
- expo-sqlite localStorage for Supabase auth (not AsyncStorage)
- EXPO_PUBLIC_ env vars (no expo-constants needed)
- Supabase CLI initialized locally

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
- Don't commit. User handles git.

### TypeScript
- Strict mode. No `any` unless explicitly approved.

### Database / Supabase
- Every migration goes in `supabase/migrations/` with a timestamp prefix and a descriptive name.
- Every new table gets RLS enabled in the same migration that creates it. No exceptions.

### Client Code
- Every Supabase call goes through a typed wrapper in `features/<feature>/api/`. No raw `supabase.from()` calls in components.

### State Management
- Server state via TanStack Query. Local UI state via Zustand or useState. Never mix.

### General
- Don't generate placeholder/mock data unless explicitly asked.
- When hitting a real tradeoff, name it, pick a default, and move on. Don't ask about formatting or style.
- Don't add features, refactor code, or make "improvements" beyond what was asked.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen.
- Don't create helpers, utilities, or abstractions for one-time operations.
