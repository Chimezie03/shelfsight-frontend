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
  coverImageUrl: string | null;
  publishYear?: string | null;
  availableCopies: number;
  totalCopies: number;
  availableCopyIds?: string[];
  createdAt: string;
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
  const status: Book["status"] =
    b.totalCopies === 0
      ? "maintenance"
      : b.availableCopies > 0
      ? "available"
      : "checked-out";

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
    location: dewey ? `Shelf ${dewey.split(".")[0]}` : "—",
    status,
    copies: b.totalCopies,
    publisher: "",
    publishYear,
    edition: "",
    language: "English",
    pageCount: 0,
    description: "",
    subjects: b.genre ? [b.genre] : [],
    coverImageUrl: b.coverImageUrl ?? "",
    dateAdded: new Date(b.createdAt).toISOString().slice(0, 10),
    lastModified: new Date(b.createdAt).toISOString().slice(0, 10),
  };
}

// ── API Functions ────────────────────────────────────────────────────

export async function getBooks(
  params: BookQueryParams = {}
): Promise<BookListResponse> {
  const searchParams = new URLSearchParams();

  // Map frontend query params to backend query params
  if (params.search) searchParams.set("title", params.search);
  if (params.category && params.category !== "all") {
    searchParams.set("genre", params.category);
  }

  // Pagination
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  searchParams.set("page", String(page));
  searchParams.set("limit", String(pageSize));

  const qs = searchParams.toString();
  const res = await apiFetch<BackendBooksResponse>(
    `/books${qs ? `?${qs}` : ""}`
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
      coverImageUrl: data.coverImageUrl || undefined,
      publishYear: data.publishYear ? String(data.publishYear) : undefined,
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
      coverImageUrl: data.coverImageUrl || undefined,
      publishYear: data.publishYear != null ? String(data.publishYear) : undefined,
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
