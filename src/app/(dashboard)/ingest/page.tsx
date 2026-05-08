"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  ImageUp,
  Loader2,
  Search,
  Sparkles,
  Upload,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch, apiUpload } from "@/lib/api";
import JobReviewDialog from "@/components/ingest/JobReviewDialog";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

interface LookupMetadata {
  isbn: string | null;
  title: string | null;
  author: string | null;
  publisher: string | null;
  publishDate: string | null;
  coverImageUrl: string | null;
  subjects: string[];
  source: string | null;
}

interface LookupResult {
  isbn: string;
  found: boolean;
  metadata: LookupMetadata | null;
}

interface IngestionJob {
  id: string;
  imageUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "APPROVED" | "REJECTED";
  ocrText: string | null;
  detectedIsbn: string | null;
  suggestedDewey: string | null;
  confidenceScore: number | null;
  suggestedTitle: string | null;
  suggestedAuthor: string | null;
  suggestedPublisher: string | null;
  suggestedPublishDate: string | null;
  suggestedGenre: string | null;
  coverImageUrl: string | null;
  metadataSource: string | null;
  deweyReasoning: string | null;
  language: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdBookId: string | null;
  createdAt: string;
}

interface JobsResponse {
  data: IngestionJob[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

type ReviewState = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  genre: string;
  dewey: string;
  coverImageUrl: string;
  source: string;
  found: boolean;
  subjects: string[];
  deweyConfidence: number | null;
  deweyReasoning: string | null;
  language: string | null;
  copies: number;
};

const emptyReviewState: ReviewState = {
  isbn: "",
  title: "",
  author: "",
  publisher: "",
  publishDate: "",
  genre: "",
  dewey: "",
  coverImageUrl: "",
  source: "",
  found: false,
  subjects: [],
  deweyConfidence: null,
  deweyReasoning: null,
  language: null,
  copies: 1,
};

type StatusFilter = "ALL" | "COMPLETED" | "APPROVED" | "REJECTED";

const STATUS_BADGE_MAP: Record<
  IngestionJob["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
  },
  PROCESSING: {
    label: "Processing",
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  },
  FAILED: {
    label: "Failed",
    className: "border-red-500/20 bg-red-500/10 text-red-600",
  },
  APPROVED: {
    label: "Approved",
    className: "border-brand-sage/20 bg-brand-sage/10 text-brand-sage",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-500/20 bg-red-500/10 text-red-600",
  },
};

function confidenceBadgeClass(score: number | null): string {
  if (score === null) return "border-muted bg-muted/50 text-muted-foreground";
  if (score > 75) return "border-brand-sage/20 bg-brand-sage/10 text-brand-sage";
  if (score >= 50) return "border-brand-amber/20 bg-brand-amber/10 text-brand-amber";
  return "border-red-500/20 bg-red-500/10 text-red-600";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseLookupMetadata(value: unknown): LookupMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    isbn: asString(value.isbn),
    title: asString(value.title),
    author: asString(value.author),
    publisher: asString(value.publisher),
    publishDate: asString(value.publishDate),
    coverImageUrl: asString(value.coverImageUrl),
    subjects: asStringArray(value.subjects),
    source: asString(value.source),
  };
}

function parseLookupResult(value: unknown, fallbackIsbn: string): LookupResult {
  const root = isRecord(value) ? value : {};
  const payload = isRecord(root.data) ? root.data : root;
  const metadata = parseLookupMetadata(payload.metadata);
  const isbn = asString(payload.isbn) ?? fallbackIsbn;

  const hasMetadata =
    metadata !== null &&
    Boolean(
      metadata.title ||
        metadata.author ||
        metadata.isbn ||
        metadata.publisher ||
        metadata.subjects.length > 0
    );

  return {
    isbn,
    found: typeof payload.found === "boolean" ? payload.found : hasMetadata,
    metadata,
  };
}

