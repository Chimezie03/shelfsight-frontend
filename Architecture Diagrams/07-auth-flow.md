# 07 · Auth Flow

ShelfSight uses **JWTs in HttpOnly cookies** plus role-based middleware
guards. There is no client-side token storage; the browser ships the cookie
with every request thanks to `credentials: 'include'`.

Source files referenced:
- `shelfsight-backend/src/services/auth.service.ts`
- `shelfsight-backend/src/controllers/auth.controller.ts`
- `shelfsight-backend/src/middleware/auth.middleware.ts`
- `shelfsight-frontend/src/lib/api.ts`, `src/components/auth-provider.tsx`

---

## JWT and cookie configuration

| Property         | Value                                                                |
|------------------|----------------------------------------------------------------------|
| Algorithm        | HS256 (default for `jsonwebtoken.sign`)                              |
| Secret           | `JWT_SECRET` env var — required at startup                            |
| Expiry           | **7 days** (`JWT_EXPIRES_IN = '7d'`)                                  |
| Cookie name      | `token`                                                               |
| `httpOnly`       | `true`                                                                |
| `secure`         | `true` in production, `false` in dev                                  |
| `sameSite`       | `'none'` in production, `'lax'` in dev                                |
| `maxAge`         | `7 * 24 * 60 * 60 * 1000` ms (matches JWT expiry)                    |
| `path`           | `'/'`                                                                 |

**Token payload (`AuthPayload`):**

```ts
{
  userId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'PATRON';
  name: string;
  organizationId: string;
  organizationName: string;
}
```

`organizationId` travelling in the token is what powers tenant scoping —
see [10 · Multi-Tenancy](./10-multi-tenancy.md).

**Password hashing:** `bcryptjs` with **salt rounds = 12** for every signup,
invite acceptance, and password reset.

---

## Login

```mermaid
sequenceDiagram
    autonumber
    actor U as User (browser)
    participant FE as Frontend<br/>(/page.tsx · AuthProvider)
    participant Proxy as Next.js rewrite<br/>(/api/* → BACKEND_URL)
    participant BE as Express<br/>(POST /auth/login)
    participant Svc as auth.service<br/>authenticateUser()
    participant DB as PostgreSQL

    U->>FE: submit email + password
    FE->>FE: AuthProvider.login(email, password)
    FE->>Proxy: fetch('/api/auth/login', credentials: 'include')
    Proxy->>BE: POST /auth/login
    BE->>BE: rate-limit (prod): 15 req / 15 min / IP
    BE->>Svc: authenticateUser(email, password)
    Svc->>DB: prisma.user.findFirst({ email })
    DB-->>Svc: user + organization { name }
    alt user not found / password mismatch
        Svc-->>BE: throw AppError(401, 'AUTHENTICATION_ERROR')
        BE-->>FE: 401 { error: 'Invalid email or password' }
    else success
        Svc->>Svc: bcrypt.compare(password, user.passwordHash)
        Svc->>Svc: signToken(payload, JWT_SECRET, '7d')
        Svc-->>BE: { token, user }
        BE->>BE: res.cookie('token', token, { httpOnly: true, sameSite, secure, maxAge: 7d })
        BE-->>FE: 200 { user }
    end
    FE->>FE: AuthProvider sets { user, isAuthenticated: true }
    FE->>U: navigate to /dashboard
```

### Logout
```
POST /auth/logout
→ res.clearCookie('token', { httpOnly: true, path: '/' })
→ 200 { message: 'Logged out successfully' }
```
Logout is **stateless on the server** — there is no token blocklist. Any
copy of the cookie that was extracted before logout will remain valid until
its 7-day expiry. (Future: add a token-version column on `User` so server
can revoke.)

### Session restoration
On mount, `AuthProvider` calls `GET /auth/me`. The `requireAuth` middleware
verifies the cookie's JWT and `req.user` is then used by the controller to
return the up-to-date user record.

---

## Signup (creates a new organization)

```mermaid
sequenceDiagram
    autonumber
    actor U as User (browser)
    participant FE as Frontend (/signup)
    participant BE as Express (POST /auth/signup)
    participant Svc as signupOrganization()
    participant DB as PostgreSQL

    U->>FE: orgName, name, email, password
    FE->>BE: POST /api/auth/signup
    BE->>Svc: signupOrganization(input)

    Svc->>Svc: validate fields, email regex, password ≥ 8 chars
    Svc->>DB: user.findFirst({ email }) — refuse if exists anywhere

    Note over Svc: cross-org email reuse is blocked at signup<br/>(login by email would otherwise be ambiguous)

    Svc->>Svc: slug = uniqueSlug(orgName)
    Svc->>Svc: passwordHash = bcrypt.hash(password, 12)

    rect rgba(196,149,106,0.15)
    Svc->>DB: $transaction
    Note right of DB: 1. organization.create({ name, slug })<br/>2. user.create({ ..., role: 'ADMIN', organizationId })
    DB-->>Svc: user (with org)
    end

    Svc-->>BE: { token, user }
    BE->>BE: res.cookie('token', token, COOKIE_OPTIONS)
    BE-->>FE: 201 { user }
    FE->>U: navigate to /dashboard
```

