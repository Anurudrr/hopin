# HopIn: Premium Monochrome Ride-Sharing

HopIn is a full-stack shared-mobility web application designed for Indian city corridors. It features a complete end-to-end booking, routing, and driver dispatch system.

**Aesthetic Focus:** The frontend has been completely overhauled to feature an "Awwwards-level" **Brutalist Monochrome Design** (inspired by Tribe Stays). This includes stark black-and-white contrasts, massive typography, heavy borders, a custom Framer Motion cursor, and subtle magnetic hover interactions.

## 🛠 Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS v4 (Strict Monochrome Theme)
- Framer Motion (Page transitions, custom cursors, magnetic buttons)
- Zustand (Client state & auth management)
- Lucide React (Icons)
- React Leaflet (High-contrast grayscale routing maps)

**Backend:**
- Node.js API server (in `backend/`)
- SQLite persistence via `node:sqlite`
- Custom JWT-based Authentication

## ✨ Features

- **Brutalist UI/UX:** A striking editorial aesthetic with zero rounded corners, 4px/8px harsh drop shadows, and an animated custom cursor that inverts colors.
- **Micro-Interactions:** Magnetic pull effects on primary call-to-actions and a subtle global noise texture overlay.
- **Authentication:** Account registration and login with persistent server-side sessions.
- **Rider Flow:** Onboarding, saved city preferences, profile management, and live booking flows.
- **Driver Flow:** Application processing with document confirmations, vehicle metadata, and live dashboard.
- **Interactive Routing:** Real-time B&W route visualizations using Leaflet.

## 🚀 Quick Start

### Prerequisites
- Node.js 22 or newer

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup Environment Variables:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Local Development

Start both the API and Vite dev server simultaneously:

```bash
npm run dev
```

- The **frontend** runs on `http://localhost:3000`
- The **backend API** runs on `http://localhost:4100` (The frontend proxies `/api` requests to this port).

## 🎨 Design System Guidelines (For Contributors)

To maintain the strict Brutalist aesthetic, please adhere to these rules when adding new components:
1. **Colors:** Use *only* pure black (`#000000`), pure white (`#FFFFFF`), or strict grays. Avoid all color accents (e.g., blue, orange, green).
2. **Borders:** All borders must be sharp (0px border-radius) and thick (typically 2px to 4px).
3. **Shadows:** Use the custom brutalist shadow classes (`shadow-soft` or `shadow-premium`) which define hard, non-blurred drop shadows (e.g., `4px 4px 0px 0px rgba(0,0,0,1)`).
4. **Typography:** Use uppercase `font-black` or `font-bold` heavily for headings and interactive elements.
5. **Cursor:** Ensure interactive elements trigger the global `CustomCursor` inversion by keeping them standard clickable elements or wrapping them appropriately.

## 📦 Production Build

Build the frontend:
```bash
npm run build
```

Serve the built app and API from one process:
```bash
npm run start
```

## 🗄 Data Storage

- SQLite database path: `data/hopin.sqlite` by default
- The `data/` directory is ignored by git
- Demo dispatch drivers are seeded automatically for local testing