function parseAnalyzeResult(value: unknown): {
  detectedIsbn: string;
  metadata: LookupMetadata | null;
  dewey: string;
  confidence: number | null;
  reasoning: string | null;
  language: string | null;
} {
  const root = isRecord(value) ? value : {};
  const payload = isRecord(root.data) ? root.data : root;
  const isbnBlock = isRecord(payload.isbn) ? payload.isbn : {};
  const classification = isRecord(payload.classification) ? payload.classification : {};

  return {
    detectedIsbn: asString(isbnBlock.detected) ?? "",
    metadata: parseLookupMetadata(isbnBlock.metadata),
    dewey: asString(classification.dewey_class) ?? "",
    confidence: asNumber(classification.confidence_score),
    reasoning: asString(classification.reasoning),
    language: asString(payload.language),
  };
}

function parseIngestionJob(value: unknown): IngestionJob | null {
  if (!isRecord(value)) {
    return null;
  }

  const status =
    typeof value.status === "string" &&
    ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "APPROVED", "REJECTED"].includes(
      value.status
    )
      ? (value.status as IngestionJob["status"])
      : "PENDING";

  const id = asString(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    imageUrl: asString(value.imageUrl) ?? "",
    status,
    ocrText: asString(value.ocrText),
    detectedIsbn: asString(value.detectedIsbn),
    suggestedDewey: asString(value.suggestedDewey),
    confidenceScore: asNumber(value.confidenceScore),
    suggestedTitle: asString(value.suggestedTitle),
    suggestedAuthor: asString(value.suggestedAuthor),
    suggestedPublisher: asString(value.suggestedPublisher),
    suggestedPublishDate: asString(value.suggestedPublishDate),
    suggestedGenre: asString(value.suggestedGenre),
    coverImageUrl: asString(value.coverImageUrl),
    metadataSource: asString(value.metadataSource),
    deweyReasoning: asString(value.deweyReasoning),
    language: asString(value.language),
    reviewedBy: asString(value.reviewedBy),
    reviewedAt: asString(value.reviewedAt),
    createdBookId: asString(value.createdBookId),
    createdAt: asString(value.createdAt) ?? new Date().toISOString(),
  };
}

