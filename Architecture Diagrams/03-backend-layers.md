# 03 · Backend Layers

The Express backend follows a strict layered architecture. Each request flows
top-to-bottom through middleware, route, controller, service, and finally
Prisma — never skipping layers.

```mermaid
flowchart TB
    Req["📨 Incoming HTTP request"]

    subgraph MW["Middleware (src/app.ts)"]
        direction TB
        H["helmet()"]
        C["cors({ origin: CORS_ORIGIN, credentials: true })"]
        J["express.json({ limit: '10mb' })"]
        CK["cookie-parser"]
        RL["express-rate-limit<br/>(production only)<br/>global 300/15min · auth 15/15min"]
        L["morgan('dev') | httpAccessLog"]
        H --> C --> J --> CK --> RL --> L
    end

    subgraph AuthMW["Auth middleware (src/middleware/auth.middleware.ts)"]
        direction TB
        RA["requireAuth<br/>verifies JWT from req.cookies.token<br/>attaches req.user (AuthPayload)"]
        RR["requireRole(...)<br/>checks req.user.role ∈ allowed[]"]
        RA --> RR
    end

    subgraph Routes["Routes (src/routes/*)"]
        direction LR
        Auth[/auth/]
        Books[/books/]
        Loans[/loans/]
        Fines[/fines/]
        Map[/map/]
        Ingest[/ingest/]
        Users[/users/]
        Orgs[/orgs/]
        Tx[/transactions/]
        Health[/health/]
    end

    subgraph Ctrl["Controllers (src/controllers/*)"]
        direction LR
        ParseReq["Parse req<br/>(body / params / query)"]
        ShapeRes["Shape response<br/>(envelopes, status codes)"]
        ParseReq -.-> ShapeRes
    end

    subgraph Svc["Services (src/services/*)"]
        direction LR
        Biz["Business logic<br/>auth.service · books.service<br/>loans.service · fines.service<br/>map.service · ingest.service<br/>invites.service · users.service<br/>organizations.service · transactions.service<br/>mapPlacementHints.service"]
    end

    subgraph LibLayer["lib/* (cross-cutting helpers)"]
        direction LR
        Prisma["prisma.ts<br/>forOrg(orgId) tenant scope"]
        AuthLib["(JWT, bcrypt — auth.service)"]
        Mail["resend-mail.ts"]
        Errs["errors.ts<br/>(AppError class)"]
        Async["async-handler.ts<br/>wrapAsync(fn)"]
        Logger["logger.ts"]
    end

    DB[("PostgreSQL")]

    EH["errorHandler<br/>(src/middleware/error-handler.ts)<br/>uniform JSON envelope"]
    Res["📤 HTTP response"]

    Req --> MW --> AuthMW --> Routes --> Ctrl --> Svc --> LibLayer
    Prisma -- "SQL" --> DB
    Svc -.->|on throw| EH
    Ctrl -.->|on throw| EH
    LibLayer --> Res
    EH --> Res

    classDef mw fill:#F8F7F4,stroke:#1B2A4A,color:#1B2A4A
    classDef auth fill:#C4956A,stroke:#7d5a3a,color:#fff
    classDef route fill:#1B2A4A,stroke:#1B2A4A,color:#fff
    classDef svc fill:#fff,stroke:#1B2A4A
    class H,C,J,CK,RL,L mw
    class RA,RR auth
    class Auth,Books,Loans,Fines,Map,Ingest,Users,Orgs,Tx,Health route
    class ParseReq,ShapeRes,Biz,Prisma,AuthLib,Mail,Errs,Async,Logger svc
```

## Layer responsibilities

| Layer           | Folder                       | Responsibility                                                                          | Forbidden from                                |
|-----------------|------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------|
| **Middleware**  | `src/middleware/` & `src/app.ts` | Cross-cutting concerns: security headers, CORS, body parsing, rate limiting, auth, errors. | Containing business logic.                    |
| **Routes**      | `src/routes/`                | HTTP method + path → controller binding. Apply `requireAuth` / `requireRole`.            | Containing logic. Routes should be one-liners. |
| **Controllers** | `src/controllers/`           | Translate `Request` → service input, then service output → `Response`.                   | Calling Prisma directly.                       |
| **Services**    | `src/services/`              | All business logic. Orchestrate Prisma + external APIs. Throw `AppError` for known failures. | Touching `req` / `res`.                     |
| **Lib**         | `src/lib/`                   | Stateless helpers used by every layer (Prisma client, error class, JWT, email).         | Holding mutable state.                         |

## Key patterns

### `wrapAsync`
Every async controller is wrapped with `wrapAsync(handler)` from
`src/lib/async-handler.ts`. This bridges promise rejections into Express's
`next(err)` so the global `errorHandler` can format them.

```ts
router.post('/checkout', requireAuth, requireRole('ADMIN', 'STAFF'), wrapAsync(checkout));
```

### `AppError`
A custom error class (`src/lib/errors.ts`) carrying `statusCode`, `code`
(machine-readable string like `RESOURCE_UNAVAILABLE`), `message`, and an
optional `details` payload (used for `fieldErrors`). The error handler turns
this into a uniform JSON envelope.

### `forOrg(organizationId)`
A tenant-scoped extension of the Prisma client that injects
`organizationId` into every query. Used by every service that runs on behalf
of an authenticated user. See [10 · Multi-Tenancy](./10-multi-tenancy.md).

```ts
const db = forOrg(organizationId);
const books = await db.book.findMany({ where: { genre: 'fiction' } });
//                                          ↑ organizationId auto-added
```

### Health probes
- `GET /health` — liveness (always 200 if the process is up).
- `GET /health/ready` — readiness (runs `SELECT 1` against PostgreSQL,
  returns 503 if the DB is unreachable).

## Folder layout

```
shelfsight-backend/src/
├── index.ts                    # process entry — env validation, listen
├── app.ts                      # Express app + middleware stack
│
├── routes/
│   ├── index.ts                # mounts all sub-routers
│   ├── auth.ts        books.ts
│   ├── loans.ts       fines.ts
│   ├── map.ts         ingest.ts
│   ├── users.ts       organizations.ts
│   ├── invites.ts     transactions.ts
│   └── test.routes.ts          # dev/test only
│
├── controllers/                # one per resource
├── services/                   # one per resource (+ mapPlacementHints)
├── middleware/
│   ├── auth.middleware.ts      # requireAuth, requireRole
│   └── error-handler.ts
├── lib/
│   ├── prisma.ts               # singleton + forOrg() extension
│   ├── async-handler.ts        # wrapAsync
│   ├── errors.ts               # AppError
│   ├── email.ts                # normaliseEmail
│   ├── resend-mail.ts          # password reset email
│   ├── http-access-log.ts      # production access log
│   └── logger.ts
├── lambdas/
│   └── ingest.handler.ts       # async pipeline consumer
└── types/
    └── express.d.ts            # req.user augmentation
```