The first user of every org is always `ADMIN`.

---

## Invite acceptance

```mermaid
sequenceDiagram
    autonumber
    actor New as Invitee (browser)
    participant FE as Frontend (/invite/[token])
    participant BE as Express
    participant Svc as auth.service
    participant DB as PostgreSQL

    Note over New,FE: Step 1 — public preview<br/>(no auth required, used to render org name + role)

    New->>FE: GET /invite/[token]
    FE->>BE: GET /auth/invites/:token
    BE->>Svc: getInvitePreview(rawToken)
    Svc->>Svc: tokenHash = sha256(rawToken)
    Svc->>DB: invite.findUnique({ tokenHash })
    alt expired / already accepted / not found
        Svc-->>BE: throw 404 'INVITE_INVALID'
    else valid
        Svc-->>BE: { organizationName, role, email, expiresAt }
    end
    BE-->>FE: preview JSON

    Note over New,FE: Step 2 — submit name + password

    New->>FE: name + password
    FE->>BE: POST /auth/accept-invite { token, name, password }
    BE->>Svc: acceptInvite(input)
    Svc->>DB: invite.findUnique({ tokenHash })
    Svc->>Svc: validate not expired, not accepted
    Svc->>DB: user conflict check (within org)
    Svc->>Svc: bcrypt.hash(password, 12)
    rect rgba(196,149,106,0.15)
    Svc->>DB: $transaction
    Note right of DB: 1. user.create({ ..., role: invite.role, organizationId })<br/>2. invite.update({ acceptedAt: now, acceptedUserId })
    DB-->>Svc: user (with org)
    end
    Svc-->>BE: { token, user }
    BE->>BE: res.cookie('token', ...)
    BE-->>FE: 201 { user }
    FE->>New: navigate to /dashboard
```

Tokens are **stored as SHA-256 hashes** — the raw token only ever exists
client-side and in the email link. Tokens are single-use: `acceptedAt` is
set inside the same transaction that creates the user.

---

## Password reset

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend
    participant BE as Express
    participant Svc as auth.service
    participant Mail as Email Provider
    participant DB as PostgreSQL

    Note over U,FE: Phase 1 — request a reset link

    U->>FE: enter email at /forgot-password
    FE->>BE: POST /auth/forgot-password { email }
    BE->>Svc: requestPasswordReset(email)
    Svc->>Svc: validate email shape (silent on bad input)
    Svc->>DB: user.findFirst({ email })
    alt user does not exist
        Note right of Svc: still returns 200 (anti-enumeration)
    else user exists
        Svc->>DB: passwordResetToken.updateMany<br/>{ userId, usedAt: null } → usedAt = now
        Svc->>Svc: rawToken = randomBytes(32).hex()
        Svc->>Svc: tokenHash = sha256(rawToken)
        Svc->>DB: passwordResetToken.create<br/>{ userId, tokenHash, expiresAt = now + 1h }
        Svc->>Mail: sendPasswordResetEmail(to, link with rawToken)
    end
    BE-->>FE: 200 (always — generic message)

    Note over U,FE: Phase 2 — set a new password

    U->>FE: open link, submit new password at /reset-password
    FE->>BE: POST /auth/reset-password { token, password }
    BE->>Svc: resetPasswordWithToken(rawToken, newPassword)
    Svc->>Svc: validate password ≥ 8 chars
    Svc->>Svc: tokenHash = sha256(rawToken)
    Svc->>DB: passwordResetToken.findUnique({ tokenHash })
    alt expired, used, or unknown
        Svc-->>BE: throw 400 'RESET_TOKEN_INVALID'
    else ok
        Svc->>Svc: bcrypt.hash(newPassword, 12)
        rect rgba(196,149,106,0.15)
        Svc->>DB: $transaction<br/>user.update({ passwordHash })<br/>token.update({ usedAt: now })
        end
        Svc-->>BE: void
    end
    BE-->>FE: 200 { message }
```

**Anti-enumeration:** `requestPasswordReset` always returns 200 with the
same body, regardless of whether the email exists. The endpoint can't be
used to discover registered emails.

---

## Authorisation on protected endpoints

The two-stage middleware in `src/middleware/auth.middleware.ts`:

```ts
router.get('/users',
  authenticateJWT,           // = requireAuth — must have a valid JWT cookie
  requireRole('ADMIN'),      // …and the role check
  wrapAsync(getUsers),
);
```

- `requireAuth` reads `req.cookies.token`, calls `verifyToken()`, and
  attaches the parsed payload to `req.user`.
- `requireRole(...allowed)` checks `req.user.role` against the allowed list
  and throws `AppError(403, 'FORBIDDEN')` otherwise.

The full role × endpoint table lives in [11 · RBAC Matrix](./11-rbac-matrix.md).
