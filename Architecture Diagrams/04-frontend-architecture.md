# 04 · Frontend Architecture

The frontend is a **Next.js 16 App Router** application running on React 19.
Almost every page is a client component (`"use client"`) — the server is
mainly there to host the proxy, fonts, and the root layout.

## Application tree

```mermaid
flowchart TB
    Browser["🌐 Browser"]

    subgraph SSR["Next.js Server"]
        Proxy["next.config.ts<br/>rewrites: /api/:path* → BACKEND_URL/:path*"]
        Root["app/layout.tsx · Server Component<br/>Fonts (Fraunces, Outfit) · &lt;html&gt;/&lt;body&gt;"]
    end

    subgraph Providers["app/providers.tsx · Client"]
        Theme["next-themes ThemeProvider"]
        Auth["AuthProvider<br/>(src/components/auth-provider.tsx)<br/>user · isAuthenticated · isLoading<br/>login() · logout() · signup()<br/>acceptInvite() · refresh()"]
        Cart["CheckoutCartProvider"]
        Toaster["sonner Toaster"]
    end

    subgraph Public["Public routes"]
        direction TB
        Login[/"/" · login/]
        Signup[/"/signup"/]
        Forgot[/"/forgot-password"/]
        Reset[/"/reset-password"/]
        Invite[/"/invite/[token]"/]
        NF[/"not-found.tsx"/]
    end

    subgraph Dash["(dashboard) route group · protected"]
        DLayout["(dashboard)/layout.tsx<br/>Collapsible sidebar · role-gated nav<br/>redirects to / if !isAuthenticated"]
        Dashboard[/"/dashboard"/]
        Catalog[/"/catalog"/]
        Circulation[/"/circulation"/]
        IngestPage[/"/ingest"/]
        MapPage[/"/map"/]
        Members[/"/members"/]
        Reports[/"/reports"/]
        Settings[/"/settings"/]
    end

    subgraph Lib["src/lib"]
        ApiFetch["api.ts<br/>apiFetch / apiUpload<br/>credentials: 'include'<br/>envelope normalisation<br/>ApiError class"]
        AuthLib["auth.ts<br/>loginApi · logoutApi · fetchCurrentUser<br/>signupApi · acceptInviteApi<br/>requestResetApi · resetPasswordApi"]
        Books["books.ts"]
        Utils["utils.ts (cn helper)"]
    end

    Backend(("Express backend"))

    Browser --> Proxy
    Proxy --> Root
    Root --> Providers
    Providers --> Public
    Providers --> Dash

    DLayout --> Dashboard
    DLayout --> Catalog
    DLayout --> Circulation
    DLayout --> IngestPage
    DLayout --> MapPage
    DLayout --> Members
    DLayout --> Reports
    DLayout --> Settings

    Auth -.->|reads/writes| AuthLib
    Catalog -.-> Books
    Login -.-> AuthLib
    Signup -.-> AuthLib
    Forgot -.-> AuthLib
    Reset -.-> AuthLib
    Invite -.-> AuthLib

    AuthLib --> ApiFetch
    Books --> ApiFetch
    ApiFetch -- "/api/* (relative)" --> Proxy
    Proxy -- "absolute URL · cookie carried" --> Backend

    classDef server fill:#1B2A4A,stroke:#1B2A4A,color:#fff
    classDef provider fill:#C4956A,stroke:#7d5a3a,color:#fff
    classDef public fill:#F8F7F4,stroke:#1B2A4A,color:#1B2A4A
    classDef protected fill:#fff,stroke:#1B2A4A,stroke-width:2px,color:#1B2A4A
    classDef lib fill:#F8F7F4,stroke:#7d5a3a,color:#7d5a3a
    class Proxy,Root server
    class Theme,Auth,Cart,Toaster provider
    class Login,Signup,Forgot,Reset,Invite,NF public
    class DLayout,Dashboard,Catalog,Circulation,IngestPage,MapPage,Members,Reports,Settings protected
    class ApiFetch,AuthLib,Books,Utils lib
```

## Routing

