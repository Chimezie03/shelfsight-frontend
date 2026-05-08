# 08 · AI Ingestion Pipeline

The most complex flow in the system: a staff member uploads a photo of a
book cover/spine, and the system OCRs it, finds an ISBN, enriches metadata
from public APIs, classifies the book on the Dewey Decimal scale, and
presents the result for human review.

The pipeline is **dual-mode**:
1. **Synchronous** — runs inside the Express request and returns suggestions immediately so the UI can show them.
2. **Asynchronous** — the same image is also uploaded to Object Storage and a job is queued so a Lambda can re-run the pipeline (or a longer/more expensive variant) and update the `IngestionJob` record.

Source: `shelfsight-backend/src/services/ingest.service.ts`,
`shelfsight-backend/src/controllers/ingest.controller.ts`,
`shelfsight-backend/src/lambdas/ingest.handler.ts`.

---

## High-level flow

```mermaid
flowchart TB
    Upload["📤 Staff uploads image<br/>POST /ingest/analyze<br/>(multer.single 'image', 10 MB cap)"]

    subgraph Sync["Synchronous path (Express)"]
        direction TB
        OCR["AWS Textract<br/>DetectDocumentTextCommand<br/>→ concatenate LINE blocks"]
        ISBN["Detect ISBN<br/>regex + ISBN-13 checksum"]
        Enrich{"Enrich metadata"}
        OL["Open Library<br/>/api/books?bibkeys=ISBN:X"]
        GB["Google Books<br/>/volumes?q=isbn:X"]
        LLM1["OpenAI<br/>Dewey classification<br/>+ confidence + reasoning"]
        LLM2["OpenAI<br/>extract title/author/<br/>language/subject from OCR"]
    end

    subgraph Async["Asynchronous path"]
        direction TB
        S3["Object Storage<br/>PutObjectCommand<br/>key = ingest/{ts}-{name}"]
        SQS["Job Queue<br/>SendMessageCommand<br/>{ action: INGEST_ANALYZE,<br/>s3Url, organizationId, … }"]
        Lambda["Lambda handler<br/>lambdas/ingest.handler.ts"]
    end

    Job[("IngestionJob row")]
    Review["👁 Reviewer (Admin/Staff)<br/>JobReviewDialog"]
    Approve["POST /ingest/jobs/:id/approve"]
    Reject["POST /ingest/jobs/:id/reject"]
    NewBook[("Book + BookCopy created")]

    Upload --> OCR
    OCR --> ISBN
    ISBN -->|found| Enrich
    Enrich --> OL
    OL -- "miss" --> GB
    Enrich --> LLM1
    ISBN -->|not found| LLM2
    LLM2 --> LLM1

    Upload --> S3
    S3 --> SQS
    SQS -. trigger .-> Lambda
    Lambda --> OCR
    Lambda --> Enrich
    Lambda --> LLM1

    LLM1 --> Job
    Lambda --> Job

    Job --> Review
    Review --> Approve
    Review --> Reject
    Approve --> NewBook
    Reject --> Job

    classDef sync fill:#F8F7F4,stroke:#1B2A4A,color:#1B2A4A
    classDef async fill:#C4956A,stroke:#7d5a3a,color:#fff
    classDef store fill:#fff,stroke:#1B2A4A,stroke-dasharray: 4 2
    class OCR,ISBN,Enrich,OL,GB,LLM1,LLM2 sync
    class S3,SQS,Lambda async
    class Job,NewBook store
```

---

## Synchronous sequence

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    participant FE as Frontend (/ingest)
    participant BE as Express<br/>(POST /ingest/analyze)
    participant Svc as ingest.service
    participant T as OCR Service
    participant ISBN as ISBN APIs<br/>(Open Library → Google Books)
    participant LLM as LLM Provider
    participant OS as Object Storage
    participant Q as Job Queue
    participant DB as PostgreSQL

    Staff->>FE: select image, click "Analyze"
    FE->>BE: multipart upload (image)
    BE->>BE: requireAuth + requireRole('ADMIN','STAFF')
    BE->>Svc: analyzeBookImage(buffer, mime, orgId)

    par OCR
        Svc->>T: DetectDocumentText(bytes)
        T-->>Svc: blocks → ocrText
    and Object Storage upload
        Svc->>OS: PutObjectCommand(ingest/{ts}-{name})
        OS-->>Svc: s3Url
        Svc->>Q: SendMessageCommand(action: INGEST_ANALYZE)
        Note right of Q: fire-and-forget;<br/>swallow errors
    end

    Svc->>Svc: detectIsbn(ocrText)<br/>regex + ISBN-13 checksum

    alt ISBN found
        Svc->>ISBN: Open Library lookup
        alt Open Library hit
            ISBN-->>Svc: { title, author, publisher, cover, subjects }
        else miss
            Svc->>ISBN: Google Books fallback
            ISBN-->>Svc: { … }
        end
        Svc->>LLM: classifyDewey(metadata + ocrText)
        LLM-->>Svc: { suggestedDewey, confidence, reasoning }
    else ISBN not found
        Svc->>LLM: extract title/author/language/subject from OCR
        LLM-->>Svc: { suggestedTitle, … }
        Svc->>LLM: classifyDewey(extracted)
        LLM-->>Svc: { suggestedDewey, confidence, reasoning }
    end

    Svc->>DB: ingestionJob.create({ status: COMPLETED, suggestions, ocrText, imageUrl })
    DB-->>Svc: jobId
    Svc-->>BE: { jobId, suggestions }
    BE-->>FE: 200 { jobId, suggestions }

    FE->>Staff: render JobReviewDialog with editable fields
