"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

export function useCatalogState() {
  // Data
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, sortField, sortDirection]);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: BookQueryParams = {
        search: debouncedSearch || undefined,
        category: filters.category !== "all" ? filters.category : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        language: filters.language !== "all" ? filters.language : undefined,
        yearMin: filters.yearMin ? parseInt(filters.yearMin) : undefined,
        yearMax: filters.yearMax ? parseInt(filters.yearMax) : undefined,
        sortBy: sortField ?? undefined,
        sortDir: sortField ? sortDirection : undefined,
        page,
        pageSize,
      };

      const result = await getBooks(params);
      setBooks(result.books);
      setTotal(result.total);

      // Also fetch all (unfiltered, unpaginated) for stats
      try {
        const allResult = await getBooks({ pageSize: 9999 });
        setAllBooks(allResult.books);
      } catch {
        setAllBooks(result.books);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load catalog data";
      setError(message);
      setBooks([]);
      setAllBooks([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters, sortField, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Active filter count
  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.language !== "all" ? 1 : 0) +
    (filters.yearMin ? 1 : 0) +
    (filters.yearMax ? 1 : 0);

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

  return {
    // Data
    books,
    allBooks,
    total,
    isLoading,
    error,

    // Search
    searchQuery,
    setSearchQuery,

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
    refreshBooks: fetchBooks,
  };
}
