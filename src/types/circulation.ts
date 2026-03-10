export type LoanStatus = "CHECKED_OUT" | "OVERDUE" | "RETURNED" | "LOST";
export type FineStatus = "UNPAID" | "PAID" | "WAIVED";
export type TransactionType =
  | "CHECKOUT"
  | "CHECKIN"
  | "RENEWAL"
  | "FINE_PAID"
  | "FINE_WAIVED";

export interface CirculationMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberNumber: string;
  status: "active" | "suspended" | "expired";
  activeLoans: number;
  maxLoans: number;
  totalFinesOwed: number;
}

export interface CirculationBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  copies: number;
  availableCopies: number;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookISBN: string;
  bookAuthor: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  renewalCount: number;
  maxRenewals: number;
  fine: number;
  notes: string;
  checkedOutBy: string;
}

export interface Fine {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  bookTitle: string;
  amount: number;
  status: FineStatus;
  reason: string;
  createdDate: string;
  paidDate: string | null;
  waivedBy: string | null;
}

export interface CheckoutQueueItem {
  bookId: string;
  bookTitle: string;
  bookISBN: string;
  bookAuthor: string;
  dueDate: string;
}

export interface TransactionLog {
  id: string;
  type: TransactionType;
  loanId: string;
  bookTitle: string;
  memberName: string;
  memberNumber: string;
  timestamp: string;
  processedBy: string;
  details: string;
}

export type LoanSortField =
  | "bookTitle"
  | "memberName"
  | "checkoutDate"
  | "dueDate"
  | "status"
  | "fine";
export type SortDirection = "asc" | "desc";

export interface LoanFilters {
  status: string;
  search: string;
}

export interface FineFilters {
  status: string;
  search: string;
}

export interface TransactionFilters {
  type: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}
