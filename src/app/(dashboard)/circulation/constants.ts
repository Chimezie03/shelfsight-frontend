export const LOAN_PERIOD_OPTIONS = [7, 14, 21, 28, 30] as const;
export const DEFAULT_LOAN_DAYS = 14;
export const MAX_RENEWALS = 2;
export const DAILY_FINE_RATE = 0.25;
export const MAX_FINE_PER_ITEM = 25.0;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const LOAN_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "CHECKED_OUT", label: "Active" },
  { value: "OVERDUE", label: "Overdue" },
] as const;

export const FINE_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PAID", label: "Paid" },
  { value: "WAIVED", label: "Waived" },
] as const;

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "CHECKOUT", label: "Check-Out" },
  { value: "CHECKIN", label: "Check-In" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "FINE_PAID", label: "Fine Paid" },
  { value: "FINE_WAIVED", label: "Fine Waived" },
] as const;
