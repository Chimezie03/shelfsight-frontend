import { apiFetch } from "./api";
import type {
  Book,
  BookFormData,
  BookQueryParams,
  BookListResponse,
} from "@/types/book";
import { getDeweyCategory } from "@/app/(dashboard)/catalog/constants";

// ── Backend response shapes ──────────────────────────────────────────

interface BackendBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  deweyDecimal: string | null;
  language: string | null;
  coverImageUrl: string | null;
  publishYear?: string | null;
  availableCopies: number;
  processingCopies?: number;
  totalCopies: number;
  availableCopyIds?: string[];
  pageCount?: number | null;
  createdAt: string;
  shelfId?: string | null;
  shelfLabel?: string | null;
}

interface BackendBooksResponse {
  data: BackendBook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Transform backend book → frontend Book type ──────────────────────

function transformBook(b: BackendBook): Book {
  const dewey = b.deweyDecimal ?? "";
  const category = dewey ? getDeweyCategory(dewey) : b.genre ?? "General";
  const processingCopies = b.processingCopies ?? 0;
  const status: Book["status"] =
    b.availableCopies > 0
      ? "available"
      : processingCopies > 0
      ? "maintenance"
      : b.totalCopies > 0
      ? "checked-out"
      : "available";

  const yearNum =
    b.publishYear != null && b.publishYear !== ""
      ? parseInt(String(b.publishYear), 10)
      : NaN;
  const publishYear = !isNaN(yearNum) && yearNum > 0 ? yearNum : new Date(b.createdAt).getFullYear();

  return {
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    dewey,
    category,
    location: b.shelfLabel ?? (dewey ? `Shelf ${dewey.split(".")[0]}` : "—"),
    shelfId: b.shelfId ?? null,
    status,
    copies: b.totalCopies,
    publisher: "",
    publishYear,
    edition: "",
    language: b.language ?? "English",
    pageCount: b.pageCount ?? 0,
    description: "",
    subjects: b.genre ? [b.genre] : [],
    coverImageUrl: b.coverImageUrl ?? "",
    dateAdded: new Date(b.createdAt).toISOString().slice(0, 10),
    lastModified: new Date(b.createdAt).toISOString().slice(0, 10),
  };
}

// ── API Functions ────────────────────────────────────────────────────

export async function getBooks(
  params: BookQueryParams = {},
  signal?: AbortSignal
): Promise<BookListResponse> {
  const searchParams = new URLSearchParams();

  // Map frontend query params to backend query params
  if (params.search) searchParams.set("search", params.search);
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);
  if (params.language) searchParams.set("language", params.language);
  if (params.yearMin != null) searchParams.set("yearMin", String(params.yearMin));
  if (params.yearMax != null) searchParams.set("yearMax", String(params.yearMax));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);

  // Pagination
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  searchParams.set("page", String(page));
  searchParams.set("limit", String(pageSize));

  const qs = searchParams.toString();
  const res = await apiFetch<BackendBooksResponse>(
    `/books${qs ? `?${qs}` : ""}`,
    { signal }
  );

  return {
    books: res.data.map(transformBook),
    total: res.pagination.total,
    page: res.pagination.page,
    pageSize: res.pagination.limit,
  };
}

export async function getBook(id: string): Promise<Book> {
  const b = await apiFetch<BackendBook>(`/books/${id}`);
  return transformBook(b);
}

export async function createBook(data: BookFormData): Promise<Book> {
  const b = await apiFetch<BackendBook>("/books", {
    method: "POST",
    body: {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      genre: data.category || data.subjects?.[0] || undefined,
      deweyDecimal: data.dewey || undefined,
      language: data.language || undefined,
      coverImageUrl: data.coverImageUrl || undefined,
      publishYear: data.publishYear ? String(data.publishYear) : undefined,
      copies: data.copies ?? 1,
      status: data.status,
    },
  });
  return transformBook(b);
}

export async function updateBook(
  id: string,
  data: Partial<BookFormData>
): Promise<Book> {
  const b = await apiFetch<BackendBook>(`/books/${id}`, {
    method: "PUT",
    body: {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      genre: data.category || data.subjects?.[0] || undefined,
      deweyDecimal: data.dewey || undefined,
      language: data.language || undefined,
      coverImageUrl: data.coverImageUrl || undefined,
      publishYear: data.publishYear != null ? String(data.publishYear) : undefined,
      pageCount: data.pageCount != null ? data.pageCount : undefined,
      copies: data.copies != null ? data.copies : undefined,
    },
  });
  return transformBook(b);
}

export async function deleteBook(id: string): Promise<void> {
  await apiFetch<void>(`/books/${id}`, { method: "DELETE" });
}

export async function deleteBooks(ids: string[]): Promise<void> {
  // Backend doesn't have a bulk delete endpoint, do them individually
  await Promise.all(ids.map((id) => deleteBook(id)));
}

// ── CSV Export (client-side) ─────────────────────────────────────────

export function exportBooksCsv(books: Book[]): void {
  const headers = [
    "Title",
    "Author",
    "ISBN",
    "Dewey",
    "Category",
    "Publisher",
    "Year",
    "Language",
    "Status",
    "Location",
    "Copies",
  ];

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = books.map((b) =>
    [
      b.title,
      b.author,
      b.isbn,
      b.dewey,
      b.category,
      b.publisher,
      String(b.publishYear),
      b.language,
      b.status,
      b.location,
      String(b.copies),
    ]
      .map(escape)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `shelfsight-catalog-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
