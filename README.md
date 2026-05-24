# BiBongUt LLC - Family Management App

A gamified family management app built with Expo (React Native) and Supabase. Helps families organize tasks, plan meals, manage shopping lists, track goals, and stay engaged through a fun XP/rewards system.

### Production

The web app is **deployed and hosted on Vercel**: https://bibongut.vercel.app/

## Features

### Core
- **Tasks** - Create, assign, and track household tasks with recurring schedules and priorities
- **Calendar** - Shared family calendar with events and reminders
- **Meal Planning** - Weekly meal planner with recipe suggestions
- **Shopping List** - Collaborative grocery lists with store section categories
- **Pantry** - Inventory tracking with expiration date monitoring

### Social
- **Bucket List** - Family goals and dreams with voting and progress tracking
- **Movies** - Collaborative watchlist with ratings and reviews
- **Voting** - Family decision-making system for activities, meals, and more
- **Challenges** - Time-bound challenges (daily/weekly/monthly) for bonus rewards

### Gamification
- **XP & Levels** - Earn experience points from tasks, challenges, and quests
- **Streaks** - Track consecutive-day activity streaks
- **Badges** - Achievement badges for reaching milestones
- **Daily Quests** - Auto-generated objectives to encourage engagement
- **Leaderboard** - Family rankings by XP and achievements
- **Family Level** - Collective family progression system
- **Titles** - Unlockable user titles and ranks

### Rewards
- **Token Economy** - Earn tokens from tasks and challenges
- **Reward Shop** - Browse and purchase rewards with tokens
- **Auctions** - Bid on special or limited rewards
- **Redemption** - Parent-approved reward fulfillment

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (React Native) |
| Routing | Expo Router v6 (file-based) |
| Language | TypeScript (strict mode) |
| Styling | NativeWind v4 (Tailwind CSS 3) |
| Backend | Supabase (Auth, Database, Realtime) |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Notifications | expo-notifications |

## Prerequisites

- **Node.js** 20+
- **Expo CLI** (`npx expo`)
- **Supabase CLI** (`brew install supabase/tap/supabase`)
- iOS Simulator (macOS) or Android Emulator (optional)

## Getting Started

```bash
# 1. Clone and install
cd bibongut
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 3. Link Supabase (if using local dev)
supabase link --project-ref <your-project-ref>

# 4. Generate database types (after creating tables)
npm run db:types

# 5. Start the dev server
npm run dev        # Interactive (choose platform)
npm run web        # Web only
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## Project Structure

```
bibongut/
  app/                              # Expo Router file-based routes
    _layout.tsx                     # Root: providers + auth gate
    (auth)/                         # Unauthenticated screens
      _layout.tsx
      login.tsx
      signup.tsx
    (app)/                          # Authenticated screens
      _layout.tsx
      (tabs)/                       # Bottom tab navigator
        _layout.tsx                 # 5 tabs: Home, Do, Plan, Lists, Me
        index.tsx                   # Home (dashboard)
        do.tsx                      # Tasks + Challenges
        plan.tsx                    # Calendar + Meal Planning
        lists.tsx                   # Shopping + Pantry + Bucket List + Movies
        me.tsx                      # Profile + Gamification
  components/
    ui/                             # Shared UI primitives
      Button.tsx, Input.tsx, Card.tsx, Avatar.tsx, Badge.tsx, ProgressBar.tsx
  features/                         # Feature modules (vertical slices)
    auth/                           # Authentication
    tasks/                          # Task management
    bucketList/                     # Family bucket list
    movies/                         # Movie watchlist
    challenges/                     # Challenges system
    calendar/                       # Shared calendar
    shoppingList/                   # Shopping lists
    mealPlanning/                   # Meal planning
    pantry/                         # Pantry inventory
    voting/                         # Family voting
    gamification/                   # XP, levels, streaks, badges, quests, etc.
      xp/ levels/ streaks/ badges/ quests/ leaderboard/ familyLevel/ titles/
    rewards/                        # Token economy
      shop/ redemption/ auction/ tokens/
  lib/
    supabase.ts                     # Supabase client (with localStorage polyfill)
    query-client.ts                 # TanStack Query client configuration
    auth/
      ctx.tsx                       # SessionProvider + useSession hook
  hooks/                            # Cross-feature hooks
  stores/                           # Zustand stores
  types/
    database.types.ts               # Auto-generated Supabase types
  constants/                        # Theme tokens, app config
  supabase/
    config.toml                     # Supabase CLI config
    migrations/                     # SQL migration files