function parseJobsResult(
  value: unknown,
  requestedPage: number,
  fallbackLimit: number
): JobsResponse {
  const root = isRecord(value) ? value : {};
  const payload = isRecord(root.data) ? root.data : root;
  const jobsListRaw = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.jobs)
      ? payload.jobs
      : Array.isArray(root.data)
        ? root.data
        : Array.isArray(root.jobs)
          ? root.jobs
          : Array.isArray(value)
            ? value
            : [];

  const jobs = jobsListRaw
    .map((item) => parseIngestionJob(item))
    .filter((job): job is IngestionJob => job !== null);

  const metaSource =
    (isRecord(payload.meta) && payload.meta) ||
    (isRecord(payload.pagination) && payload.pagination) ||
    (isRecord(root.meta) && root.meta) ||
    (isRecord(root.pagination) && root.pagination) ||
    {};

  const page = Math.max(1, Math.trunc(asNumber(metaSource.page) ?? requestedPage));
  const limit = Math.max(1, Math.trunc(asNumber(metaSource.limit) ?? fallbackLimit));
  const total = Math.max(0, Math.trunc(asNumber(metaSource.total) ?? jobs.length));
  const totalPages = Math.max(
    1,
    Math.trunc(asNumber(metaSource.totalPages) ?? Math.ceil(total / limit))
  );

  return {
    data: jobs,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function BookIngestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  /* ----- Analyze tab state ----- */
  const [isbnInput, setIsbnInput] = useState("");
  const [reviewData, setReviewData] = useState<ReviewState | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ----- Review Queue tab state ----- */
  const [activeTab, setActiveTab] = useState("analyze");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsMeta, setJobsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const jobsAbortRef = useRef<AbortController | null>(null);
  const jobsRequestIdRef = useRef(0);

  // Review dialog state
  const [reviewJob, setReviewJob] = useState<IngestionJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ----- Helpers ----- */

  const updateField =
    (field: keyof ReviewState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setReviewData((current) => (current ? { ...current, [field]: value } : current));
    };

  const resetReview = () => {
    setIsbnInput("");
    setReviewData(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  /* ----- ISBN Lookup ----- */

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedIsbn = isbnInput.trim();
    if (!trimmedIsbn) {
      toast.error("Enter an ISBN to look up book metadata.");
      return;
    }

    setIsLookingUp(true);

    try {
      const response = await apiFetch<unknown>(
        `/ingest/lookup?${new URLSearchParams({ isbn: trimmedIsbn }).toString()}`
      );
      const result = parseLookupResult(response, trimmedIsbn);
      const metadata = result.metadata;
      const metadataSubjects = metadata?.subjects ?? [];

      setReviewData({
        isbn: result.isbn,
        title: metadata?.title ?? "",
        author: metadata?.author ?? "",
        publisher: metadata?.publisher ?? "",
        publishDate: metadata?.publishDate ?? "",
        genre: metadataSubjects[0] ?? "",
        dewey: "",
        coverImageUrl: metadata?.coverImageUrl ?? "",
        source: metadata?.source ?? "",
        found: result.found,
        subjects: metadataSubjects,
        deweyConfidence: null,
        deweyReasoning: null,
        language: null,
        copies: 1,
      });

      if (result.found) {
        toast.success("Metadata loaded. Review the fields before saving.");
      } else {
        toast.warning("No metadata was found for that ISBN. You can fill in the fields manually.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ISBN lookup failed";
      toast.error(message);
      setReviewData({
        ...emptyReviewState,
        isbn: trimmedIsbn,
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  /* ----- Image Upload & Analysis ----- */

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDropzoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp|tiff)$/)) {
      toast.error("Please upload a JPEG, PNG, WebP, or TIFF image.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Select an image first.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await apiUpload<unknown>("/ingest/analyze", formData);
      const parsed = parseAnalyzeResult(response);
      const metadataSubjects = parsed.metadata?.subjects ?? [];
      const hasExtractedMetadata = Boolean(
        parsed.metadata &&
          (parsed.metadata.title ||
            parsed.metadata.author ||
            parsed.metadata.isbn ||
            parsed.metadata.publisher ||
            metadataSubjects.length > 0)
      );

      setReviewData({
        // Prefer the ISBN from the search/LLM-resolved metadata; fall back to
        // the OCR-detected ISBN only when nothing else was resolved.
        isbn: parsed.metadata?.isbn || parsed.detectedIsbn || "",
        title: parsed.metadata?.title ?? "",
        author: parsed.metadata?.author ?? "",
        publisher: parsed.metadata?.publisher ?? "",
        publishDate: parsed.metadata?.publishDate ?? "",
        genre: metadataSubjects[0] ?? "",
        dewey: parsed.dewey,
        coverImageUrl: parsed.metadata?.coverImageUrl ?? "",
        source: parsed.metadata?.source ?? "OCR+LLM",
        found: hasExtractedMetadata,
        subjects: metadataSubjects,
        deweyConfidence: parsed.confidence,
        deweyReasoning: parsed.reasoning,
        language: parsed.language,
        copies: 1,
      });

      if (hasExtractedMetadata) {
        toast.success("Image analyzed successfully. Review the extracted metadata.");
      } else {
        toast.warning(
          "Image analyzed, but metadata is incomplete. Fill in required fields manually."
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image analysis failed";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ----- Save Book ----- */

  const handleSave = async () => {
    if (!reviewData) return;

    if (!reviewData.isbn || !reviewData.title || !reviewData.author) {
      toast.error("ISBN, title, and author are required before adding a book.");
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch("/books", {
        method: "POST",
        body: {
          title: reviewData.title,
          author: reviewData.author,
          isbn: reviewData.isbn,
          genre: reviewData.genre || undefined,
          deweyDecimal: reviewData.dewey || undefined,
          language: reviewData.language || undefined,
          coverImageUrl: reviewData.coverImageUrl || undefined,
          publishDate: reviewData.publishDate || undefined,
          copies: reviewData.copies,
        },
      });

      toast.success("Book added to catalog successfully.");
      resetReview();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add book to catalog";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ----- Review Queue ----- */

  const fetchJobs = useCallback(
    async (requestedPage: number) => {
      const requestId = ++jobsRequestIdRef.current;

      jobsAbortRef.current?.abort();
      const controller = new AbortController();
      jobsAbortRef.current = controller;

      setIsLoadingJobs(true);
      setJobsError(null);

      try {
        const params = new URLSearchParams({
          page: String(requestedPage),
          limit: String(jobsMeta.limit),
        });
        if (statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }

        const response = await apiFetch<unknown>(
          `/ingest/jobs?${params.toString()}`,
          { signal: controller.signal }
        );
        const result = parseJobsResult(response, requestedPage, jobsMeta.limit);

        if (requestId !== jobsRequestIdRef.current) {
          return;
        }

        const resolvedTotalPages = result.meta.totalPages;
        if (result.meta.total > 0 && requestedPage > resolvedTotalPages) {
          setJobsPage(resolvedTotalPages);
          return;
        }
        if (result.meta.total === 0 && requestedPage !== 1) {
          setJobsPage(1);
          return;
        }

        setJobs(result.data);
        setJobsPage(result.meta.page);
        setJobsMeta(result.meta);
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        if (requestId !== jobsRequestIdRef.current) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Failed to load jobs";
        setJobsError(message);
      } finally {
        if (requestId === jobsRequestIdRef.current) {
          setIsLoadingJobs(false);
        }
      }
    },
    [jobsMeta.limit, statusFilter]
  );

  useEffect(() => {
    if (activeTab !== "queue") {
      return;
    }

    void fetchJobs(jobsPage);
  }, [activeTab, fetchJobs, jobsPage]);

  useEffect(() => {
    return () => {
      jobsAbortRef.current?.abort();
    };
  }, []);

  const totalPages = jobsMeta.totalPages;

  const openReviewDialog = (job: IngestionJob) => {
    setReviewJob(job);
    setDialogOpen(true);
  };

  const handleStatusFilterChange = (next: StatusFilter) => {
    setStatusFilter(next);
    setJobsPage(1);
  };

  const handleJobsRetry = () => {
    void fetchJobs(jobsPage);
  };

  const handleActionComplete = async () => {
    await fetchJobs(jobsPage);
  };

  if (user && !canAccess) {
    return null;
  }

  /* ----- Render ----- */

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-foreground">
          AI-Assisted Book Ingestion
        </h1>
        <p className="text-sm text-muted-foreground">
          Analyze book images, look up ISBNs, review metadata, and manage the ingestion queue.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analyze" className="text-xs">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Review Queue
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/*  TAB 1: ANALYZE                                                  */}
        {/* ================================================================ */}

        <TabsContent value="analyze">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ---------- Left Column ---------- */}
            <div className="space-y-6">
              {/* ISBN Lookup Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display">ISBN Lookup</CardTitle>
                  <CardDescription className="text-xs">
                    Search Open Library and fallback sources using a 10-digit or 13-digit ISBN.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="space-y-4" onSubmit={handleLookup}>
                    <div>
                      <Label htmlFor="isbn-lookup" className="text-[11px] text-muted-foreground">
                        ISBN
                      </Label>
                      <Input
                        id="isbn-lookup"
                        value={isbnInput}
                        onChange={(event) => setIsbnInput(event.target.value)}
                        placeholder="9780141439518"
                        className="mt-1"
                      />
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Example: <span className="font-mono">9780141439518</span> or{" "}
                        <span className="font-mono">0-14-143951-3</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLookingUp}
                      className="w-full bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
                    >
                      {isLookingUp ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-3.5 w-3.5" />
                      )}
                      Look Up ISBN
                    </Button>
                  </form>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium">Have a list of ISBNs?</p>
                      <p className="text-[11px] text-muted-foreground">
                        Bulk-import from a .txt or CSV file in the catalog.
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 text-[11px]"
                    >
                      <Link href="/catalog?bulk=isbn">
                        <UploadCloud className="h-3.5 w-3.5" />
                        Bulk ISBN upload
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <ImageUp className="h-4 w-4 text-brand-copper" />
                    Image Upload
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload a photo of a book cover or spine for AI analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/tiff"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropzoneDrop}
                    className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 p-6 text-center transition-colors hover:border-brand-navy/40 hover:bg-secondary/40"
                  >
                    {imagePreview ? (
                      <div className="space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Selected file preview"
                          className="mx-auto h-32 rounded-lg object-contain"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {selectedFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                        <p className="text-[13px] font-medium">
                          Drop an image here or click to browse
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          JPEG, PNG, WebP, or TIFF
                        </p>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                    )}
                    Analyze Image
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ---------- Right Column: Metadata Review ---------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Sparkles className="h-4 w-4 text-brand-copper" />
                  Metadata Review
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirm or edit the fields below before committing the record to the catalog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!reviewData && !isLookingUp && !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      Look up an ISBN or analyze an image to load metadata for review.
                    </p>
                  </div>
                )}

                {(isLookingUp || isAnalyzing) && !reviewData && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-copper" />
                    <p className="text-[13px] text-muted-foreground">
                      {isAnalyzing ? "Analyzing image..." : "Fetching metadata..."}
                    </p>
                  </div>
                )}

                {reviewData && (
                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-2 rounded-xl border p-3 ${
                        reviewData.found
                          ? "border-brand-sage/15 bg-brand-sage/8"
                          : "border-brand-amber/15 bg-brand-amber/8"
                      }`}
                    >
                      {reviewData.found ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-sage" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-brand-amber" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-[13px] font-medium ${
                            reviewData.found ? "text-brand-sage" : "text-brand-amber"
                          }`}
                        >
                          {reviewData.found ? "External metadata loaded" : "Metadata not found"}
                        </p>
                        <p
                          className={`text-[11px] ${
                            reviewData.found ? "text-brand-sage/70" : "text-brand-amber/70"
                          }`}
                        >
                          Title, author, and ISBN are required to save the book.
                        </p>
                      </div>

                      {/* Language badge */}
                      {reviewData.language && reviewData.language.toLowerCase() !== "english" && (
                        <Badge variant="outline" className="text-[10px]">
                          <Globe className="mr-1 h-3 w-3" />
                          {reviewData.language}
                        </Badge>
                      )}
                    </div>

                    {reviewData.source && (
                      <p className="text-[11px] text-muted-foreground">
                        Source: <span className="font-medium text-foreground">{reviewData.source}</span>
                      </p>
                    )}

                    {reviewData.coverImageUrl && (
                      <div className="overflow-hidden rounded-xl border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reviewData.coverImageUrl}
                          alt={reviewData.title || "Book cover"}
                          className="h-56 w-full bg-secondary/40 object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">ISBN</Label>
                        <Input value={reviewData.isbn} onChange={updateField("isbn")} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Title</Label>
                        <Input value={reviewData.title} onChange={updateField("title")} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Author</Label>
                        <Input value={reviewData.author} onChange={updateField("author")} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Publisher</Label>
                          <Input value={reviewData.publisher} onChange={updateField("publisher")} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Publish Date</Label>
                          <Input value={reviewData.publishDate} onChange={updateField("publishDate")} className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Genre</Label>
                          <Input value={reviewData.genre} onChange={updateField("genre")} className="mt-1" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                            {reviewData.deweyConfidence !== null && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1.5 py-0 cursor-help ${confidenceBadgeClass(reviewData.deweyConfidence)}`}
                                  >
                                    {reviewData.deweyConfidence}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    AI confidence: {reviewData.deweyConfidence}%
                                  </p>
                                  {reviewData.deweyReasoning && (
                                    <p className="mt-1 text-xs opacity-80">
                                      {reviewData.deweyReasoning}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <Input value={reviewData.dewey} onChange={updateField("dewey")} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Cover Image URL</Label>
                        <Input
                          value={reviewData.coverImageUrl}
                          onChange={updateField("coverImageUrl")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Number of Copies</Label>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          value={reviewData.copies}
                          onChange={(e) => {
                            const next = parseInt(e.target.value, 10);
                            setReviewData((current) =>
                              current
                                ? { ...current, copies: Number.isFinite(next) ? Math.max(1, next) : 1 }
                                : current,
                            );
                          }}
                          className="mt-1"
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          How many physical copies of this book are you adding?
                        </p>
                      </div>
                    </div>

                    {reviewData.subjects.length > 0 && (
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Subjects</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reviewData.subjects.map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-[10px]">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {reviewData.deweyReasoning && (
                      <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                        {reviewData.deweyReasoning}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                        )}
                        Accept & Add to Catalog
                      </Button>
                      <Button variant="outline" onClick={resetReview} className="text-xs">
                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 2: REVIEW QUEUE                                             */}
        {/* ================================================================ */}

        <TabsContent value="queue">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Ingestion Jobs</CardTitle>
              <CardDescription className="text-xs">
                Review and manage AI-processed book ingestion jobs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status filter bar */}
              <div className="flex gap-2">
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "COMPLETED", label: "Pending Review" },
                    { key: "APPROVED", label: "Approved" },
                    { key: "REJECTED", label: "Rejected" },
                  ] as { key: StatusFilter; label: string }[]
                ).map((item) => (
                  <Button
                    key={item.key}
                    variant={statusFilter === item.key ? "default" : "outline"}
                    size="sm"
                    disabled={isLoadingJobs}
                    onClick={() => handleStatusFilterChange(item.key)}
                    className={
                      statusFilter === item.key
                        ? "bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
                        : "text-xs"
                    }
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {jobsError && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <p className="text-[12px] text-destructive">{jobsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleJobsRetry}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Jobs table */}
              {isLoadingJobs ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand-copper" />
                  <p className="text-[13px] text-muted-foreground">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    No ingestion jobs found.
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Image</TableHead>
                        <TableHead className="text-[11px]">Title</TableHead>
                        <TableHead className="text-[11px]">ISBN</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px]">Source</TableHead>
                        <TableHead className="text-[11px]">Date</TableHead>
                        <TableHead className="text-[11px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const statusInfo = STATUS_BADGE_MAP[job.status];
                        return (
                          <TableRow key={job.id}>
                            <TableCell>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={job.imageUrl}
                                alt="Job image"
                                className="h-10 w-10 rounded-md border border-border object-cover"
                              />
                            </TableCell>
                            <TableCell className="text-[13px]">
                              {job.suggestedTitle || "Untitled"}
                            </TableCell>
                            <TableCell className="text-[13px] font-mono">
                              {job.detectedIsbn || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">
                              {job.metadataSource || "-"}
                            </TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {job.status === "COMPLETED" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => openReviewDialog(job)}
                                >
                                  <Sparkles className="mr-1.5 h-3 w-3" />
                                  Review
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => openReviewDialog(job)}
                                >
                                  <Eye className="mr-1.5 h-3 w-3" />
                                  View
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Page {jobsPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoadingJobs || jobsPage <= 1}
                        onClick={() => setJobsPage((prev) => prev - 1)}
                        className="text-xs"
                      >
                        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoadingJobs || jobsPage >= totalPages}
                        onClick={() => setJobsPage((prev) => prev + 1)}
                        className="text-xs"
                      >
                        Next
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <JobReviewDialog
        job={reviewJob}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
