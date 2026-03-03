# ShelfSight

**Week 4 | February 24, 2026 - March 2, 2026**

**Leader:** Kaelen Raible

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • Rebuilt the interactive library map page using React Flow with drag-and-drop shelf placement |
| | • Designed and implemented custom shelf nodes with compact UI, color coding, and capacity indicators |
| | • Added shelf settings panel with editable fields (name, category, Dewey range, tiers, rotation, etc.) |
| | • Built shelf viewer modal showing book spines per tier with hover tooltips and status indicators |
| | • Added 360-degree node rotation with slider and preset buttons |
| | • Implemented undo/redo history, node resizing, snap-to-grid, and canvas export |
| **Time Spent:** 16 hours | **Planned tasks for next week:** |
| | • Continue iterating on the map feature based on feedback |
| | • Work on improving other frontend pages |
| | **Any issues or challenges:** |
| | • React Flow has no native rotation support — solved with CSS transforms on the node component |

---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • Implemented full frontend authentication flow (login page with validation, error handling, loading states) |
| | • Created `AuthProvider` context and `useAuth()` hook for global auth state management |
| | • Built API service layer (`api.ts`, `auth.ts`) with typed error handling and `credentials: 'include'` |
| | • Added route protection to dashboard layout — unauthenticated users redirected to login |
| | • Updated sidebar to display logged-in user's name and role |
| | • Implemented backend auth system (auth service, controller, routes, JWT middleware) |
| | • Set up bcrypt password hashing, HttpOnly cookie-based JWT storage |
| | • Created `requireAuth` and `requireRole` RBAC middleware |
| | • Updated seed data with properly hashed passwords |
| | • Ensured all credentials/API keys loaded from env vars — no hardcoded secrets |
| | • Created `.env.example` for frontend, updated backend `.env.example` with `JWT_SECRET` |
| | • Updated `CLAUDE.md` documentation to reflect new auth flow and file structure |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Connect catalog page to real `/books` API |
| | • Begin circulation UI integration |
| | **Any issues or challenges:** |
| | • React 19 changed Context.Provider JSX usage — required adjusting the AuthProvider pattern |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • *(Fill in)* |
| **Time Spent:** __ hours | **Planned tasks for next week:** |
| | • *(Fill in)* |
| | **Any issues or challenges:** |
| | • *(Fill in)* |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • Implemented backend authentication points |
| | • Setup user roles(Admin, Staff, Patron) and basic user model in db |
| | • Completed basic book API(createBook, updateBook, deleteBook) and user API(getUsers, createUser, updateUser, deleteUser) |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Begin circulation logic |
| | • Loan API setup|
| | **Any issues or challenges:** |
| | • Initial seeding needed to be re-written for auth testing |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • *(Fill in)* |
| **Time Spent:** __ hours | **Planned tasks for next week:** |
| | • *(Fill in)* |
| | **Any issues or challenges:** |
| | • *(Fill in)* |

---

**Total Time Spent: __ hours**

**Summary:**
*(Update once all members have filled in their sections.)*

---

## Test Login Credentials

The following seeded accounts are available for testing. Each role sees a different dashboard and has different navigation access.

| Role | Email | Password | Dashboard Features |
|------|-------|----------|--------------------|
| **Admin** | `admin@shelfsight.com` | `password123` | Full system stats, AI recommendations, quick links to all features (Ingest, Map, Members, Reports). Sees all sidebar items. |
| **Staff** | `staff@shelfsight.com` | `password123` | Daily task checklist, circulation activity, shift-relevant stats. Sidebar includes Circulation and AI Ingest but not Members or Reports. |
| **Patron** | `patron@shelfsight.com` | `password123` | Current loans with due dates, personalized book recommendations, reading stats. Sidebar limited to Dashboard, Catalog, and Library Map. |

> **Note:** The backend must be running (`npm run dev` in `shelfsight-backend/`) and the database must be seeded (`npm run db:seed`) for these credentials to work. The backend runs on port 3001 and uses HttpOnly JWT cookies for authentication.
