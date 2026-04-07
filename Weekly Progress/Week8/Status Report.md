# ShelfSight

**Week 8 | April 1, 2026 - April 7, 2026**

**Leader:** Marc Manoj
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
| **Time Spent:** 11 hours | **Planned tasks for next week:** |
| | • Catalog search fixes (KAN-58) |
| | • Search debouncing implementation (KAN-61) |
| | • Input validation across forms (KAN-59) |
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
| | • |
| **Time Spent:** hours | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • |
| **Time Spent:** hours | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • |
| **Time Spent:** hours | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |

---

**Total Time Spent:** 20+ hours (other team members to be added)

**Summary:**
Week 8 focused on fixing critical catalog and map bugs. The book update flow (KAN-55) was verified as resolved on main, the map shelf viewer (KAN-57) was fixed to correctly handle the API response envelope unwrapping, and a shelf location dropdown (KAN-56) was added to the book edit form with full backend integration for shelf assignment. All changes were validated with TypeScript compilation and production builds across both repos.