```

Each feature folder contains:
- `hooks/` - React hooks for data fetching and mutations
- `components/` - UI components specific to the feature
- `types.ts` - TypeScript type definitions
- `index.ts` - Barrel export
- `README.md` - Feature documentation

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Expo dev server (interactive) |
| `npm run web` | Start web dev server |
| `npm run ios` | Start iOS simulator |
| `npm run android` | Start Android emulator |
| `npm run build:web` | Export static web build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run db:types` | Generate Supabase database types |

## Deploying the web build

**Current production:** The app is live on **Vercel** at https://bibongut.vercel.app/ (configured via [`vercel.json`](vercel.json): build writes to `dist/` with SPA fallback).

The web target is a **static export**: `npm run build:web` runs `expo export --platform web` and writes production assets to the **`dist/`** directory (upload everything inside `dist`, not the repo root).

1. **Production environment variables** — `EXPO_PUBLIC_*` values from [`.env.example`](.env.example) are inlined at **build** time. Set them in your CI/hosting provider’s build environment (or export them in the shell) before running the build command; they are not read from a `.env` file on the server after deploy.

2. **Build**

   ```bash
   npm run build:web
   ```

3. **Host `dist/`** on any static host (HTTPS in production). **This project’s production deployment is Vercel** (see URL above); other examples include [Netlify](https://docs.expo.dev/guides/publishing-websites/#hosting-with-netlify-cli), [Firebase Hosting](https://docs.expo.dev/guides/publishing-websites/#hosting-with-firebase-cli), S3 + CloudFront, etc.

4. **Smoke-test locally** — after exporting, you can serve the folder with Expo’s static server:

   ```bash
   npx expo serve
   ```

5. **Supabase** — In the Supabase dashboard, add your production site URL to **Authentication → URL configuration** (redirect / site URL allowlists) so login and deep links work.

If refreshing a deep link returns 404 on your host, configure **SPA-style fallback** to your entry HTML as described in [Publishing websites](https://docs.expo.dev/guides/publishing-websites/) for your chosen provider (behavior depends on host and Expo Router output).

Official reference: [Deploy Expo web apps](https://docs.expo.dev/deploy/web/).

## Using the app on mobile (browser and PWA)

**Mobile browser:** Open your deployed HTTPS URL in Safari (iOS) or Chrome (Android). Same functionality as desktop web; use your normal login flow.

**Progressive Web App (installable home-screen experience):** Production PWAs require **HTTPS**. This repo’s [`app.json`](app.json) configures web export (`output: "static"`) but does **not** yet ship a web app manifest or service worker—browsers may still offer a minimal “Add to Home Screen” experience, but for a proper installable PWA (icons, `standalone` display, optional offline caching), follow Expo’s guide:

- [Progressive Web Apps](https://docs.expo.dev/guides/progressive-web-apps/) — add `public/manifest.json`, wire `<link rel="manifest" …>` via [`app/+html.tsx`](https://docs.expo.dev/router/reference/static-rendering/#root-html) for static output, and optionally add `public/sw.js` (e.g. via [Workbox](https://developer.chrome.com/docs/workbox)) for offline support.

After that is in place, rebuild with `npm run build:web`, redeploy `dist/`, and use **Add to Home Screen** (iOS Safari share menu) or **Install app** (Chrome) on your device.

## What's Next

1. **Data Model** - Design and create Supabase tables with RLS policies
2. **Auth Forms** - Implement login/signup with email, Google, Apple, phone OTP
3. **Feature Implementation** - Build out features starting with tasks and gamification
4. **Design System** - Establish color palette, typography, and component variants
5. **Push Notifications** - Configure expo-notifications for reminders and updates
6. **Real-time** - Add Supabase Realtime for live updates across family members
