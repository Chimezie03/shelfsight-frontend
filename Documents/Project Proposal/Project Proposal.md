# Project Proposal – Team #10

## ShelfSight

---

## Project Overview

This project is an AI-assisted library management system designed to streamline the process of cataloging, organizing, and managing physical libraries. The system reduces manual data entry by allowing librarians to upload photos of book covers or spines, automatically extracting book metadata and suggesting Dewey Decimal classifications for review. In addition to standard library management features such as check-in/check-out and member accounts, the platform connects the digital catalog to a visual representation of the physical library.

To support organization and discoverability, the system includes a custom-built 2D library map composed of labeled shelf sections. Users can click into a section to view a first-person shelf perspective, then zoom back out to the full map. Using the catalog data and map structure, the AI provides recommendations for organizing shelves—such as grouping related categories, balancing shelf capacity, and identifying misplacements—while keeping all final decisions under librarian control.

---

## Project Scope

### Must-Have Features (Core Scope)

- User authentication and role-based access (Admin, Staff, Patron)
- Library catalog management (books, copies, metadata)
- AI-assisted book ingestion via image upload (cover/spine)
  - OCR-based text extraction
  - ISBN detection and metadata enrichment
  - Dewey Decimal classification suggestions with confidence scores
- Manual review and override of AI-generated data
- Standard circulation features:
  - Check-in / check-out
  - Due dates and overdue tracking
  - Basic fine calculation
- Search and filtering by title, author, subject, and Dewey category
- Custom-built 2D library map with labeled shelf sections
- Interactive map navigation:
  - Clickable sections
  - Zoom-in first-person shelf view
  - Zoom-out to full 2D map
- AI-generated organizational recommendations based on:
  - Dewey classification
  - Shelf capacity
  - Existing placement

### Nice-to-Have / Stretch Goals

- Drag-and-drop shelf reorganization within the map
- Duplicate and missing-volume detection
- Basic analytics dashboard (most borrowed categories, shelf utilization)
- Barcode or QR code generation for books and shelves
- Multilingual UI and metadata support
- User-defined tags and collections
- Future stretch: a "canvas" editor allowing librarians to design custom maps

---

## Project Objectives

### Primary Objectives

- Build a functional, scalable library management system with a modern web interface
- Reduce the time required to catalog new books through AI-assisted ingestion
- Visually connect the digital catalog to physical shelf locations
- Provide actionable, reviewable AI recommendations for library organization
- Ensure the system is usable, editable, and reliable in real-world library scenarios

### Measurable Goals

*Compared to Range of LMS — Follett-Destiny, Koha, Libib*

- Successfully ingest and catalog books from images with **≥90% ISBN detection accuracy** when ISBN is visible (Major LMS approach 100% ISBN scan accuracy)
- Generate Dewey Decimal classification suggestions with **≥80% librarian acceptance rate** after review
- Load core pages (catalog search, map view) in **<3 seconds** (Accepted LMS load times range from 1–3 seconds)
- Support at least **500 books and 100 concurrent users** without performance degradation
- Allow a librarian to locate a book via the map in **under 10 seconds** during testing

### Success Metrics

- Reduction in manual cataloging time by at least **60%** compared to manual entry
- Accurate linkage between book records and shelf locations in **≥95%** of cases (Typical library has 92% inventory accuracy)
- Positive usability feedback from test users (average rating **≥4.5/5**) (Majority of major LMS range from 4.3–4.8)
- All core features deployed and demonstrable in a live web environment
- System remains stable under simulated concurrent usage during final evaluation

---

## Specifications

### User Interface (UI) Design

- **Platform:** Web application
- **Key Screens:** Admin dashboard, catalog management, shelf map view, circulation (check-in/out), member portal
- **User Interactions:** Forms for book entry, buttons for uploads and circulation actions, navigation menus, clickable shelf zones

### Backend & APIs

