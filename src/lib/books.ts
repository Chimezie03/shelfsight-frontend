import { apiFetch } from "./api";
import type {
  Book,
  BookFormData,
  BookQueryParams,
  BookListResponse,
} from "@/types/book";
import { MOCK_BOOKS } from "@/app/(dashboard)/catalog/mock-data";

// ── In-memory mock store (used when backend is unreachable) ──────────
let mockStore: Book[] = [...MOCK_BOOKS];
let nextId = mockStore.length + 1;

function applyQueryToMockStore(params: BookQueryParams): BookListResponse {
  let filtered = [...mockStore];

  // Search
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.dewey.includes(q)
    );
  }

  // Filters
  if (params.category && params.category !== "all") {
    filtered = filtered.filter((b) => b.category === params.category);
  }
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((b) => b.status === params.status);
  }
  if (params.language && params.language !== "all") {
    filtered = filtered.filter((b) => b.language === params.language);
  }
  if (params.yearMin != null) {
    filtered = filtered.filter((b) => b.publishYear >= params.yearMin!);
  }
  if (params.yearMax != null) {
    filtered = filtered.filter((b) => b.publishYear <= params.yearMax!);
  }

  // Sort
  if (params.sortBy) {
    const dir = params.sortDir === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[params.sortBy!];
      const bVal = b[params.sortBy!];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
  }

  // Pagination
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const books = filtered.slice(start, start + pageSize);

  return { books, total, page, pageSize };
}

// ── API Functions ────────────────────────────────────────────────────

export async function getBooks(
  params: BookQueryParams = {}
): Promise<BookListResponse> {
  try {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val != null && val !== "" && val !== "all") {
        searchParams.set(key, String(val));
      }
    });
    const qs = searchParams.toString();
    return await apiFetch<BookListResponse>(
      `/books${qs ? `?${qs}` : ""}`
    );
  } catch {
    return applyQueryToMockStore(params);
  }
}

export async function getBook(id: string): Promise<Book> {
  try {
    return await apiFetch<Book>(`/books/${id}`);
  } catch {
    const book = mockStore.find((b) => b.id === id);
    if (!book) throw new Error("Book not found");
    return book;
  }
}

export async function createBook(data: BookFormData): Promise<Book> {
  try {
    return await apiFetch<Book>("/books", { method: "POST", body: data });
  } catch {
    const now = new Date().toISOString().slice(0, 10);
    const newBook: Book = {
      ...data,
      id: String(nextId++),
      dateAdded: now,
      lastModified: now,
    };
    mockStore = [newBook, ...mockStore];
    return newBook;
  }
}

export async function updateBook(
  id: string,
  data: Partial<BookFormData>
): Promise<Book> {
  try {
    return await apiFetch<Book>(`/books/${id}`, {
      method: "PUT",
      body: data,
    });
  } catch {
    const idx = mockStore.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Book not found");
    const updated: Book = {
      ...mockStore[idx],
      ...data,
      lastModified: new Date().toISOString().slice(0, 10),
    };
    mockStore[idx] = updated;
    return updated;
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    await apiFetch<void>(`/books/${id}`, { method: "DELETE" });
  } catch {
    mockStore = mockStore.filter((b) => b.id !== id);
  }
}

export async function deleteBooks(ids: string[]): Promise<void> {
  try {
    await apiFetch<void>("/books/batch", {
      method: "DELETE",
      body: { ids },
    });
  } catch {
    const idSet = new Set(ids);
    mockStore = mockStore.filter((b) => !idSet.has(b.id));
  }
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