| Group         | Path                          | Description                                                                |
|---------------|-------------------------------|----------------------------------------------------------------------------|
| Root          | `/`                           | Login form. Redirects to `/dashboard` if already authenticated.            |
| Public        | `/signup`                     | Create a new organization + first ADMIN user.                              |
| Public        | `/forgot-password`            | Request a password reset email.                                            |
| Public        | `/reset-password`             | Set a new password from a reset token (`?token=…`).                        |
| Public        | `/invite/[token]`             | Accept an invite. Renders org name + role from the token preview.          |
| `(dashboard)` | `/dashboard`                  | Role-aware landing page. Different KPIs for admin / staff / patron.        |
| `(dashboard)` | `/catalog`                    | Book CRUD, search, bulk upload (XLSX / ISBN list / file).                  |
| `(dashboard)` | `/circulation`                | Checkout, check-in, active loans, fines, transaction history.              |
| `(dashboard)` | `/ingest`                     | AI book-ingestion image upload + job-review dialog.                        |
| `(dashboard)` | `/map`                        | 2-D library floor map (React Flow + dnd-kit) and first-person shelf view.  |
| `(dashboard)` | `/members`                    | User management (Admin only).                                              |
| `(dashboard)` | `/reports`                    | Analytics dashboards (recharts) — circulation, collection, financial.      |
| `(dashboard)` | `/settings`                   | Organization rename, profile, invite management.                           |

## Authentication on the client

```mermaid
sequenceDiagram
    autonumber
    participant App as Root layout
    participant AP as AuthProvider
    participant API as apiFetch('/auth/me')
    participant BE as Backend

    Note over App,BE: On first mount

    App->>AP: mount
    AP->>AP: useState({ user: null, isLoading: true })
    AP->>API: GET /auth/me (cookie attached)
    API->>BE: HttpOnly cookie 'token' carried by browser
    alt valid session
        BE-->>AP: 200 { user }
        AP->>AP: set { user, isAuthenticated: true, isLoading: false }
    else no/expired cookie
        BE-->>AP: 401
        AP->>AP: set { user: null, isAuthenticated: false, isLoading: false }
    end

    Note over AP: (dashboard)/layout.tsx redirects to "/" while !isAuthenticated
```

- `apiFetch` (in `src/lib/api.ts`) always sets `credentials: 'include'`, so
  the browser ships the `token` cookie with every request.
- The dashboard layout watches `useAuth()`; when `isLoading === false &&
  !isAuthenticated`, it redirects to `/`.
- The sidebar nav is **role-gated client-side**: `Members`, `Reports`,
  `Ingest`, etc. are filtered out for `PATRON` users. Server-side enforcement
  is the source of truth (see [11 · RBAC Matrix](./11-rbac-matrix.md)) — the
  client filter is purely cosmetic.

## Same-origin proxy

The frontend never points the browser directly at the backend in production.
Instead, `next.config.ts` rewrites every `/api/*` URL on the server side to
`BACKEND_URL/*`. This means:

| Concern                           | Outcome                                                   |
|-----------------------------------|-----------------------------------------------------------|
| Browser sees cookie as same-origin| `SameSite=Lax` works in dev, no CORS preflight in prod    |
| `BACKEND_URL` not exposed         | It has no `NEXT_PUBLIC_` prefix → server-only             |
| Local-only direct calls           | Override with `NEXT_PUBLIC_API_URL=http://localhost:3001` |

## Build, lint, test

| Command              | Purpose                                                |
|----------------------|--------------------------------------------------------|
| `npm run dev`        | Next.js dev server with Turbopack.                     |
| `npm run build`      | Production build.                                      |
| `npm run start`      | Production server.                                     |
| `npm run lint`       | ESLint 9 with `eslint-config-next`.                    |
| `npm run typecheck`  | `tsc --noEmit`.                                        |
| `npm run test`       | Vitest unit tests.                                     |
| `npm run test:e2e`   | Playwright end-to-end tests.                           |

## Component library

- `src/components/ui/` — 46 shadcn/ui primitives (button, card, dialog,
  table, tabs, sheet, drawer, command, popover, calendar, …).
- `src/components/map/` — feature-specific React Flow + dnd-kit components:
  `MapCanvas`, `ShelfNode`, `ShelfPalette`, `ShelfSettingsPanel`,
  `ShelfFirstPersonView`, `MapCallbacksContext`, `mapLayoutSignature`.
- `src/components/ingest/` — `JobReviewDialog`.
- `src/components/auth-provider.tsx`, `providers.tsx`, `checkout-cart-provider.tsx`
  — top-level Context providers.