- **Backend:** Node.js with Express (REST API)
- **Database:** PostgreSQL with Prisma ORM
- **APIs:** Internal APIs for catalog, circulation, shelf zones, reports, book metadata
- **Authentication & Privacy:** JWT-based authentication, role-based access (Admin/Staff/Member), secure file uploads, basic audit logging

### API Contract

**Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticates user; returns JWT token and role (Admin/Staff/Patron) |
| `GET` | `/users/me` | Retrieves current user profile, active loans, and fines |

**Book Catalog**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/books` | Search and filter books by title, author, genre, or ISBN |
| `POST` | `/books` | Create a new book record (Requires Staff/Admin role) |

**AI Ingestion Pipeline**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest/analyze` | Accepts image upload (spine/cover); returns AI-generated metadata (OCR text, ISBN, suggested Dewey Class) for review |

**Circulation (Loans)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/loans/checkout` | Creates a loan record for a user and book copy; updates status to `CHECKED_OUT` |
| `POST` | `/loans/checkin` | Returns a book; calculates overdue fines if applicable; updates status to `AVAILABLE` |

**Library Map**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/map/sections` | Retrieves 2D map coordinates and label data for all shelf zones |
| `GET` | `/map/shelves/:id` | Retrieves specific shelf contents (books list) for the first-person view |

### Data & AI Model

- **Model Functionality:** OCR-based text extraction from book images, ISBN detection, AI-assisted Dewey classification suggestions, video-based shelf zone detection
- **Data Sources:** User-uploaded images/videos, Open Library/Google Books APIs
- **Preprocessing:** Image normalization, video frame sampling, text cleanup, confidence scoring before data storage

### Tech Stack

**Frontend**

- Next.js (React + TypeScript)
- TailwindCSS (UI styling)
- React Query / TanStack Query (API state management)
- ShadCN/UI or Material UI (components)

**Backend**

- Node.js + Express.js (REST API)
- Prisma ORM (database models + migrations)

**Database**

- PostgreSQL (structured library data, users, loans, inventory)
- Hosted using AWS RDS (or Supabase if AWS is too heavy)

**Cloud & Hosting**

- AWS S3 (image/video storage)
- AWS Lambda (background ingestion + processing jobs)
- AWS SQS (queue for async OCR/video jobs)
- AWS CloudWatch (logging + monitoring)
- Vercel (frontend deployment)

**AI Tools**

- Claude Code
- Figma Make

---

## Hardware Requirements

### Minimum Specifications for Development

**Computer:**

- RAM: 8 GB (Required to run Next.js development server, VS Code, and browser tabs simultaneously without crashing)
- CPU: Quad-core processor (e.g., Intel i5, AMD Ryzen 5, or Apple M1). Dual-core is insufficient for Next.js compilation speeds.
- Storage: 20 GB free SSD space (Node modules and Docker images consume space rapidly)

**Peripherals:**

- Mobile Device: Any Android or iOS smartphone with a working rear camera (Required for testing the "Scan Book" feature)

---

## Software Requirements

### Essential Tools & Platforms

- **Runtime:** Node.js v20.x (LTS) or higher
- **Database Engine:** Docker Desktop (for running a local PostgreSQL container) OR a locally installed PostgreSQL v14+ server
- **Cloud CLI:** AWS CLI v2 (configured with IAM user permissions for S3/Textract)
- **Code Editor:** Visual Studio Code
- **Version Control:** Git

---

## Project Timeline

