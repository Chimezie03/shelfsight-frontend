# ShelfSight

**Week 8 | April 1, 2026 - April 7, 2026**

**Leader:** Chimezie Nnawuihe
---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • Fixed book update flow (KAN-55) — diagnosed that updateBookService and createBookService on the feature branch returned raw Prisma objects missing availableCopies, totalCopies, shelfId, and shelfLabel; verified main branch already resolved this via $transaction with include and mapBookWithCopies |
| | • Fixed map shelf viewer (KAN-57) — resolved API response type mismatch in ShelfViewer.tsx where apiFetch's normalizeSuccessPayload already unwraps { success, data } envelopes but the component was still accessing res.data (undefined), causing all saved shelves to display empty |
| | • Added shelf location dropdown (KAN-56) — replaced free-text location input in BookFormDialog with a Select dropdown populated from GET /map shelf sections; added getShelves() API helper, extended BookFormData type with optional shelfId, and wired shelfId through createBook/updateBook API calls |
| | • Extended backend updateBookService to accept shelfId parameter — when provided, assigns all AVAILABLE copies to the selected shelf within the existing transaction |
| | • Ran full TypeScript compilation and Next.js production build to verify zero regressions across both frontend and backend |
| | • Pulled latest changes from both repos and reconciled with teammate commits on main |
| **Time Spent:** 9 hours | **Planned tasks for next week:** |
| | • |
| | • |
| | • |
| | **Any issues or challenges:** |
| | • Backend feature branch was behind main with significant divergence in books.service.ts; resolved by applying targeted shelfId fix to main branch instead of rebasing |

---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • Oversaw improvements to ingestion reliability and review flow quality so batch uploads and metadata outcomes are easier for staff to trust and process |
| | • Guided database and query optimization focus for Supabase to improve stability under larger catalog and ingestion workloads |
| | • Coordinated final validation checks and release readiness across backend deployment touchpoints to keep the system stable for the team |
| **Time Spent:** 9 hours | **Planned tasks for next week:** |
| | • Continue reliability and performance monitoring after rollout and capture follow-up improvements |
| | • Support integration planning for next sprint priorities and cross-team handoff items |
| | **Any issues or challenges:** |
| | • Balancing speed of delivery with low-risk changes required additional coordination and validation to avoid regressions |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • Fixed catalog search behavior so filtering, searching, and refreshing stay in sync and show consistent results |
| | • Improved the AI Book Ingestion page with stronger loading/error/success handling for metadata lookup and review actions |
| | • Reduced redundant API calls and making request state more predictable across catalog and ingestion flows |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Improve OCR/ISBN fallback reliability |
| | **Any issues or challenges:** |
| | • Image quality affected OCR/ISBN extraction so manual metadata review was needed often |
| | • Merge conflicts after syncing introduced inconsistencies |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • Fixed shelf layout save failure — corrected hardcoded fallback node IDs ("shelf-1" etc.) to use "new-" prefix so the backend creates rather than tries to update non-existent records |
| | • Fixed book update not persisting copies or page count — added pageCount to Prisma schema + migration, updated backend service and frontend API call end-to-end |
| | • Fixed book deletion failing due to foreign key constraints — rewrote deleteBookService to cascade-delete loans, events, and copies in a transaction before removing the book |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Ensure book/shelf edits save correctly across all edge cases |
| | **Any issues or challenges:** |
| | • pageCount migration had to be created manually since db push was used on production instead of migrate deploy; resolved by running migrate dev locally and deploying the generated SQL file |
| | • Render shell access required to run migrate deploy on production database after each schema change |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • Completed Task 5 — implemented CI/CD pipelines (lint, build, test, typecheck) for frontend and backend using GitHub Actions |
| | • Added smoke tests (Vitest) to support CI validation and ensure core endpoints function correctly |
| | • Implemented baseline load testing with autocannon to measure system performance and establish initial benchmarks |
| | • Identified scalability issues (in-memory filtering, DB readiness checks) and documented recommended fixes |
| | • Implemented monitoring foundations — structured logging and readiness/liveness endpoints for system health visibility |
| | • Documented CI/CD setup, load testing process, and monitoring configuration |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Support CI/CD and monitoring as additional features are integrated |
| | **Any issues or challenges:** |
| | • GitHub push initially blocked due to PAT permissions and repo access |
| | • Local readiness check required Postgres (Docker not running during verification) |
---

**Total Time Spent:** 54 hours

**Summary:**
Week 8 focused on fixing critical catalog and map bugs. The book update flow (KAN-55) was verified as resolved on main, the map shelf viewer (KAN-57) was fixed to correctly handle the API response envelope unwrapping, and a shelf location dropdown (KAN-56) was added to the book edit form with full backend integration for shelf assignment. The shelf layout save failure was resolved by correcting hardcoded fallback node IDs to use the "new-" prefix convention the backend expects. Book deletion was fixed by adding cascading cleanup of dependent records in a transaction. The pageCount field was added to the Book model end-to-end (schema, migration, backend service, frontend API and transform). All changes were validated with TypeScript compilation and production builds across both repos.
