"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  Book,
  BookQueryParams,
  SortField,
  SortDirection,
} from "@/types/book";
import { getBooks } from "@/lib/books";

export interface CatalogFilters {
  category: string;
  status: string;
  language: string;
  yearMin: string;
  yearMax: string;
}

const DEFAULT_FILTERS: CatalogFilters = {
  category: "all",
  status: "all",
  language: "all",
  yearMin: "",
  yearMax: "",
};

const SEARCH_DEBOUNCE_MS = 300;

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useCatalogState() {
  // Data
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View mode
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Request control
  const booksAbortRef = useRef<AbortController | null>(null);
  const booksRequestIdRef = useRef(0);
  const lastQueryKeyRef = useRef<string>("");

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const fetchPageBooks = useCallback(async () => {
    const requestId = ++booksRequestIdRef.current;

    booksAbortRef.current?.abort();
    const controller = new AbortController();
    booksAbortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params: BookQueryParams = {
        search: debouncedSearch || undefined,
        category: filters.category !== "all" ? filters.category : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        language: filters.language !== "all" ? filters.language : undefined,
        yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
        yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
        sortBy: sortField ?? undefined,
        sortDir: sortField ? sortDirection : undefined,
        page,
        pageSize,
      };

      const result = await getBooks(params, controller.signal);

      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      const resolvedPageCount = Math.max(
        1,
        Math.ceil(result.total / pageSize)
      );

      if (result.total === 0 && page !== 1) {
        setPage(1);
        return;
      }

      if (result.total > 0 && page > resolvedPageCount) {
        setPage(resolvedPageCount);
        return;
      }

      setBooks(result.books);
      setTotal(result.total);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        return;
      }

      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Failed to load catalog data";
      setError(message);
      setBooks([]);
      setTotal(0);
    } finally {
      if (requestId === booksRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, filters, sortField, sortDirection, page, pageSize]);

  /** Fetch all books matching current filters for CSV export (on-demand). */
  const exportAllBooks = useCallback(async () => {
    const params: BookQueryParams = {
      search: debouncedSearch || undefined,
      category: filters.category !== "all" ? filters.category : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      language: filters.language !== "all" ? filters.language : undefined,
      yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
      yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
      sortBy: sortField ?? undefined,
      sortDir: sortField ? sortDirection : undefined,
      page: 1,
      pageSize: 500,
    };
    const result = await getBooks(params);
    return result.books;
  }, [debouncedSearch, filters, sortField, sortDirection]);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        debouncedSearch,
        filters,
        sortField,
        sortDirection,
        pageSize,
      }),
    [debouncedSearch, filters, sortField, sortDirection, pageSize]
  );

  useEffect(() => {
    const queryChanged = lastQueryKeyRef.current !== queryKey;

    if (queryChanged) {
      lastQueryKeyRef.current = queryKey;

      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    void fetchPageBooks();
  }, [fetchPageBooks, page, queryKey]);

  useEffect(() => {
    return () => {
      booksAbortRef.current?.abort();
    };
  }, []);

  // Active filter count
  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.language !== "all" ? 1 : 0) +
    (filters.yearMin ? 1 : 0) +
    (filters.yearMax ? 1 : 0);

  const isSearchPending = debouncedSearch !== searchQuery.trim();
  const isSearching = isLoading && !!debouncedSearch && !isSearchPending;

  // Actions
  const setFilter = (key: keyof CatalogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllOnPage = () => {
    const allOnPage = books.map((b) => b.id);
    const allSelected = allOnPage.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allOnPage.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allOnPage.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const deselectAll = () => setSelectedIds(new Set());

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const refreshBooks = useCallback(async () => {
    await fetchPageBooks();
  }, [fetchPageBooks]);

  return {
    // Data
    books,
    total,
    isLoading,
    error,

    // Search
    searchQuery,
    setSearchQuery,
    isSearchPending,
    isSearching,

    // Filters
    filters,
    setFilter,
    activeFilterCount,
    clearAllFilters,

    // Sorting
    sortField,
    sortDirection,
    toggleSort,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,

    // Selection
    selectedIds,
    toggleSelect,
    selectAllOnPage,
    deselectAll,

    // View mode
    viewMode,
    setViewMode,

    // Refresh
    refreshBooks,
    exportAllBooks,
  };
}