```

### Graceful degradation

The pipeline is built to keep going when an external service is missing or
fails. Each step has a clearly defined fallback:

| Missing / failed              | Behaviour                                                                                  |
|-------------------------------|--------------------------------------------------------------------------------------------|
| `S3_BUCKET_NAME` not set      | Returns a stubbed `https://stub-bucket.s3…/…` URL so the rest of the pipeline still runs.   |
| `SQS_QUEUE_URL` not set       | Skipped silently — async pipeline does not run, sync path returns suggestions anyway.      |
| AWS credentials missing       | Textract returns `''` (empty OCR). ISBN detection short-circuits to the LLM extraction path. |
| `OPENAI_API_KEY` not set      | Dewey classification is skipped. Job is still created with whatever metadata was found.    |
| Open Library miss             | Falls back to Google Books.                                                                |
| Google Books miss             | Returns minimal metadata (just the OCR text and any detected ISBN).                        |

This means the `/ingest` page is **demo-able with zero cloud credentials** —
it just won't have suggestions to render.

---

## Async (Lambda) path

When Object Storage and the Job Queue are configured, the same upload also
triggers an out-of-band run by `lambdas/ingest.handler.ts`. The Lambda
re-runs the pipeline (typically with longer timeouts or a more expensive
model) and updates the same `IngestionJob` row by id.

The Lambda uses the same code paths from `ingest.service` — there's only
one implementation of OCR, ISBN detection, metadata enrichment, and Dewey
classification, just two entry points.

---

## State machine of an `IngestionJob`

```mermaid
stateDiagram-v2
    [*] --> PENDING: row inserted
    PENDING --> PROCESSING: pipeline starts (sync or Lambda)
    PROCESSING --> COMPLETED: pipeline finished, suggestions ready
    PROCESSING --> FAILED: unrecoverable error (logged in row)
    COMPLETED --> APPROVED: POST /ingest/jobs/:id/approve\nBook + BookCopy created
    COMPLETED --> REJECTED: POST /ingest/jobs/:id/reject
    FAILED --> [*]
    APPROVED --> [*]
    REJECTED --> [*]
```

---

## Approve / reject

```mermaid
sequenceDiagram
    autonumber
    actor Reviewer
    participant FE as Frontend (JobReviewDialog)
    participant BE as Express
    participant Svc as ingest.service
    participant DB as PostgreSQL

    Reviewer->>FE: edit suggestions, click "Approve"
    FE->>BE: POST /ingest/jobs/:id/approve { editedFields, copyCount, shelfId? }
    BE->>BE: requireRole('ADMIN','STAFF')
    BE->>Svc: approveIngestionJob(jobId, body)
    Svc->>DB: ingestionJob.findFirst (org-scoped)

    rect rgba(196,149,106,0.15)
    Svc->>DB: $transaction
    Note right of DB: 1. book.create({ title, author, isbn, dewey, … })<br/>2. bookCopy.createMany({ count })<br/>3. ingestionJob.update({ status: APPROVED, createdBookId, reviewedBy, reviewedAt })
    end
    DB-->>Svc: book, copies
    Svc-->>BE: { book, copies }
    BE-->>FE: 200

    Note over Reviewer,BE: Reject is similar: ingestionJob.update<br/>{ status: REJECTED, reviewedBy, reviewedAt }
```

---

## Other ingest endpoints

| Method | Path                      | Purpose                                                                  |
|--------|---------------------------|--------------------------------------------------------------------------|
| `GET`  | `/ingest/lookup`          | Look up a book by ISBN — Open Library → Google Books, no image involved. |
| `POST` | `/ingest/analyze/batch`   | Same pipeline, accepts up to 20 images per request (multer.fields).      |
| `GET`  | `/ingest/jobs`            | Paginated list of past jobs.                                             |
| `GET`  | `/ingest/jobs/:id`        | Get a specific job's full state.                                         |
| `POST` | `/ingest/jobs/:id/approve`| Approve and create the Book/BookCopy rows.                               |
| `POST` | `/ingest/jobs/:id/reject` | Reject without creating any new rows.                                    |

All `/ingest/*` endpoints require `requireAuth + requireRole('ADMIN','STAFF')`.