| Phase | Duration | Frontend | Backend | General | Deliverable |
|-------|----------|----------|---------|---------|-------------|
| Phase 1 | 02/10 – 02/16 | Setup Next.js project, routing, navbar/sidebar skeleton | Setup Express server + initial Prisma setup | Confirm project requirements + MVP features list | Repo initialized + base UI navigation + backend running |
| Phase 2 | 02/17 – 02/23 | Begin Figma UI/UX draft screens (login, dashboard, catalog) | Draft API contract (endpoints + request/response formats) | Benchmark measurable goals vs real LMS systems + finalize AI dev tools list + finalize GitHub repo structure + give TA access to GitHub & Jira | API Contract Draft + Benchmarking Summary + AI Tools List + Repo Structure Confirmed + Figma Draft Screens |
| Phase 3 | 02/24 – 03/02 | Start Figma wireframes for key screens | Implement authentication endpoints (JWT) | Sprint planning + task breakdown | Login flow working (basic) + Figma draft screens |
| Phase 4 | 03/03 – 03/09 | Finish Figma high-fidelity mockups | CRUD API setup for Books + Members | Finalize MVP scope list | High-fidelity Figma screens + core API skeleton |
| Phase 5 | 03/10 – 03/16 | UI components setup (tables, forms, buttons) | CRUD API setup for Loans + basic circulation logic | Confirm sprint plan for MVP build | Wireframes finalized + CRUD endpoints tested |
| Phase 6 | 03/17 – 03/23 | Build catalog UI + search/filter interface | Implement books + member logic | Connect frontend to API | Catalog page functional + sample data loaded |
| Phase 7 | 03/24 – 03/30 | Build circulation UI (checkout/checkin) | Implement loans + due date + overdue tracking | Begin demo dataset setup | Checkout/checkin working end-to-end |
| Phase 8 | 03/31 – 04/06 | Add shelf section browsing UI | Add shelf-zone DB structure | AI metadata demo integration planning | MVP flow demo-ready (catalog → circulation) |
| Phase 9 | 04/07 – 04/13 | Finalize MVP UI integration | Finalize core backend logic + bug fixes | Integrate AI metadata demo dataset | Functional Alpha (MVP) |
| Phase 10 | 04/14 – 04/20 | Begin 2D map UI + shelf zone interaction | Start OCR pipeline backend setup | Start QA checklist creation | Map UI prototype + OCR pipeline skeleton |
| Phase 11 | 04/21 – 04/27 | Upload feature UI (book cover/spine upload) | Async job processing (SQS/Lambda concept) | Testing + bug fixes | Beta Version + QA Test Report |
| Phase 12 | 04/28 – 05/04 | UI polish + finalize demo pages | Deployment setup + performance fixes | Documentation draft + slides outline | Deployment working + final UI improvements |
| Phase 13 | 05/05 – 05/08 | Final styling + presentation-ready UI | Final optimization + cleanup | Final report + GitHub handover prep | Final Demo + GitHub Handover |

---

## Team Leader Rotation

| Duration | Team Leader |
|----------|-------------|
| 2/10/26 – 2/24/26 | Mirza Zubayr Baig |
| 2/25/26 – 3/10/26 | Kaelen Raible |
| 3/11/26 – 3/24/26 | Marc Manoj |
| 3/25/26 – 4/7/26 | Chimezie Nnawuihe |
| 4/8/26 – 5/1/26 | Syed Hasan |

---

## Project Team

| Role | Team Member | Responsibilities |
|------|-------------|-----------------|
| Frontend Developer | Mirza Zubayr | UI development |
| Frontend Developer | Chimezie Nnawuihe | UI development |
| Backend Developer | Syed Hasan | API & Database |
| Backend Developer | Marc Manoj | API & Database |
| Graphics | Kaelen Raible | Mapping + Support |

---

## Links

- **GitHub Repository (Frontend):** [shelfsight-frontend](https://github.com/Chimezie03/shelfsight-frontend)
- **GitHub Repository (Backend):** [shelfsight-backend](https://github.com/Chimezie03/shelfsight-backend)
- **Agile Board (Jira):** [ShelfSight Jira Board](https://t10-shelfsight.atlassian.net/jira/software/projects/KAN/boards/1)
- **Design Document (Figma):** [UI/UX Design](https://www.figma.com/design/eSVYSDo7JNH0Rv1Rxuhbng/UI-UX-Design?node-id=0-1&t=JHY69W6ZIf5R1tLp-1)