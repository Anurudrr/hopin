# HopIn

HopIn is a shared urban mobility web app for Indian cities. The frontend is built with React 19, Vite, TypeScript, Zustand, Framer Motion, React Leaflet, and Tailwind CSS v4. Production data and authentication now run directly on Supabase, so the app deploys cleanly on Vercel without a persistent Node server.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand
- Framer Motion
- React Leaflet
- Supabase Auth + Postgres

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy the env template and fill in your Supabase values:

```bash
cp .env.example .env.local
```

3. Run the Vite dev server:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Supabase Setup

The repo includes SQL migrations in [supabase/migrations](/C:/Users/rajaw/Downloads/hopin%20(9)/supabase/migrations) for:

- Core HopIn tables and RLS policies
- The `book_ride` booking RPC
- The `cancel_booking` booking-cancellation RPC

Apply those migrations in your Supabase project before using the production flows.

## Build

```bash
npm run build
```

Preview the production bundle locally with:

```bash
npm run preview
```

## Deploying to Vercel

Set these environment variables in the Vercel dashboard:

- `VITE_SUPABASE_URL` — from Supabase project Settings > API
- `VITE_SUPABASE_ANON_KEY` — from Supabase project Settings > API

The `VITE_` prefix is required so Vite exposes the values to the browser bundle.
