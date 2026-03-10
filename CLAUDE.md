# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShelfSight is an AI-assisted library management system. This is the **frontend** repository. The backend lives alongside in the `shelfsight-backend/` folder (Express + Prisma + PostgreSQL via Docker).

## Development Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** TailwindCSS v4 (CSS-first config in `globals.css`)
- **Component Library:** ShadCN/UI (46 components in `src/components/ui/`)
- **Icons:** lucide-react
- **Charts:** recharts
- **Animations:** motion (framer-motion)
- **Toasts:** sonner
- **Theme:** next-themes (light/dark support)
- **Deployment:** Vercel
- **Runtime:** Node.js v20.x LTS or higher

## Architecture

Three-tier system: Next.js frontend (Vercel) → Express REST API (`shelfsight-backend/`) → PostgreSQL (Docker Compose, port 5432).

All dashboard pages are connected to real backend endpoints — no mock data.

### App Router Structure

```
src/app/
├── layout.tsx                    # Root layout (fonts, providers, toaster)
├── page.tsx                      # Login page (root "/")
├── globals.css                   # TailwindCSS v4 theme + base styles
└── (dashboard)/                  # Route group with sidebar layout
    ├── layout.tsx                # Collapsible sidebar navigation
    ├── dashboard/page.tsx
    ├── ingest/page.tsx           # AI book ingestion
    ├── map/page.tsx              # Interactive 2D library map
    ├── catalog/page.tsx
    ├── circulation/page.tsx      # Check-in/check-out
    ├── members/page.tsx
    └── reports/page.tsx          # Analytics with recharts
```

### Key Directories

- `src/components/ui/` — ShadCN UI primitives (button, card, table, dialog, etc.)
- `src/components/providers.tsx` — Client-side ThemeProvider + AuthProvider wrapper
- `src/components/auth-provider.tsx` — AuthContext with `useAuth()` hook (user, login, logout, isAuthenticated)
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/lib/api.ts` — Base `apiFetch()` wrapper (credentials: include, typed errors)
- `src/lib/auth.ts` — Auth API functions (loginApi, logoutApi, fetchCurrentUser)
- `Figma Mockups/` — Original Vite prototype from Figma Make (design reference only, excluded from TS compilation)

### Design Patterns

- Primary brand color: `indigo-600`
- All page components are client components (`"use client"`)
- Authentication uses JWT in HttpOnly cookies — frontend sends `credentials: 'include'` (no client-side token storage)
- Auth state managed via React Context (`AuthProvider` + `useAuth()` hook)
- Dashboard routes are protected — unauthenticated users are redirected to `/`
- API base URL configured via `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:3001`)
- Sidebar navigation uses Next.js `<Link>` with `usePathname()` for active state
- ShadCN components import `cn` from `@/lib/utils`

### Key Feature Areas

- **Catalog management** — book CRUD (add/edit/delete), search/filter by title, author, subject, Dewey category. Connected to `GET/POST/PUT/DELETE /books`
- **AI book ingestion** — image upload (cover/spine) → `POST /ingest/analyze` → AI-generated metadata for review → accept to add to catalog via `POST /books`
- **Circulation** — check-in/check-out, due dates, overdue tracking, fine display. Connected to `GET /loans`, `POST /loans/checkout`, `POST /loans/checkin`
- **2D library map** — React Flow interactive map with drag-and-drop shelf placement, custom shelf nodes, first-person shelf viewer
- **Members** — user CRUD (add/edit/view/delete), role management (Admin/Staff/Patron). Connected to `GET/POST/PUT/DELETE /users`

### Backend API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate; sets HttpOnly JWT cookie, returns user |
| `POST` | `/auth/logout` | Clears JWT cookie |
| `GET` | `/auth/me` | Current user profile (requires auth cookie) |
| `GET` | `/books` | Search/filter books (query params: `search`, `genre`, `page`, `limit`) |
| `POST` | `/books` | Create book record (title, author, isbn required) |
| `PUT` | `/books/:id` | Update book (title, author, isbn, genre, deweyDecimal, coverImageUrl) |
| `DELETE` | `/books/:id` | Delete book |
| `GET` | `/users` | List all users (Admin only) |
| `POST` | `/users` | Create user (email, password, name, role) |
| `PUT` | `/users/:id` | Update user (name, email, role, optional password) |
| `DELETE` | `/users/:id` | Delete user |
| `GET` | `/loans` | List loans (query params: `status=active\|returned\|overdue`, `userId`, `page`, `limit`) |
| `POST` | `/loans/checkout` | Create loan (bookCopyId required, optional userId for admin checkout) |
| `POST` | `/loans/checkin` | Return book, calculate fines (loanId required) |
| `POST` | `/ingest/analyze` | Image upload (multipart) → AI-generated metadata for review |
| `GET` | `/map/sections` | 2D map coordinates + labels |
| `GET` | `/map/shelves/:id` | Shelf contents for first-person view |

### Running the Full Stack

```bash
# 1. Start PostgreSQL via Docker
cd shelfsight-backend && docker compose up -d

# 2. Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# 3. Start backend (port 3001)
npm run dev

# 4. Start frontend (port 3000, in another terminal)
cd shelfsight-frontend && npm run dev
```

## Project Links

- **Jira:** https://t10-shelfsight.atlassian.net/jira/software/projects/KAN/boards/1
- **Figma:** https://www.figma.com/design/eSVYSDo7JNH0Rv1Rxuhbng/UI-UX-Design
- **Backend repo:** https://github.com/Chimezie03/shelfsight-backend
