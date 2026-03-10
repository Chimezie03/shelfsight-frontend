# ShelfSight

**Week 5 | March 3, 2026 - March 9, 2026**

**Leader:** Kaelen Raible

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • TBD |
| **Time Spent:** TBD | **Planned tasks for next week:** |
| | • TBD |
| | **Any issues or challenges:** |
| | • TBD |

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
| | • TBD |
| **Time Spent:** TBD | **Planned tasks for next week:** |
| | • TBD |
| | **Any issues or challenges:** |
| | • TBD |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • TBD |
| **Time Spent:** TBD | **Planned tasks for next week:** |
| | • TBD |
| | **Any issues or challenges:** |
| | • TBD |

---

**Total Time Spent: 11+ hours (other members TBD)**

**Summary:**
Week 5 focused on full frontend-backend integration. All four main dashboard pages (Catalog, Circulation, Members, Ingest) were connected to their real backend API endpoints, replacing mock/placeholder data. Edit dialogs were built for both books and members to wire up previously unused `PUT` endpoints. Backend merge conflicts were resolved, seed data was substantially expanded to support testing, and several bugs were fixed including a circulation duplicate-key issue and incorrect checkout payload fields.
