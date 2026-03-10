"use client";

import { useState, useMemo, useCallback } from "react";
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
  mockMembers,
  mockBooks,
  mockLoans,
  mockFines,
  mockTransactionLog,
} from "../mock-data";
import {
  DEFAULT_LOAN_DAYS,
  DEFAULT_PAGE_SIZE,
  DAILY_FINE_RATE,
  MAX_FINE_PER_ITEM,
} from "../constants";

const TODAY = "2026-03-10";

function getDaysOverdue(dueDate: string): number {
  const today = new Date(TODAY);
  const due = new Date(dueDate);
  const diff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}

function calculateFine(dueDate: string): number {
  const days = getDaysOverdue(dueDate);
  return Math.min(days * DAILY_FINE_RATE, MAX_FINE_PER_ITEM);
}

export function useCirculationState() {
  // ─── Core data ───────────────────────────────────────────
  const [loans, setLoans] = useState<Loan[]>(mockLoans);
  const [members] = useState<CirculationMember[]>(mockMembers);
  const [books, setBooks] = useState<CirculationBook[]>(mockBooks);
  const [fines, setFines] = useState<Fine[]>(mockFines);
  const [transactionLog, setTransactionLog] =
    useState<TransactionLog[]>(mockTransactionLog);

  // ─── Tab ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("checkout");

  // ─── Checkout workflow ───────────────────────────────────
  const [selectedMember, setSelectedMember] =
    useState<CirculationMember | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [checkoutQueue, setCheckoutQueue] = useState<CheckoutQueueItem[]>([]);
  const [loanDays, setLoanDays] = useState(DEFAULT_LOAN_DAYS);

  // ─── Check-in workflow ───────────────────────────────────
  const [checkinSearch, setCheckinSearch] = useState("");
  const [detectedLoan, setDetectedLoan] = useState<Loan | null>(null);

  // ─── Active loans ────────────────────────────────────────
  const [loanFilters, setLoanFilters] = useState<LoanFilters>({
    status: "all",
    search: "",
  });
  const [loanSortField, setLoanSortField] = useState<LoanSortField | null>(
    null
  );
  const [loanSortDirection, setLoanSortDirection] =
    useState<SortDirection>("asc");
  const [loanPage, setLoanPage] = useState(1);
  const [loanPageSize, setLoanPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ─── Fines ───────────────────────────────────────────────
  const [fineFilters, setFineFilters] = useState<FineFilters>({
    status: "all",
    search: "",
  });

  // ─── History ─────────────────────────────────────────────
  const [historyFilters, setHistoryFilters] = useState<TransactionFilters>({
    type: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ─── Dialogs/sheets ──────────────────────────────────────
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [renewLoan, setRenewLoan] = useState<Loan | null>(null);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [checkinLoan, setCheckinLoan] = useState<Loan | null>(null);
  const [isCheckinConfirmOpen, setIsCheckinConfirmOpen] = useState(false);

  // ─── Computed: stats ─────────────────────────────────────
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === "CHECKED_OUT"),
    [loans]
  );
  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === "OVERDUE"),
    [loans]
  );
  const returnsTodayCount = useMemo(
    () => loans.filter((l) => l.returnDate === TODAY).length,
    [loans]
  );
  const totalOutstandingFines = useMemo(
    () =>
      fines
        .filter((f) => f.status === "UNPAID")
        .reduce((sum, f) => sum + f.amount, 0),
    [fines]
  );

  // ─── Computed: filtered members ──────────────────────────
  const filteredMembers = useMemo(() => {
    if (!memberSearch) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // ─── Computed: filtered books ────────────────────────────
  const filteredBooks = useMemo(() => {
    if (!bookSearch) return books;
    const q = bookSearch.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [books, bookSearch]);

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
          l.memberName.toLowerCase().includes(q) ||
          l.memberNumber.toLowerCase().includes(q) ||
          l.bookISBN.toLowerCase().includes(q)
      );
    }

    // Sort
    if (loanSortField) {
      result = [...result].sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";
        switch (loanSortField) {
          case "bookTitle":
            aVal = a.bookTitle;
            bVal = b.bookTitle;
            break;
          case "memberName":
            aVal = a.memberName;
            bVal = b.memberName;
            break;
          case "checkoutDate":
            aVal = a.checkoutDate;
            bVal = b.checkoutDate;
            break;
          case "dueDate":
            aVal = a.dueDate;
            bVal = b.dueDate;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          case "fine":
            aVal = a.fine;
            bVal = b.fine;
            break;
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

  // ─── Computed: filtered fines ────────────────────────────
  const filteredFines = useMemo(() => {
    let result = [...fines];
    if (fineFilters.status !== "all") {
      result = result.filter((f) => f.status === fineFilters.status);
    }
    if (fineFilters.search) {
      const q = fineFilters.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.memberName.toLowerCase().includes(q) ||
          f.bookTitle.toLowerCase().includes(q) ||
          f.memberNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [fines, fineFilters]);

  // ─── Computed: filtered history ──────────────────────────
  const filteredHistory = useMemo(() => {
    let result = [...transactionLog].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (historyFilters.type !== "all") {
      result = result.filter((t) => t.type === historyFilters.type);
    }
    if (historyFilters.search) {
      const q = historyFilters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.bookTitle.toLowerCase().includes(q) ||
          t.memberName.toLowerCase().includes(q) ||
          t.memberNumber.toLowerCase().includes(q) ||
          t.details.toLowerCase().includes(q)
      );
    }
    if (historyFilters.dateFrom) {
      result = result.filter((t) => t.timestamp >= historyFilters.dateFrom);
    }
    if (historyFilters.dateTo) {
      result = result.filter(
        (t) => t.timestamp.slice(0, 10) <= historyFilters.dateTo
      );
    }
    return result;
  }, [transactionLog, historyFilters]);

  const totalFilteredHistory = filteredHistory.length;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistory.slice(start, start + historyPageSize);
  }, [filteredHistory, historyPage, historyPageSize]);

  // ─── Fine summary stats ──────────────────────────────────
  const fineSummary = useMemo(() => {
    const unpaid = fines
      .filter((f) => f.status === "UNPAID")
      .reduce((s, f) => s + f.amount, 0);
    const paid = fines
      .filter((f) => f.status === "PAID")
      .reduce((s, f) => s + f.amount, 0);
    const waived = fines
      .filter((f) => f.status === "WAIVED")
      .reduce((s, f) => s + f.amount, 0);
    return { unpaid, paid, waived };
  }, [fines]);

  // ─── Actions: checkout ───────────────────────────────────
  const addToQueue = useCallback(
    (book: CirculationBook) => {
      if (checkoutQueue.some((q) => q.bookId === book.id)) return;
      const dueDate = new Date(TODAY);
      dueDate.setDate(dueDate.getDate() + loanDays);
      setCheckoutQueue((prev) => [
        ...prev,
        {
          bookId: book.id,
          bookTitle: book.title,
          bookISBN: book.isbn,
          bookAuthor: book.author,
          dueDate: dueDate.toISOString().slice(0, 10),
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

  const processCheckout = useCallback(() => {
    if (!selectedMember || checkoutQueue.length === 0) return;

    const newLoans: Loan[] = checkoutQueue.map((item, i) => ({
      id: `l-new-${Date.now()}-${i}`,
      bookId: item.bookId,
      bookTitle: item.bookTitle,
      bookISBN: item.bookISBN,
      bookAuthor: item.bookAuthor,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNumber: selectedMember.memberNumber,
      checkoutDate: TODAY,
      dueDate: item.dueDate,
      returnDate: null,
      status: "CHECKED_OUT" as const,
      renewalCount: 0,
      maxRenewals: 2,
      fine: 0,
      notes: "",
      checkedOutBy: "Staff Admin",
    }));

    const newTransactions: TransactionLog[] = checkoutQueue.map((item, i) => ({
      id: `t-new-${Date.now()}-${i}`,
      type: "CHECKOUT" as const,
      loanId: newLoans[i].id,
      bookTitle: item.bookTitle,
      memberName: selectedMember.name,
      memberNumber: selectedMember.memberNumber,
      timestamp: new Date().toISOString(),
      processedBy: "Staff Admin",
      details: `Checked out for ${loanDays} days, due ${item.dueDate}`,
    }));

    setLoans((prev) => [...prev, ...newLoans]);
    setTransactionLog((prev) => [...newTransactions, ...prev]);

    // Mark books as unavailable
    setBooks((prev) =>
      prev.map((b) => {
        const queued = checkoutQueue.find((q) => q.bookId === b.id);
        if (queued) {
          const newAvailable = b.availableCopies - 1;
          return {
            ...b,
            availableCopies: newAvailable,
            available: newAvailable > 0,
          };
        }
        return b;
      })
    );

    // Clear workflow
    setCheckoutQueue([]);
    setSelectedMember(null);
    setMemberSearch("");
    setBookSearch("");

    return { count: newLoans.length, memberName: selectedMember.name };
  }, [selectedMember, checkoutQueue, loanDays]);

  // ─── Actions: check-in ───────────────────────────────────
  const searchForCheckin = useCallback(
    (query: string) => {
      setCheckinSearch(query);
      if (!query.trim()) {
        setDetectedLoan(null);
        return;
      }
      const q = query.toLowerCase();
      const found = loans.find(
        (l) =>
          (l.status === "CHECKED_OUT" || l.status === "OVERDUE") &&
          (l.bookISBN.toLowerCase().includes(q) ||
            l.bookTitle.toLowerCase().includes(q))
      );
      setDetectedLoan(found ?? null);
    },
    [loans]
  );

  const openCheckinConfirm = useCallback((loan: Loan) => {
    setCheckinLoan(loan);
    setIsCheckinConfirmOpen(true);
  }, []);

  const processCheckin = useCallback(
    (loan: Loan) => {
      const fine = calculateFine(loan.dueDate);

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? { ...l, status: "RETURNED" as const, returnDate: TODAY, fine }
            : l
        )
      );

      // Create fine record if overdue
      if (fine > 0) {
        const newFine: Fine = {
          id: `f-new-${Date.now()}`,
          loanId: loan.id,
          memberId: loan.memberId,
          memberName: loan.memberName,
          memberNumber: loan.memberNumber,
          bookTitle: loan.bookTitle,
          amount: fine,
          status: "UNPAID",
          reason: "Overdue",
          createdDate: TODAY,
          paidDate: null,
          waivedBy: null,
        };
        setFines((prev) => [...prev, newFine]);
      }

      // Add transaction log
      setTransactionLog((prev) => [
        {
          id: `t-new-${Date.now()}`,
          type: "CHECKIN" as const,
          loanId: loan.id,
          bookTitle: loan.bookTitle,
          memberName: loan.memberName,
          memberNumber: loan.memberNumber,
          timestamp: new Date().toISOString(),
          processedBy: "Staff Admin",
          details: fine > 0
            ? `Returned ${getDaysOverdue(loan.dueDate)} days late, fine of $${fine.toFixed(2)} applied`
            : "Returned on time, no fines",
        },
        ...prev,
      ]);

      // Update book availability
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id === loan.bookId) {
            return {
              ...b,
              availableCopies: b.availableCopies + 1,
              available: true,
            };
          }
          return b;
        })
      );

      // Clear check-in state
      setDetectedLoan(null);
      setCheckinSearch("");
      setIsCheckinConfirmOpen(false);
      setCheckinLoan(null);

      return { fine, bookTitle: loan.bookTitle };
    },
    []
  );

  // ─── Actions: renew ──────────────────────────────────────
  const openRenew = useCallback((loan: Loan) => {
    setRenewLoan(loan);
    setIsRenewOpen(true);
  }, []);

  const processRenewal = useCallback(
    (loan: Loan) => {
      const newDueDate = new Date(loan.dueDate);
      newDueDate.setDate(newDueDate.getDate() + loanDays);
      const newDueDateStr = newDueDate.toISOString().slice(0, 10);

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? {
                ...l,
                dueDate: newDueDateStr,
                renewalCount: l.renewalCount + 1,
                status: "CHECKED_OUT" as const,
                fine: 0,
              }
            : l
        )
      );

      setTransactionLog((prev) => [
        {
          id: `t-new-${Date.now()}`,
          type: "RENEWAL" as const,
          loanId: loan.id,
          bookTitle: loan.bookTitle,
          memberName: loan.memberName,
          memberNumber: loan.memberNumber,
          timestamp: new Date().toISOString(),
          processedBy: "Staff Admin",
          details: `Renewed for ${loanDays} days, new due date ${newDueDateStr} (renewal ${loan.renewalCount + 1} of ${loan.maxRenewals})`,
        },
        ...prev,
      ]);

      setIsRenewOpen(false);
      setRenewLoan(null);

      return { newDueDate: newDueDateStr, bookTitle: loan.bookTitle };
    },
    [loanDays]
  );

  // ─── Actions: fines ──────────────────────────────────────
  const payFine = useCallback((fineId: string) => {
    setFines((prev) =>
      prev.map((f) =>
        f.id === fineId ? { ...f, status: "PAID" as const, paidDate: TODAY } : f
      )
    );

    const fine = fines.find((f) => f.id === fineId);
    if (fine) {
      setTransactionLog((prev) => [
        {
          id: `t-new-${Date.now()}`,
          type: "FINE_PAID" as const,
          loanId: fine.loanId,
          bookTitle: fine.bookTitle,
          memberName: fine.memberName,
          memberNumber: fine.memberNumber,
          timestamp: new Date().toISOString(),
          processedBy: "Staff Admin",
          details: `Fine of $${fine.amount.toFixed(2)} paid`,
        },
        ...prev,
      ]);
    }

    return fine;
  }, [fines]);

  const waiveFine = useCallback((fineId: string) => {
    setFines((prev) =>
      prev.map((f) =>
        f.id === fineId
          ? { ...f, status: "WAIVED" as const, waivedBy: "Staff Admin" }
          : f
      )
    );

    const fine = fines.find((f) => f.id === fineId);
    if (fine) {
      setTransactionLog((prev) => [
        {
          id: `t-new-${Date.now()}`,
          type: "FINE_WAIVED" as const,
          loanId: fine.loanId,
          bookTitle: fine.bookTitle,
          memberName: fine.memberName,
          memberNumber: fine.memberNumber,
          timestamp: new Date().toISOString(),
          processedBy: "Staff Admin",
          details: `Fine of $${fine.amount.toFixed(2)} waived`,
        },
        ...prev,
      ]);
    }

    return fine;
  }, [fines]);

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

  // ─── Actions: pagination helpers ─────────────────────────
  const handleLoanPageSizeChange = useCallback((size: number) => {
    setLoanPageSize(size);
    setLoanPage(1);
  }, []);

  const handleHistoryPageSizeChange = useCallback((size: number) => {
    setHistoryPageSize(size);
    setHistoryPage(1);
  }, []);

  return {
    // Data
    loans,
    members,
    books,
    fines,
    transactionLog,

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
    setFineFilters,
    filteredFines,
    fineSummary,
    payFine,
    waiveFine,

    // History
    historyFilters,
    setHistoryFilters,
    paginatedHistory,
    totalFilteredHistory,
    historyPage,
    setHistoryPage,
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
  };
}
