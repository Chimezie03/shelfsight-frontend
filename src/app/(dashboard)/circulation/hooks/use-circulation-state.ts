"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  CirculationMember,
  CirculationBook,
  Loan,
  Fine,
  TransactionLog,
  CheckoutQueueItem,
  LoanSortField,
  SortDirection,
  LoanFilters,
  FineFilters,
  TransactionFilters,
} from "@/types/circulation";
import {
  DEFAULT_LOAN_DAYS,
  DEFAULT_PAGE_SIZE,
  DAILY_FINE_RATE,
  MAX_FINE_PER_ITEM,
} from "../constants";

const SEARCH_DEBOUNCE_MS = 300;
const BOOK_SEARCH_LIMIT = 100;
const BOOK_BROWSE_LIMIT = 50;
const LOAN_PAGE_LIMIT = 200;
const UI_STATE_STORAGE_KEY = "shelfsight:circ-ui:v2";

/* ── Backend response types ─────────────────────────────────────────── */

interface BackendLoan {
  id: string;
  user: { id: string; name: string; email: string };
  bookCopy: {
    id: string;
    barcode: string;
    book: { id: string; title: string; author: string; isbn?: string | null };
  };
  checkedOutAt: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: number;
  isOverdue: boolean;
}

interface BackendLoansResponse {
  data: BackendLoan[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface BackendBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  availableCopies: number;
  totalCopies: number;
  availableCopyIds?: string[];
}

interface BackendBooksResponse {
  data: BackendBook[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendFine {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  bookTitle: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  reason: string;
  createdDate: string;
  paidDate: string | null;
  waivedBy: string | null;
}

interface BackendFinesResponse {
  data: BackendFine[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendTransaction {
  id: string;
  type: TransactionLog['type'];
  loanId: string | null;
  bookTitle: string;
  memberName: string;
  memberNumber: string;
  timestamp: string;
  processedBy: string;
  details: string;
}

interface BackendTransactionsResponse {
  data: BackendTransaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/* ── Transform helpers ──────────────────────────────────────────────── */

function backendLoanToLoan(bl: BackendLoan): Loan {
  const overdue = bl.isOverdue;
  return {
    id: bl.id,
    bookId: bl.bookCopy.book.id,
    bookTitle: bl.bookCopy.book.title ?? "",
    bookISBN: bl.bookCopy.book.isbn ?? "",
    bookAuthor: bl.bookCopy.book.author ?? "",
    memberId: bl.user.id,
    memberName: bl.user.name,
    memberNumber: bl.user.email,
    checkoutDate: toDateInputValue(new Date(bl.checkedOutAt)),
    dueDate: toDateInputValue(new Date(bl.dueDate)),
    returnDate: bl.returnedAt ? toDateInputValue(new Date(bl.returnedAt)) : null,
    status: bl.returnedAt ? "RETURNED" : overdue ? "OVERDUE" : "CHECKED_OUT",
    renewalCount: 0,
    maxRenewals: 2,
    fine: bl.fineAmount,
    notes: "",
    checkedOutBy: "Staff",
  };
}

function backendUserToMember(u: BackendUser): CirculationMember {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: "",
    memberNumber: u.email,
    status: "active",
    activeLoans: 0,
    maxLoans: 10,
    totalFinesOwed: 0,
  };
}

function backendBookToCircBook(b: BackendBook): CirculationBook {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    available: b.availableCopies > 0,
    copies: b.totalCopies,
    availableCopies: b.availableCopies,
  };
}

/* ── Overdue/fine utilities ─────────────────────────────────────────── */

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toDateInputValue(date: Date): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function parseDateOnly(dateValue: string): Date {
  const [year, month, day] = dateValue.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return new Date(dateValue);
  }
  return new Date(year, month - 1, day);
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function normalizeForSearch(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function normalizeIsbn(value: string): string {
  return value.replace(/[^0-9xX]/g, "").toLowerCase();
}

function isLikelyIsbnQuery(query: string): boolean {
  const compact = normalizeIsbn(query);
  return compact.length >= 8 && /\d/.test(compact);
}

function findBestCheckinLoan(loans: Loan[], query: string): Loan | null {
  const q = normalizeQuery(query);
  if (!q) return null;

  const qIsbn = normalizeIsbn(q);
  const candidates = loans.filter(
    (loan) => loan.status === "CHECKED_OUT" || loan.status === "OVERDUE"
  );

  let best: { loan: Loan; score: number } | null = null;

  for (const loan of candidates) {
    const title = normalizeForSearch(loan.bookTitle);
    const author = normalizeForSearch(loan.bookAuthor);
    const isbn = normalizeForSearch(loan.bookISBN);
    const normalizedLoanIsbn = normalizeIsbn(String(loan.bookISBN ?? ""));

    let score = -1;

    if (qIsbn.length > 0 && normalizedLoanIsbn.length > 0) {
      if (normalizedLoanIsbn === qIsbn) {
        score = Math.max(score, 100);
      } else if (normalizedLoanIsbn.startsWith(qIsbn)) {
        score = Math.max(score, 95);
      } else if (normalizedLoanIsbn.includes(qIsbn)) {
        score = Math.max(score, 90);
      }
    }

    if (title === q) {
      score = Math.max(score, 85);
    } else if (title.startsWith(q)) {
      score = Math.max(score, 80);
    } else if (title.includes(q)) {
      score = Math.max(score, 75);
    }

    if (author === q) {
      score = Math.max(score, 70);
    } else if (author.startsWith(q)) {
      score = Math.max(score, 65);
    } else if (author.includes(q)) {
      score = Math.max(score, 60);
    }

    if (isbn.includes(q)) {
      score = Math.max(score, 55);
    }

    if (score < 0) continue;

    if (!best || score > best.score) {
      best = { loan, score };
    }
  }

  return best?.loan ?? null;
}

function getDaysOverdue(dueDate: string): number {
  const today = parseDateOnly(toDateInputValue(new Date()));
  const due = parseDateOnly(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function calculateFine(dueDate: string): number {
  const days = getDaysOverdue(dueDate);
  return Math.min(days * DAILY_FINE_RATE, MAX_FINE_PER_ITEM);
}

/* ── Hook ───────────────────────────────────────────────────────────── */

export function useCirculationState() {
  // ─── Core data (fetched from API) ────────────────────────
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<CirculationMember[]>([]);
  const [books, setBooks] = useState<CirculationBook[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [finesTotal, setFinesTotal] = useState(0);
  const [transactionLog, setTransactionLog] = useState<TransactionLog[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [finesRefreshKey, setFinesRefreshKey] = useState(0);
  const [debouncedFineSearch, setDebouncedFineSearch] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Tab ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("checkout");

  // ─── Checkout workflow ───────────────────────────────────
  const [selectedMember, setSelectedMember] = useState<CirculationMember | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [debouncedBookSearch, setDebouncedBookSearch] = useState("");
  const [isBookSearchLoading, setIsBookSearchLoading] = useState(false);
  const [bookSearchError, setBookSearchError] = useState<string | null>(null);
  const [checkoutQueue, setCheckoutQueue] = useState<CheckoutQueueItem[]>([]);
  const [loanDays, setLoanDays] = useState(DEFAULT_LOAN_DAYS);

  // ─── Check-in workflow ───────────────────────────────────
  const [checkinSearch, setCheckinSearch] = useState("");
  const [debouncedCheckinSearch, setDebouncedCheckinSearch] = useState("");
  const [detectedLoan, setDetectedLoan] = useState<Loan | null>(null);
  const [isCheckinLookupLoading, setIsCheckinLookupLoading] = useState(false);

  // ─── Active loans ────────────────────────────────────────
  const [loanFilters, setLoanFilters] = useState<LoanFilters>({ status: "all", search: "" });
  const [loanSortField, setLoanSortField] = useState<LoanSortField | null>(null);
  const [loanSortDirection, setLoanSortDirection] = useState<SortDirection>("asc");
  const [loanPage, setLoanPage] = useState(1);
  const [loanPageSize, setLoanPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ─── Fines ───────────────────────────────────────────────
  const [fineFilters, setFineFilters] = useState<FineFilters>({ status: "all", search: "" });
  const [finePage, setFinePageRaw] = useState(1);
  const [finePageSize, setFinePageSizeRaw] = useState(DEFAULT_PAGE_SIZE);

  // ─── History ─────────────────────────────────────────────
  const [historyFilters, setHistoryFilters] = useState<TransactionFilters>({
    type: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [historyPage, setHistoryPageRaw] = useState(1);
  const [historyPageSize, setHistoryPageSizeRaw] = useState(DEFAULT_PAGE_SIZE);
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");

  // ─── Dialogs/sheets ──────────────────────────────────────
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [renewLoan, setRenewLoan] = useState<Loan | null>(null);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [checkinLoan, setCheckinLoan] = useState<Loan | null>(null);
  const [isCheckinConfirmOpen, setIsCheckinConfirmOpen] = useState(false);
  const loansAbortRef = useRef<AbortController | null>(null);
  const loansRequestIdRef = useRef(0);
  const booksAbortRef = useRef<AbortController | null>(null);
  const booksRequestIdRef = useRef(0);
  const lastBooksQueryRef = useRef<string | null>(null);
  const checkinIsbnAbortRef = useRef<AbortController | null>(null);
  const checkinIsbnRequestIdRef = useRef(0);
  const historyAbortRef = useRef<AbortController | null>(null);
  const hasHydratedUiStateRef = useRef(false);

  // ─── Fetch loans from API ────────────────────────────────
  const fetchLoans = useCallback(async () => {
    const requestId = ++loansRequestIdRef.current;

    loansAbortRef.current?.abort();
    const controller = new AbortController();
    loansAbortRef.current = controller;

    try {
      // Fetch page 1 to learn totalPages, then fetch remaining pages in parallel.
      const firstResult = await apiFetch<BackendLoansResponse>(
        `/loans?status=active&page=1&limit=${LOAN_PAGE_LIMIT}`,
        { signal: controller.signal }
      );

      const totalPages = Math.max(1, firstResult.pagination.totalPages || 1);

      let allLoans: BackendLoan[] = [...firstResult.data];

      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const remainingResults = await Promise.all(
          remainingPages.map((page) =>
            apiFetch<BackendLoansResponse>(
              `/loans?status=active&page=${page}&limit=${LOAN_PAGE_LIMIT}`,
              { signal: controller.signal }
            )
          )
        );
        for (const result of remainingResults) {
          allLoans = allLoans.concat(result.data);
        }
      }

      if (controller.signal.aborted || requestId !== loansRequestIdRef.current) {
        return;
      }

      setLoans(allLoans.map(backendLoanToLoan));
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        return;
      }
      throw err;
    }
  }, []);

  // ─── Fetch members from API ──────────────────────────────
  const fetchMembers = useCallback(async () => {
    try {
      const usersRes = await apiFetch<{ data: BackendUser[] }>("/users?limit=100");
      setMembers(usersRes.data.map(backendUserToMember));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        const loansRes = await apiFetch<BackendLoansResponse>("/loans?limit=500");
        const map = new Map<string, CirculationMember>();
        for (const loan of loansRes.data) {
          const key = loan.user.id;
          if (!map.has(key)) {
            map.set(key, {
              id: loan.user.id,
              name: loan.user.name,
              email: loan.user.email,
              phone: "",
              memberNumber: loan.user.email,
              status: "active",
              activeLoans: 0,
              maxLoans: 10,
              totalFinesOwed: 0,
            });
          }
          if (!loan.returnedAt) {
            const existing = map.get(key);
            if (existing) existing.activeLoans += 1;
          }
        }
        setMembers(Array.from(map.values()));
        return;
      }
      throw err;
    }
  }, []);

  // ─── Fetch books from API (for checkout search) ──────────
  const fetchBooks = useCallback(
    async (search = "", options?: { force?: boolean }) => {
      const normalizedSearch = search.trim();

      if (!options?.force && normalizedSearch === lastBooksQueryRef.current) {
        return;
      }

      const requestId = ++booksRequestIdRef.current;

      booksAbortRef.current?.abort();
      const controller = new AbortController();
      booksAbortRef.current = controller;

      setIsBookSearchLoading(true);
      setBookSearchError(null);

      const params = new URLSearchParams({
        limit: String(normalizedSearch ? BOOK_SEARCH_LIMIT : BOOK_BROWSE_LIMIT),
      });

      if (normalizedSearch) {
        if (isLikelyIsbnQuery(normalizedSearch)) {
          params.set("isbn", normalizedSearch);
        } else {
          params.set("search", normalizedSearch);
        }
      }

      try {
        const res = await apiFetch<BackendBooksResponse>(`/books?${params.toString()}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted || requestId !== booksRequestIdRef.current) {
          return;
        }

        setBooks(res.data.map(backendBookToCircBook));
        lastBooksQueryRef.current = normalizedSearch;
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }
        if (requestId !== booksRequestIdRef.current) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to search books";
        setBookSearchError(message);
        throw err;
      } finally {
        if (requestId === booksRequestIdRef.current) {
          setIsBookSearchLoading(false);
        }
      }
    },
    []
  );

  // ─── Fetch fines from API (server-side filtered & paginated) ───
  const fetchFines = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(finePage),
        limit: String(finePageSize),
      });
      if (fineFilters.status !== "all") params.set("status", fineFilters.status);
      if (debouncedFineSearch) params.set("search", debouncedFineSearch);
      const result = await apiFetch<BackendFinesResponse>(`/fines?${params.toString()}`);
      setFines(result.data);
      setFinesTotal(result.pagination.total);
    } catch (err) {
      if (isAbortError(err)) return;
      // silently fail — fines are non-blocking for overall page load
    }
  }, [finePage, finePageSize, fineFilters.status, debouncedFineSearch]);

  // ─── Initial data load ──────────────────────────────────
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setHistoryRefreshKey((k) => k + 1);
    const results = await Promise.allSettled([
      fetchLoans(),
      fetchMembers(),
      fetchBooks("", { force: true }),
      fetchFines(),
    ]);
    const firstFailure = results.find((result) => result.status === "rejected");
    if (firstFailure && firstFailure.status === "rejected") {
      const reason = firstFailure.reason;
      const message =
        reason instanceof Error ? reason.message : "Failed to load circulation data";
      setLoadError(message);
    }
    setIsLoading(false);
  }, [fetchLoans, fetchMembers, fetchBooks, fetchFines]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // ─── Debounced book search ───────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(UI_STATE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        activeTab?: string;
        bookSearch?: string;
        checkinSearch?: string;
        fineFilters?: FineFilters;
        finePage?: number;
        finePageSize?: number;
        historyFilters?: TransactionFilters;
        historyPage?: number;
        historyPageSize?: number;
      };

      if (typeof parsed.activeTab === "string") {
        setActiveTab(parsed.activeTab);
      }
      if (typeof parsed.bookSearch === "string") {
        setBookSearch(parsed.bookSearch);
      }
      if (typeof parsed.checkinSearch === "string") {
        setCheckinSearch(parsed.checkinSearch);
      }
      if (parsed.fineFilters && typeof parsed.fineFilters === "object") {
        setFineFilters(parsed.fineFilters);
      }
      if (typeof parsed.finePage === "number") {
        setFinePageRaw(parsed.finePage);
      }
      if (typeof parsed.finePageSize === "number") {
        setFinePageSizeRaw(parsed.finePageSize);
      }
      if (parsed.historyFilters && typeof parsed.historyFilters === "object") {
        setHistoryFilters(parsed.historyFilters);
      }
      if (typeof parsed.historyPage === "number") {
        setHistoryPageRaw(parsed.historyPage);
      }
      if (typeof parsed.historyPageSize === "number") {
        setHistoryPageSizeRaw(parsed.historyPageSize);
      }
    } catch {
      // Ignore malformed persisted state.
    } finally {
      hasHydratedUiStateRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedUiStateRef.current || typeof window === "undefined") return;
    const payload = {
      activeTab,
      bookSearch,
      checkinSearch,
      fineFilters,
      finePage,
      finePageSize,
      historyFilters,
      historyPage,
      historyPageSize,
    };
    window.sessionStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(payload));
  }, [activeTab, bookSearch, checkinSearch, fineFilters, finePage, finePageSize, historyFilters, historyPage, historyPageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedBookSearch(bookSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [bookSearch]);

  useEffect(() => {
    void fetchBooks(debouncedBookSearch).catch(() => {
      // Search error state is set inside fetchBooks.
    });
  }, [debouncedBookSearch, fetchBooks]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCheckinSearch(checkinSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [checkinSearch]);

  useEffect(() => {
    if (!debouncedCheckinSearch) {
      checkinIsbnAbortRef.current?.abort();
      setIsCheckinLookupLoading(false);
      setDetectedLoan(null);
      return;
    }

    const localMatch = findBestCheckinLoan(loans, debouncedCheckinSearch);
    if (localMatch) {
      checkinIsbnAbortRef.current?.abort();
      setIsCheckinLookupLoading(false);
      setDetectedLoan(localMatch);
      return;
    }

    if (!isLikelyIsbnQuery(debouncedCheckinSearch)) {
      checkinIsbnAbortRef.current?.abort();
      setIsCheckinLookupLoading(false);
      setDetectedLoan(null);
      return;
    }

    const requestId = ++checkinIsbnRequestIdRef.current;
    checkinIsbnAbortRef.current?.abort();
    const controller = new AbortController();
    checkinIsbnAbortRef.current = controller;
    setIsCheckinLookupLoading(true);

    void apiFetch<BackendBooksResponse>(
      `/books?isbn=${encodeURIComponent(debouncedCheckinSearch)}&limit=20`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (controller.signal.aborted || requestId !== checkinIsbnRequestIdRef.current) {
          return;
        }

        const booksById = new Map(res.data.map((book) => [book.id, book]));
        const foundLoan = loans.find(
          (loan) =>
            (loan.status === "CHECKED_OUT" || loan.status === "OVERDUE") &&
            booksById.has(loan.bookId)
        );

        if (!foundLoan) {
          setDetectedLoan(null);
          return;
        }

        const matchedBook = booksById.get(foundLoan.bookId);
        if (matchedBook?.isbn && !foundLoan.bookISBN) {
          setDetectedLoan({ ...foundLoan, bookISBN: matchedBook.isbn });
          return;
        }

        setDetectedLoan(foundLoan);
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }
        if (requestId !== checkinIsbnRequestIdRef.current) {
          return;
        }
        setDetectedLoan(null);
      })
      .finally(() => {
        if (requestId === checkinIsbnRequestIdRef.current) {
          setIsCheckinLookupLoading(false);
        }
      });
  }, [loans, debouncedCheckinSearch]);

  useEffect(() => {
    return () => {
      booksAbortRef.current?.abort();
      loansAbortRef.current?.abort();
      checkinIsbnAbortRef.current?.abort();
      historyAbortRef.current?.abort();
    };
  }, []);

  // ─── Fine search debounce ────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFineSearch(fineFilters.search.trim());
      setFinePageRaw(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fineFilters.search]);

  // ─── Fetch fines on mount, filter change, or after refresh ─
  useEffect(() => {
    void fetchFines();
  }, [fetchFines, finesRefreshKey]);

  // ─── History debounce ─────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedHistorySearch(historyFilters.search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [historyFilters.search]);

  // ─── Fetch transactions from API (server-side pagination) ─
  useEffect(() => {
    historyAbortRef.current?.abort();
    const controller = new AbortController();
    historyAbortRef.current = controller;
    setIsHistoryLoading(true);

    const params = new URLSearchParams({
      page: String(historyPage),
      limit: String(historyPageSize),
    });
    if (historyFilters.type !== "all") params.set("type", historyFilters.type);
    if (debouncedHistorySearch) params.set("search", debouncedHistorySearch);
    if (historyFilters.dateFrom) params.set("dateFrom", historyFilters.dateFrom);
    if (historyFilters.dateTo) params.set("dateTo", historyFilters.dateTo);

    apiFetch<BackendTransactionsResponse>(`/transactions?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (controller.signal.aborted) return;
        setTransactionLog(
          res.data.map((tx) => ({
            id: tx.id,
            type: tx.type,
            loanId: tx.loanId ?? "",
            bookTitle: tx.bookTitle,
            memberName: tx.memberName,
            memberNumber: tx.memberNumber,
            timestamp: tx.timestamp,
            processedBy: tx.processedBy,
            details: tx.details,
          }))
        );
        setHistoryTotal(res.pagination.total);
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    historyPage,
    historyPageSize,
    historyFilters.type,
    historyFilters.dateFrom,
    historyFilters.dateTo,
    debouncedHistorySearch,
    historyRefreshKey,
  ]);

  // ─── Computed: stats ─────────────────────────────────────
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === "CHECKED_OUT"),
    [loans]
  );
  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === "OVERDUE"),
    [loans]
  );
  const today = toDateInputValue(new Date());
  const returnsTodayCount = useMemo(
    () => loans.filter((l) => l.returnDate === today).length,
    [loans, today]
  );
  // totalOutstandingFines comes from fineSummary below (computed after full fines load).
  // Here we provide a best-effort value from currently loaded page.
  const totalOutstandingFines = useMemo(
    () => fines.filter((f) => f.status === "UNPAID").reduce((sum, f) => sum + f.amount, 0),
    [fines]
  );

  // ─── Computed: filtered members ──────────────────────────
  const filteredMembers = useMemo(() => {
    if (!memberSearch) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // ─── Computed: filtered books ────────────────────────────
  const filteredBooks = useMemo(() => {
    return books;
  }, [books]);

  // ─── Computed: active loans (filtered, sorted, paginated)
  const activeAndOverdueLoans = useMemo(
    () => loans.filter((l) => l.status === "CHECKED_OUT" || l.status === "OVERDUE"),
    [loans]
  );

  const filteredLoans = useMemo(() => {
    let result = activeAndOverdueLoans;
    if (loanFilters.status !== "all") {
      result = result.filter((l) => l.status === loanFilters.status);
    }
    if (loanFilters.search) {
      const q = loanFilters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.bookTitle.toLowerCase().includes(q) ||
          l.bookAuthor.toLowerCase().includes(q) ||
          l.memberName.toLowerCase().includes(q) ||
          l.memberNumber.toLowerCase().includes(q) ||
          l.bookISBN.toLowerCase().includes(q)
      );
    }
    if (loanSortField) {
      result = [...result].sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";
        switch (loanSortField) {
          case "bookTitle": aVal = a.bookTitle; bVal = b.bookTitle; break;
          case "memberName": aVal = a.memberName; bVal = b.memberName; break;
          case "checkoutDate": aVal = a.checkoutDate; bVal = b.checkoutDate; break;
          case "dueDate": aVal = a.dueDate; bVal = b.dueDate; break;
          case "status": aVal = a.status; bVal = b.status; break;
          case "fine": aVal = a.fine; bVal = b.fine; break;
        }
        if (aVal < bVal) return loanSortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return loanSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [activeAndOverdueLoans, loanFilters, loanSortField, loanSortDirection]);

  const totalFilteredLoans = filteredLoans.length;
  const paginatedLoans = useMemo(() => {
    const start = (loanPage - 1) * loanPageSize;
    return filteredLoans.slice(start, start + loanPageSize);
  }, [filteredLoans, loanPage, loanPageSize]);

  // ─── Computed: fines are server-side filtered & paginated ──
  const totalFilteredFines = finesTotal;
  const paginatedFines = fines;

  // ─── Computed: history (server-side filtered & paginated) ─
  const totalFilteredHistory = historyTotal;
  const paginatedHistory = transactionLog;

  // ─── Fine summary stats ──────────────────────────────────
  const fineSummary = useMemo(() => {
    const unpaid = fines.filter((f) => f.status === "UNPAID").reduce((s, f) => s + f.amount, 0);
    const paid = fines.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
    const waived = fines.filter((f) => f.status === "WAIVED").reduce((s, f) => s + f.amount, 0);
    return { unpaid, paid, waived };
  }, [fines]);

  // ─── Actions: checkout (calls real API) ──────────────────
  const addToQueue = useCallback(
    (book: CirculationBook & { bookCopyId?: string }) => {
      if (checkoutQueue.some((q) => q.bookId === book.id)) return;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loanDays);
      setCheckoutQueue((prev) => [
        ...prev,
        {
          bookId: book.id,
          bookTitle: book.title,
          bookISBN: book.isbn,
          bookAuthor: book.author,
          dueDate: toDateInputValue(dueDate),
          bookCopyId: book.bookCopyId,
        },
      ]);
    },
    [checkoutQueue, loanDays]
  );

  const removeFromQueue = useCallback((bookId: string) => {
    setCheckoutQueue((prev) => prev.filter((q) => q.bookId !== bookId));
  }, []);

  const clearQueue = useCallback(() => {
    setCheckoutQueue([]);
  }, []);

  const processCheckout = useCallback(async () => {
    if (!selectedMember || checkoutQueue.length === 0) return;

    try {
      // Get available copy IDs for queued books
      for (const item of checkoutQueue) {
        let copyId = item.bookCopyId;
        if (!copyId) {
          // No direct copy ID — look it up from the books API
          const fallbackSearch = item.bookISBN || item.bookTitle || item.bookAuthor;
          const res = await apiFetch<BackendBooksResponse>(`/books?search=${encodeURIComponent(fallbackSearch)}&limit=5`);
          const book = res.data.find((b) => b.id === item.bookId);
          copyId = book?.availableCopyIds?.[0];
        }
        if (!copyId) {
          throw new Error(`No available copy for "${item.bookTitle}"`);
        }
        await apiFetch("/loans/checkout", {
          method: "POST",
          body: { bookCopyId: copyId, userId: selectedMember.id },
        });
      }

      const count = checkoutQueue.length;
      const memberName = selectedMember.name;

      // Refresh loans, books, and transaction history from API
      await Promise.all([fetchLoans(), fetchBooks("", { force: true })]);
      setHistoryRefreshKey((k) => k + 1);

      // Clear workflow
      setCheckoutQueue([]);
      setSelectedMember(null);
      setMemberSearch("");
      setBookSearch("");

      return { count, memberName };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      throw new Error(message);
    }
  }, [selectedMember, checkoutQueue, loanDays, fetchLoans, fetchBooks]);
  const searchForCheckin = useCallback(
    (query: string) => {
      setCheckinSearch(query);
    },
    []
  );

  const openCheckinConfirm = useCallback((loan: Loan) => {
    setCheckinLoan(loan);
    setIsCheckinConfirmOpen(true);
  }, []);

  const processCheckin = useCallback(
    async (loan: Loan) => {
      try {
        const result = await apiFetch<{ fineAmount?: number }>("/loans/checkin", {
          method: "POST",
          body: { loanId: loan.id },
        });

        const fine = result.fineAmount ?? 0;

        // Refresh loans, books, fines, and transaction history from API
        await Promise.all([fetchLoans(), fetchBooks("", { force: true }), fetchFines()]);
        setHistoryRefreshKey((k) => k + 1);

        // Clear check-in state
        setDetectedLoan(null);
        setCheckinSearch("");
        setIsCheckinConfirmOpen(false);
        setCheckinLoan(null);

        return { fine, bookTitle: loan.bookTitle };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Check-in failed";
        throw new Error(message);
      }
    },
    [fetchLoans, fetchBooks, fetchFines]
  );

  // ─── Actions: renew ──────────────────────────────────────
  const openRenew = useCallback((loan: Loan) => {
    setRenewLoan(loan);
    setIsRenewOpen(true);
  }, []);

  const processRenewal = useCallback(
    (loan: Loan) => {
      // Renewal is local-only for now (no backend endpoint)
      const newDueDate = parseDateOnly(loan.dueDate);
      newDueDate.setDate(newDueDate.getDate() + loanDays);
      const newDueDateStr = toDateInputValue(newDueDate);

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? { ...l, dueDate: newDueDateStr, renewalCount: l.renewalCount + 1, status: "CHECKED_OUT" as const, fine: 0 }
            : l
        )
      );

      setIsRenewOpen(false);
      setRenewLoan(null);

      return { newDueDate: newDueDateStr, bookTitle: loan.bookTitle };
    },
    [loanDays]
  );

  // ─── Actions: fines ──────────────────────────────────────
  const payFine = useCallback(async (fineId: string) => {
    const fine = await apiFetch<BackendFine>(`/fines/${fineId}/pay`, { method: 'POST' });
    setFinesRefreshKey((k) => k + 1);
    setHistoryRefreshKey((k) => k + 1);
    return fine;
  }, []);

  const waiveFine = useCallback(async (fineId: string) => {
    const fine = await apiFetch<BackendFine>(`/fines/${fineId}/waive`, { method: 'POST' });
    setFinesRefreshKey((k) => k + 1);
    setHistoryRefreshKey((k) => k + 1);
    return fine;
  }, []);

  // ─── Actions: loan table sort ────────────────────────────
  const toggleLoanSort = useCallback(
    (field: LoanSortField) => {
      if (loanSortField === field) {
        if (loanSortDirection === "asc") {
          setLoanSortDirection("desc");
        } else {
          setLoanSortField(null);
          setLoanSortDirection("asc");
        }
      } else {
        setLoanSortField(field);
        setLoanSortDirection("asc");
      }
    },
    [loanSortField, loanSortDirection]
  );

  // ─── Actions: view loan detail ───────────────────────────
  const viewLoanDetail = useCallback((loan: Loan) => {
    setDetailLoan(loan);
    setIsDetailOpen(true);
  }, []);

  // ─── Actions: navigate to overdue ────────────────────────
  const goToOverdue = useCallback(() => {
    setActiveTab("active-loans");
    setLoanFilters({ status: "OVERDUE", search: "" });
  }, []);

  // ─── Pagination helpers ──────────────────────────────────
  const handleLoanPageSizeChange = useCallback((size: number) => {
    setLoanPageSize(size);
    setLoanPage(1);
  }, []);

  const handleFineFiltersChange = useCallback((filters: FineFilters) => {
    setFineFilters(filters);
    setFinePageRaw(1);
  }, []);

  const handleFinePageSizeChange = useCallback((size: number) => {
    setFinePageSizeRaw(size);
    setFinePageRaw(1);
  }, []);

  const handleHistoryFiltersChange = useCallback((filters: TransactionFilters) => {
    setHistoryFilters(filters);
    setHistoryPageRaw(1);
  }, []);

  const handleHistoryPageSizeChange = useCallback((size: number) => {
    setHistoryPageSizeRaw(size);
    setHistoryPageRaw(1);
  }, []);

  const isBookSearchPending = debouncedBookSearch !== bookSearch.trim();
  const isCheckinSearchPending =
    debouncedCheckinSearch !== checkinSearch.trim() || isCheckinLookupLoading;

  return {
    // Data
    loans,
    members,
    books,
    fines,
    transactionLog,
    isLoading,
    loadError,

    // Tab
    activeTab,
    setActiveTab,

    // Stats
    activeLoansCount: activeLoans.length,
    overdueCount: overdueLoans.length,
    returnsTodayCount,
    totalOutstandingFines,

    // Checkout workflow
    selectedMember,
    setSelectedMember,
    memberSearch,
    setMemberSearch,
    bookSearch,
    setBookSearch,
    isBookSearchLoading,
    isBookSearchPending,
    bookSearchError,
    checkoutQueue,
    loanDays,
    setLoanDays,
    filteredMembers,
    filteredBooks,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processCheckout,

    // Check-in workflow
    checkinSearch,
    isCheckinSearchPending,
    searchForCheckin,
    detectedLoan,
    openCheckinConfirm,
    checkinLoan,
    isCheckinConfirmOpen,
    setIsCheckinConfirmOpen,
    processCheckin,

    // Active loans
    loanFilters,
    setLoanFilters,
    loanSortField,
    loanSortDirection,
    toggleLoanSort,
    loanPage,
    setLoanPage,
    loanPageSize,
    setLoanPageSize: handleLoanPageSizeChange,
    paginatedLoans,
    totalFilteredLoans,

    // Fines
    fineFilters,
    setFineFilters: handleFineFiltersChange,
    paginatedFines,
    totalFilteredFines,
    finePage,
    setFinePage: setFinePageRaw,
    finePageSize,
    setFinePageSize: handleFinePageSizeChange,
    fineSummary,
    payFine,
    waiveFine,

    // History
    historyFilters,
    setHistoryFilters: handleHistoryFiltersChange,
    paginatedHistory,
    totalFilteredHistory,
    isHistoryLoading,
    historyPage,
    setHistoryPage: setHistoryPageRaw,
    historyPageSize,
    setHistoryPageSize: handleHistoryPageSizeChange,

    // Dialogs/sheets
    detailLoan,
    isDetailOpen,
    setIsDetailOpen,
    viewLoanDetail,
    renewLoan,
    isRenewOpen,
    setIsRenewOpen,
    openRenew,
    processRenewal,

    // Navigation helpers
    goToOverdue,

    // Utilities
    getDaysOverdue,
    calculateFine,
    reloadData,
  };
}
