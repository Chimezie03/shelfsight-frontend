# ShelfSight

**Week 5 | March 3, 2026 - March 9, 2026**

**Leader:** Kaelen Raible

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • Built full-featured catalog page with modular components: CRUD operations, search/filter toolbar, table and grid views, pagination, book detail sheet, and delete confirmation dialog |
| | • Built full-featured circulation page with modular components: check-out tab, check-in tab with confirmation dialog, active loans table with loan detail sheet, fines tab, transaction history, renew dialog, and overdue alert banner |
| | • Built full-featured reports page with 5 analytics tabs (Overview, Collection, Circulation, Members, Financial), date range filtering, peak hours heatmap, and CSV export |
| | • Refactored dashboard into modular role-based views (Admin, Staff, Patron) with KPI cards, circulation charts, collection health stats, AI insights panel, activity feed, and reading analytics |
| | • Created custom hooks for each page (`useCatalogState`, `useCirculationState`, `useReportsState`, `useDashboardState`) to separate business logic from UI |
| | • Defined shared TypeScript types for books and circulation models |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Integrate dashboard components with real backend API endpoints (replace mock data) |
| | • Add loading skeletons and empty states across all pages |
| | **Any issues or challenges:** |
| | • Large page components needed significant refactoring into modular sub-components (~12,000 lines of new code across 60+ files) |

---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • Connected all frontend pages (Catalog, Circulation, Members, Ingest) to real backend API endpoints |
| | • Wired Catalog page to `/books` endpoint with search, genre filter, Add Book dialog, Edit Book dialog, and Delete |
| | • Wired Circulation page to `/loans`, `/loans/checkout`, and `/loans/checkin` with overdue tracking and fine display |
| | • Wired Members page to `/users` endpoint with Add Member, Edit Member, View Member, and Delete functionality |
| | • Wired Ingest page to `/ingest/analyze` with FormData image upload and graceful error handling for missing AI credentials |
| | • Implemented Edit Book dialog (`PUT /books/:id`) and Edit Member dialog (`PUT /users/:id`) for previously unwired endpoints |
| | • Fixed circulation duplicate-key bug caused by overlapping active/overdue loan queries |
| | • Expanded seed data (16 books across Dewey ranges, 5 users, 32 copies, 5 active loans, 4 shelf sections) |
| | • Resolved backend merge conflicts across 7+ files (routes, controllers, services, seed, middleware) |
| | • Fixed checkout flow to correctly pass `bookCopyId` and `userId` for admin/staff-on-behalf-of checkout |
| **Time Spent:** 11 hours | **Planned tasks for next week:** |
| | • Polish remaining UI edge cases and error states |
| | • Add loading/empty states across all pages |
| | **Any issues or challenges:** |
| | • Backend merge conflicts required careful resolution to preserve cookie-based auth while integrating new upsert patterns |
| | • `status=active` loan query already included overdue loans, causing duplicate React keys when combined with separate overdue query |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • TBD |
| **Time Spent:** TBD | **Planned tasks for next week:** |
| | • TBD |
| | **Any issues or challenges:** |
| | • TBD |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • Built out `/loans/checkout` endpoint with validation for book copy availability, duplicate active loan checks, and due date assignment |
| | • Built out `/loans/checkin` endpoint with loan lookup, return date recording, and automatic fine calculation for overdue returns |
| | • Implemented loan listing endpoint (`GET /loans`) with query support for filtering by status (active, returned, overdue), userId, and pagination |
| | • Completed core circulation API skeleton — the next critical API surface for the MVP flow |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Test all CRUD endpoints (Books, Members, Loans)|
| | • Add basic circulation logic refinements (due date rules, overdue status checks, fine calculation edge cases) |
| | • Begin connecting frontend to backend API |
| | **Any issues or challenges:** |
| | • Ensuring checkout correctly validates copy availability vs. book-level availability required careful query design |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • Implemented backend ISBN lookup endpoint `GET /ingest/lookup?isbn=` that retrieves book metadata from the Open Library API |
| | • Built service logic to fetch and normalize metadata including title, author, publisher, publish date, cover image, and subjects |
| | • Wired the Ingest page frontend to call the new ISBN lookup endpoint instead of using mocked data |
| | • Added real ISBN input field and lookup button to the AI Ingest page |
| | • Implemented metadata review flow allowing users to verify and edit book information before saving |
| | • Integrated the lookup result with the existing `POST /books` endpoint so books can be added directly to the catalog |
| | • Verified full end-to-end ingest flow: ISBN lookup → metadata preview → manual edits → save to catalog |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Improve error handling for invalid ISBN lookups |
| | • Add loading states and UI feedback during metadata fetch |
| | **Any issues or challenges:** |
| | • Environment configuration issues with PostgreSQL and Docker during local setup |
| | • Port conflicts and environment variable expansion issues in `.env` required debugging before the ingest flow could be tested end-to-end |

---

**Total Time Spent: 23+ hours (other members TBD)**

**Summary:**
Week 5 focused on full frontend-backend integration. All four main dashboard pages (Catalog, Circulation, Members, Ingest) were connected to their real backend API endpoints, replacing mock/placeholder data. Edit dialogs were built for both books and members to wire up previously unused `PUT` endpoints. Backend merge conflicts were resolved, seed data was substantially expanded to support testing, and several bugs were fixed including a circulation duplicate-key issue and incorrect checkout payload fields.
