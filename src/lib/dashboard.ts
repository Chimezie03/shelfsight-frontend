import { apiFetch } from "@/lib/api";
import { CHART_COLORS } from "@/app/(dashboard)/reports/constants";
import type {
  DashboardKpi,
  ActivityItem,
  PopularBook,
  CirculationTrendPoint,
  CollectionCategory,
  PatronLoan,
  PendingReturn,
  FineSummary,
  ReadingActivityPoint,
  AdminDashboardData,
  StaffDashboardData,
  PatronDashboardData,
  CirculationRangePreset,
} from "@/app/(dashboard)/dashboard/types";

/* ── Backend response types ─────────────────────────────────────────── */

interface BackendBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  deweyDecimal: string | null;
  coverImageUrl: string | null;
  availableCopies: number;
  totalCopies: number;
  createdAt: string;
}

interface BackendBooksResponse {
  data: BackendBook[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface BackendLoan {
  id: string;
  user: { id: string; name: string; email: string };
  bookCopy: {
    id: string;
    barcode: string;
    book: { id: string; title: string; author: string };
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

/* ── Utility helpers ────────────────────────────────────────────────── */

const GENRE_COLORS: Record<string, string> = {
  Fiction: CHART_COLORS.navy,
  "Non-Fiction": CHART_COLORS.copper,
  Science: CHART_COLORS.sage,
  History: CHART_COLORS.amber,
  Children: CHART_COLORS.purple,
  Reference: CHART_COLORS.teal,
};

function flatSparkline(value: number): number[] {
  return Array(8).fill(value);
}

function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMin = Math.floor((now - then) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
}

const COVER_COLORS = [
  CHART_COLORS.navy,
  CHART_COLORS.copper,
  CHART_COLORS.sage,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.brick,
];

/* ── KPI builders ───────────────────────────────────────────────────── */

function buildAdminKpis(
  totalBooks: number,
  memberCount: number,
  activeCount: number,
  overdueCount: number,
): DashboardKpi[] {
  return [
    {
      label: "Total Books",
      value: totalBooks.toLocaleString(),
      numericValue: totalBooks,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(totalBooks),
      accentColor: "navy",
      icon: "BookOpen",
    },
    {
      label: "Active Members",
      value: memberCount.toLocaleString(),
      numericValue: memberCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(memberCount),
      accentColor: "copper",
      icon: "Users",
    },
    {
      label: "Checked Out",
      value: activeCount.toLocaleString(),
      numericValue: activeCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(activeCount),
      accentColor: "sage",
      icon: "ArrowUpRight",
    },
    {
      label: "Overdue Items",
      value: overdueCount.toLocaleString(),
      numericValue: overdueCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(overdueCount),
      accentColor: "brick",
      icon: "AlertTriangle",
    },
  ];
}

function buildStaffKpis(activeCount: number, overdueCount: number): DashboardKpi[] {
  return [
    {
      label: "My Check-outs Today",
      value: "0",
      numericValue: 0,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(0),
      accentColor: "navy",
      icon: "BookOpen",
    },
    {
      label: "Pending Returns",
      value: activeCount.toLocaleString(),
      numericValue: activeCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(activeCount),
      accentColor: "copper",
      icon: "RotateCcw",
    },
    {
      label: "Items to Shelve",
      value: "0",
      numericValue: 0,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(0),
      accentColor: "sage",
      icon: "Package",
    },
    {
      label: "Overdue Notices",
      value: overdueCount.toLocaleString(),
      numericValue: overdueCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(overdueCount),
      accentColor: "brick",
      icon: "AlertTriangle",
    },
  ];
}

function buildPatronKpis(
  activeCount: number,
  dueSoonCount: number,
  overdueCount: number,
  returnedCount: number,
): DashboardKpi[] {
  return [
    {
      label: "Books Borrowed",
      value: activeCount.toLocaleString(),
      numericValue: activeCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(activeCount),
      accentColor: "navy",
      icon: "BookOpen",
    },
    {
      label: "Due Soon",
      value: dueSoonCount.toLocaleString(),
      numericValue: dueSoonCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(dueSoonCount),
      accentColor: "amber",
      icon: "Clock",
    },
    {
      label: "Overdue",
      value: overdueCount.toLocaleString(),
      numericValue: overdueCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(overdueCount),
      accentColor: "brick",
      icon: "AlertTriangle",
    },
    {
      label: "Books Read",
      value: returnedCount.toLocaleString(),
      numericValue: returnedCount,
      change: 0,
      changeLabel: "—",
      trend: "flat",
      sparklineData: flatSparkline(returnedCount),
      accentColor: "sage",
      icon: "CheckCircle",
    },
  ];
}

/* ── Transform builders ─────────────────────────────────────────────── */

function buildCirculationTrend(
  allLoans: BackendLoan[],
  range: CirculationRangePreset,
): CirculationTrendPoint[] {
  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const points: CirculationTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    points.push({ date: key, label, checkouts: 0, returns: 0 });
  }

  const pointMap = new Map(points.map((p) => [p.date, p]));

  for (const loan of allLoans) {
    const checkoutKey = dateKey(loan.checkedOutAt);
    const point = pointMap.get(checkoutKey);
    if (point) point.checkouts++;

    if (loan.returnedAt) {
      const returnKey = dateKey(loan.returnedAt);
      const rPoint = pointMap.get(returnKey);
      if (rPoint) rPoint.returns++;
    }
  }

  return points;
}

function buildCollectionHealth(books: BackendBook[]): CollectionCategory[] {
  const genreMap = new Map<string, { count: number; checkedOut: number; total: number }>();

  for (const book of books) {
    const genre = book.genre || "General";
    const entry = genreMap.get(genre) || { count: 0, checkedOut: 0, total: 0 };
    entry.count++;
    entry.checkedOut += book.totalCopies - book.availableCopies;
    entry.total += book.totalCopies;
    genreMap.set(genre, entry);
  }

  const totalBooks = books.length || 1;
  const colorKeys = Object.keys(GENRE_COLORS);

  return Array.from(genreMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([name, data], i) => ({
      name,
      count: data.count,
      color: GENRE_COLORS[name] || COVER_COLORS[i % COVER_COLORS.length] || colorKeys[i] || CHART_COLORS.navy,
      percentage: Math.round((data.count / totalBooks) * 100),
      capacity: data.total > 0 ? Math.round((data.checkedOut / data.total) * 100) : 0,
    }));
}

function buildActivityFeed(loans: BackendLoan[]): ActivityItem[] {
  return loans.slice(0, 7).map((loan) => {
    if (loan.returnedAt) {
      return {
        id: loan.id,
        action: "Check-in",
        title: `${loan.bookCopy.book.title} returned`,
        subtitle: `by ${loan.user.name}`,
        time: relativeTime(loan.returnedAt),
        status: "success" as const,
      };
    }
    if (loan.isOverdue) {
      return {
        id: loan.id,
        action: "Overdue",
        title: `${loan.bookCopy.book.title} overdue`,
        subtitle: `by ${loan.user.name}`,
        time: relativeTime(loan.dueDate),
        status: "warning" as const,
      };
    }
    return {
      id: loan.id,
      action: "Check-out",
      title: `${loan.bookCopy.book.title} checked out`,
      subtitle: `by ${loan.user.name}`,
      time: relativeTime(loan.checkedOutAt),
      status: "info" as const,
    };
  });
}

function buildPopularBooks(activeLoans: BackendLoan[]): PopularBook[] {
  const counts = new Map<string, { title: string; author: string; count: number }>();

  for (const loan of activeLoans) {
    const title = loan.bookCopy.book.title;
    const entry = counts.get(title) || { title, author: loan.bookCopy.book.author, count: 0 };
    entry.count++;
    counts.set(title, entry);
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((entry, i) => ({
      rank: i + 1,
      title: entry.title,
      author: entry.author,
      checkouts: entry.count,
      trend: "flat" as const,
    }));
}

function buildPatronLoans(loans: BackendLoan[]): PatronLoan[] {
  return loans.map((loan, i) => {
    const left = daysFromNow(loan.dueDate);
    const checkoutDate = new Date(loan.checkedOutAt).getTime();
    const dueDate = new Date(loan.dueDate).getTime();
    const totalDays = Math.max((dueDate - checkoutDate) / (1000 * 60 * 60 * 24), 1);
    const elapsed = (Date.now() - checkoutDate) / (1000 * 60 * 60 * 24);
    const progress = Math.min(Math.round((elapsed / totalDays) * 100), 100);

    let status: PatronLoan["status"] = "on-time";
    if (left < 0) status = "overdue";
    else if (left <= 5) status = "due-soon";

    return {
      id: loan.id,
      title: loan.bookCopy.book.title,
      author: loan.bookCopy.book.author,
      coverColor: COVER_COLORS[i % COVER_COLORS.length],
      dueDate: new Date(loan.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      daysLeft: left,
      status,
      progress,
    };
  });
}

function buildFineSummary(overdueLoans: BackendLoan[]): FineSummary | null {
  const withFines = overdueLoans.filter((l) => l.fineAmount > 0);
  if (withFines.length === 0) return null;

  const totalOwed = withFines.reduce((sum, l) => sum + l.fineAmount, 0);
  const oldestDate = withFines
    .map((l) => l.dueDate)
    .sort()[0];

  return {
    totalOwed: Math.round(totalOwed * 100) / 100,
    itemCount: withFines.length,
    oldestDate: new Date(oldestDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function buildReadingActivity(returnedLoans: BackendLoan[]): ReadingActivityPoint[] {
  const now = new Date();
  const months: ReadingActivityPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: monthLabel(d.toISOString()), books: 0 });
  }

  for (const loan of returnedLoans) {
    if (!loan.returnedAt) continue;
    const label = monthLabel(loan.returnedAt);
    const point = months.find((m) => m.month === label);
    if (point) point.books++;
  }

  return months;
}

function buildStaffPendingReturns(activeLoans: BackendLoan[]): PendingReturn[] {
  return activeLoans
    .filter((loan) => {
      const left = daysFromNow(loan.dueDate);
      return left <= 2;
    })
    .slice(0, 10)
    .map((loan) => ({
      id: loan.id,
      bookTitle: loan.bookCopy.book.title,
      patronName: loan.user.name,
      dueDate: new Date(loan.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      isOverdue: loan.isOverdue,
    }));
}

/* ── Main fetch functions ───────────────────────────────────────────── */

export interface AdminFetchResult {
  data: AdminDashboardData;
  rawLoans: BackendLoan[];
}

export async function fetchAdminDashboard(
  circulationRange: CirculationRangePreset,
): Promise<AdminFetchResult> {
  const [booksRes, usersRes, activeRes, overdueRes, recentRes, allBooksRes, allActiveRes, allReturnedRes] =
    await Promise.all([
      apiFetch<BackendBooksResponse>("/books?limit=1"),
      apiFetch<{ data: BackendUser[]; pagination: { total: number } }>("/users?limit=1"),
      apiFetch<BackendLoansResponse>("/loans?status=active&limit=1"),
      apiFetch<BackendLoansResponse>("/loans?status=overdue&limit=100"),
      apiFetch<BackendLoansResponse>("/loans?limit=7"),
      apiFetch<BackendBooksResponse>("/books?limit=100"),
      apiFetch<BackendLoansResponse>("/loans?status=active&limit=100"),
      apiFetch<BackendLoansResponse>("/loans?status=returned&limit=100"),
    ]);

  const allLoans = [...allActiveRes.data, ...allReturnedRes.data];

  const totalBooks = booksRes.pagination.total;
  const memberCount = usersRes.pagination.total;
  const activeCount = activeRes.pagination.total;
  const overdueCount = overdueRes.pagination.total;
  const overdueFinesTotal = Math.round(
    overdueRes.data.reduce((sum, l) => sum + l.fineAmount, 0) * 100
  ) / 100;

  return {
    data: {
      kpis: buildAdminKpis(totalBooks, memberCount, activeCount, overdueCount),
      circulationTrend: buildCirculationTrend(allLoans, circulationRange),
      collectionHealth: buildCollectionHealth(allBooksRes.data),
      activityFeed: buildActivityFeed(recentRes.data),
      aiInsights: [],
      popularBooks: buildPopularBooks(allActiveRes.data),
      overdueCount,
      overdueFinesTotal,
    },
    rawLoans: allLoans,
  };
}

export async function fetchStaffDashboard(): Promise<StaffDashboardData> {
  const [activeRes, overdueRes, recentRes, allActiveRes] = await Promise.all([
    apiFetch<BackendLoansResponse>("/loans?status=active&limit=1"),
    apiFetch<BackendLoansResponse>("/loans?status=overdue&limit=1"),
    apiFetch<BackendLoansResponse>("/loans?limit=5"),
    apiFetch<BackendLoansResponse>("/loans?status=active&limit=50"),
  ]);

  const activeCount = activeRes.pagination.total;
  const overdueCount = overdueRes.pagination.total;

  return {
    kpis: buildStaffKpis(activeCount, overdueCount),
    tasks: [],
    circulationFeed: buildActivityFeed(recentRes.data),
    pendingReturns: buildStaffPendingReturns(allActiveRes.data),
    shiftProgress: { completed: 0, total: 0 },
  };
}

export async function fetchPatronDashboard(userId: string): Promise<PatronDashboardData> {
  const [activeRes, overdueRes, returnedRes] = await Promise.all([
    apiFetch<BackendLoansResponse>(`/loans?status=active&userId=${userId}&limit=100`),
    apiFetch<BackendLoansResponse>(`/loans?status=overdue&userId=${userId}&limit=100`),
    apiFetch<BackendLoansResponse>(`/loans?status=returned&userId=${userId}&limit=100`),
  ]);

  const activeLoans = activeRes.data;
  const overdueLoans = overdueRes.data;
  const returnedLoans = returnedRes.data;
  const dueSoonCount = activeLoans.filter((l) => {
    const left = daysFromNow(l.dueDate);
    return left >= 0 && left <= 5;
  }).length;

  return {
    kpis: buildPatronKpis(activeLoans.length, dueSoonCount, overdueLoans.length, returnedLoans.length),
    currentLoans: buildPatronLoans(activeLoans),
    readingActivity: buildReadingActivity(returnedLoans),
    recommendations: [],
    fineSummary: buildFineSummary(overdueLoans),
    announcements: [],
    readingGoal: { target: 0, current: returnedLoans.length, year: new Date().getFullYear() },
  };
}

export { buildCirculationTrend };
export type { BackendLoan };
