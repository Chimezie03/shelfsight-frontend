import { apiFetch } from "@/lib/api";
import { CHART_COLORS, HEATMAP_DAYS, HEATMAP_HOURS } from "@/app/(dashboard)/reports/constants";
import type {
  DateRange,
  ReportsData,
  TimeSeriesPoint,
  RankedItem,
  CategorySlice,
  HeatmapCell,
  TopBorrower,
  FineTransaction,
  AgingBucket,
} from "@/app/(dashboard)/reports/types";

interface BackendBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  deweyDecimal: string | null;
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

const FINE_PER_DAY = 0.25;

type RangeBucket = { start: Date; end: Date; label: string };

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100);
}

function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isWithinRange(date: Date, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

function buildBuckets(range: DateRange): RangeBucket[] {
  const from = startOfDay(range.from);
  const to = endOfDay(range.to);
  const days = Math.max(diffDays(to, from) + 1, 1);
  const bucketCount = days <= 7 ? days : days <= 31 ? 8 : days <= 90 ? 10 : 12;
  const size = Math.max(1, Math.ceil(days / bucketCount));
  const buckets: RangeBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = new Date(from);
    start.setDate(start.getDate() + i * size);
    if (start > to) break;
    const end = new Date(start);
    end.setDate(end.getDate() + size - 1);
    if (end > to) end.setTime(to.getTime());

    const label = days <= 14
      ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : days <= 120
        ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : start.toLocaleDateString("en-US", { month: "short" });

    buckets.push({ start, end, label });
  }

  if (buckets.length === 0) {
    buckets.push({ start: from, end: to, label: from.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }

  return buckets;
}

function inBucket(date: Date, bucket: RangeBucket): boolean {
  return date >= bucket.start && date <= bucket.end;
}

function buildOverdueEstimate(loan: BackendLoan, now: Date): number {
  if (loan.returnedAt) return 0;
  const due = new Date(loan.dueDate);
  if (due >= now) return 0;
  const overdueDays = Math.max(1, diffDays(now, due));
  return round(overdueDays * FINE_PER_DAY);
}

function buildTrend(
  buckets: RangeBucket[],
  loans: BackendLoan[],
): TimeSeriesPoint[] {
  return buckets.map((bucket) => {
    let checkouts = 0;
    let returns = 0;

    for (const loan of loans) {
      const checkoutAt = new Date(loan.checkedOutAt);
      if (inBucket(checkoutAt, bucket)) checkouts++;

      if (loan.returnedAt) {
        const returnedAt = new Date(loan.returnedAt);
        if (inBucket(returnedAt, bucket)) returns++;
      }
    }

    return {
      date: bucket.start.toISOString(),
      label: bucket.label,
      checkouts,
      returns,
      renewals: 0,
      newBooks: 0,
      totalMembers: 0,
      newMembers: 0,
      overdueFines: 0,
      lostBookFees: 0,
    };
  });
}

function toDeweyDivisionLabel(value: string | null): string {
  if (!value) return "Unclassified";
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) return "Unclassified";
  const division = Math.min(900, Math.max(0, Math.floor(numeric / 100) * 100));
  return `${division}`;
}

function buildCategoryDistribution(books: BackendBook[]): CategorySlice[] {
  const byGenre = new Map<string, number>();
  for (const book of books) {
    const genre = book.genre || "General";
    byGenre.set(genre, (byGenre.get(genre) || 0) + 1);
  }

  const total = Math.max(1, books.length);
  const colors = [
    CHART_COLORS.navy,
    CHART_COLORS.copper,
    CHART_COLORS.sage,
    CHART_COLORS.amber,
    CHART_COLORS.purple,
    CHART_COLORS.teal,
    CHART_COLORS.brick,
  ];

  return Array.from(byGenre.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
      percentage: Math.round((value / total) * 100),
    }));
}

function groupTopBooks(loans: BackendLoan[]): RankedItem[] {
  const grouped = new Map<string, { title: string; author: string; count: number }>();

  for (const loan of loans) {
    const key = loan.bookCopy.book.id;
    const existing = grouped.get(key) || {
      title: loan.bookCopy.book.title,
      author: loan.bookCopy.book.author,
      count: 0,
    };
    existing.count++;
    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((book, index) => ({
      rank: index + 1,
      label: book.title,
      sublabel: book.author,
      value: book.count,
      valueLabel: "borrows",
      badge: undefined,
    }));
}

function buildPeakHours(loans: BackendLoan[], range: DateRange): HeatmapCell[] {
  const seeded = new Map<string, number>();
  for (const loan of loans) {
    const date = new Date(loan.checkedOutAt);
    if (!isWithinRange(date, range)) continue;
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    const key = `${day}|${hour}`;
    seeded.set(key, (seeded.get(key) || 0) + 1);
  }

  const rows: HeatmapCell[] = [];
  for (const day of HEATMAP_DAYS) {
    for (const hour of HEATMAP_HOURS) {
      rows.push({
        day,
        hour,
        value: seeded.get(`${day}|${hour}`) || 0,
      });
    }
  }
  return rows;
}

function previousRange(range: DateRange): DateRange {
  const spanMs = range.to.getTime() - range.from.getTime();
  const prevTo = new Date(range.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);
  return { from: prevFrom, to: prevTo, preset: "custom" };
}

function avgLoanDurationDays(loans: BackendLoan[]): number {
  const returned = loans.filter((loan) => loan.returnedAt);
  if (returned.length === 0) return 0;
  const total = returned.reduce((sum, loan) => {
    const start = new Date(loan.checkedOutAt);
    const end = new Date(loan.returnedAt as string);
    return sum + Math.max(0, diffDays(end, start));
  }, 0);
  return round(total / returned.length);
}

function buildOutstandingAging(loans: BackendLoan[], now: Date): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: "0-30 days", count: 0, amount: 0, color: CHART_COLORS.sage },
    { label: "31-60 days", count: 0, amount: 0, color: CHART_COLORS.amber },
    { label: "61-90 days", count: 0, amount: 0, color: CHART_COLORS.copper },
    { label: "90+ days", count: 0, amount: 0, color: CHART_COLORS.brick },
  ];

  for (const loan of loans) {
    if (loan.returnedAt) continue;
    const due = new Date(loan.dueDate);
    if (due >= now) continue;
    const days = Math.max(1, diffDays(now, due));
    const amount = buildOverdueEstimate(loan, now);
    const target =
      days <= 30 ? buckets[0] :
      days <= 60 ? buckets[1] :
      days <= 90 ? buckets[2] : buckets[3];
    target.count++;
    target.amount = round(target.amount + amount);
  }

  return buckets;
}

function makeRecentFineTransactions(
  loans: BackendLoan[],
  now: Date,
): FineTransaction[] {
  const rows: FineTransaction[] = [];

  for (const loan of loans) {
    if (loan.returnedAt && loan.fineAmount > 0) {
      rows.push({
        id: `payment-${loan.id}`,
        date: new Date(loan.returnedAt).toISOString().slice(0, 10),
        memberName: loan.user.name,
        memberNumber: loan.user.email,
        amount: loan.fineAmount,
        type: "payment",
        reason: "Overdue return",
      });
      continue;
    }

    if (!loan.returnedAt) {
      const estimated = buildOverdueEstimate(loan, now);
      if (estimated > 0) {
        rows.push({
          id: `assessment-${loan.id}`,
          date: new Date(loan.dueDate).toISOString().slice(0, 10),
          memberName: loan.user.name,
          memberNumber: loan.user.email,
          amount: estimated,
          type: "assessment",
          reason: "Current overdue balance",
        });
      }
    }
  }

  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}

export async function fetchReportsData(range: DateRange): Promise<ReportsData> {
  const [booksRes, usersRes, loansRes] = await Promise.all([
    apiFetch<BackendBooksResponse>("/books?limit=100"),
    apiFetch<{ data: BackendUser[]; pagination: { total: number } }>("/users?limit=100"),
    apiFetch<BackendLoansResponse>("/loans?limit=100"),
  ]);

  const books = booksRes.data;
  const users = usersRes.data;
  const loans = loansRes.data;
  const now = new Date();
  const prevRange = previousRange(range);

  const loansInRange = loans.filter((loan) => isWithinRange(new Date(loan.checkedOutAt), range));
  const prevLoansInRange = loans.filter((loan) => isWithinRange(new Date(loan.checkedOutAt), prevRange));
  const returnsInRange = loans.filter((loan) => loan.returnedAt && isWithinRange(new Date(loan.returnedAt), range));
  const prevReturnsInRange = loans.filter((loan) => loan.returnedAt && isWithinRange(new Date(loan.returnedAt), prevRange));

  const totalCirculation = loansInRange.length;
  const prevTotalCirculation = prevLoansInRange.length;
  const avgDuration = avgLoanDurationDays(returnsInRange);
  const prevAvgDuration = avgLoanDurationDays(prevReturnsInRange);
  const totalCollected = round(returnsInRange.reduce((sum, loan) => sum + loan.fineAmount, 0));
  const prevCollected = round(prevReturnsInRange.reduce((sum, loan) => sum + loan.fineAmount, 0));

  const activeLoanNow = loans.filter((loan) => !loan.returnedAt);
  const overdueNow = activeLoanNow.filter((loan) => new Date(loan.dueDate) < now);
  const dueThisWeek = activeLoanNow.filter((loan) => {
    const due = new Date(loan.dueDate);
    const days = diffDays(due, startOfDay(now));
    return days >= 0 && days <= 7;
  });
  const dueThisWeekMembers = new Set(dueThisWeek.map((loan) => loan.user.id)).size;

  const overdueDays = overdueNow.map((loan) => Math.max(1, diffDays(now, new Date(loan.dueDate))));
  const avgOverdueDays = overdueDays.length > 0 ? round(overdueDays.reduce((a, b) => a + b, 0) / overdueDays.length) : 0;

  const checkouts = totalCirculation;
  const returns = returnsInRange.length;
  const returnRate = checkouts > 0 ? round((returns / checkouts) * 100) : 0;
  const prevReturnRate = prevLoansInRange.length > 0
    ? round((prevReturnsInRange.length / prevLoansInRange.length) * 100)
    : 0;

  const trendBuckets = buildBuckets(range);
  const circulationTrend = buildTrend(trendBuckets, loans);

  const acquisitionTrend = circulationTrend.map((point, index) => {
    const bucket = trendBuckets[index];
    const newBooks = books.filter((book) => inBucket(new Date(book.createdAt), bucket)).length;
    return { ...point, newBooks };
  });

  const memberGrowthTrend = circulationTrend.map((point, index) => {
    const bucket = trendBuckets[index];
    const newMembers = users.filter((user) => inBucket(new Date(user.createdAt), bucket)).length;
    const totalMembers = users.filter((user) => new Date(user.createdAt) <= bucket.end).length;
    return { ...point, newMembers, totalMembers };
  });

  const revenueTrend = circulationTrend.map((point, index) => {
    const bucket = trendBuckets[index];
    const overdueFines = returnsInRange
      .filter((loan) => inBucket(new Date(loan.returnedAt as string), bucket))
      .reduce((sum, loan) => sum + loan.fineAmount, 0);
    return { ...point, overdueFines: round(overdueFines), lostBookFees: 0 };
  });

  const categoryDistribution = buildCategoryDistribution(books);
  const deweyMap = new Map<string, number>();
  for (const book of books) {
    const label = toDeweyDivisionLabel(book.deweyDecimal);
    deweyMap.set(label, (deweyMap.get(label) || 0) + 1);
  }
  const deweyDistribution: RankedItem[] = Array.from(deweyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      rank: index + 1,
      label,
      sublabel: "Dewey division",
      value,
      valueLabel: "titles",
    }));

  const topBooks = groupTopBooks(loansInRange);

  const byUser = new Map<string, { name: string; memberNumber: string; borrows: number; current: number; outstanding: number }>();
  for (const loan of loansInRange) {
    const key = loan.user.id;
    const existing = byUser.get(key) || {
      name: loan.user.name,
      memberNumber: loan.user.email,
      borrows: 0,
      current: 0,
      outstanding: 0,
    };
    existing.borrows++;
    byUser.set(key, existing);
  }
  for (const loan of activeLoanNow) {
    const existing = byUser.get(loan.user.id) || {
      name: loan.user.name,
      memberNumber: loan.user.email,
      borrows: 0,
      current: 0,
      outstanding: 0,
    };
    existing.current++;
    existing.outstanding += buildOverdueEstimate(loan, now);
    byUser.set(loan.user.id, existing);
  }

  const topBorrowers: TopBorrower[] = Array.from(byUser.values())
    .sort((a, b) => b.borrows - a.borrows)
    .slice(0, 10)
    .map((user, index) => ({
      rank: index + 1,
      name: user.name,
      memberNumber: user.memberNumber,
      booksBorrowed: user.borrows,
      currentLoans: user.current,
      fineStatus: user.outstanding > 0 ? "outstanding" : "clear",
      fineAmount: round(user.outstanding),
    }));

  const borrowersInRange = new Set(loansInRange.map((loan) => loan.user.id)).size;
  const activeBorrowerPct = users.length > 0 ? round((borrowersInRange / users.length) * 100) : 0;

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const newThisMonth = users.filter((u) => new Date(u.createdAt) >= currentMonthStart).length;
  const newLastMonth = users.filter((u) => {
    const created = new Date(u.createdAt);
    return created >= prevMonthStart && created < currentMonthStart;
  }).length;

  const outstandingByAge = buildOutstandingAging(loans, now);
  const totalOutstanding = round(outstandingByAge.reduce((sum, bucket) => sum + bucket.amount, 0));
  const recentTransactions = makeRecentFineTransactions(loans, now);

  const paymentCount = recentTransactions.filter((tx) => tx.type === "payment").length;
  const assessmentCount = recentTransactions.filter((tx) => tx.type === "assessment").length;
  const waiverCount = recentTransactions.filter((tx) => tx.type === "waiver").length;
  const paymentMethods: CategorySlice[] = [
    { name: "Card", value: paymentCount, color: CHART_COLORS.navy, percentage: 0 },
    { name: "Cash", value: 0, color: CHART_COLORS.copper, percentage: 0 },
    { name: "Online", value: assessmentCount, color: CHART_COLORS.sage, percentage: 0 },
    { name: "Waived", value: waiverCount, color: CHART_COLORS.amber, percentage: 0 },
  ];
  const totalPaymentMethod = Math.max(1, paymentMethods.reduce((sum, item) => sum + item.value, 0));
  for (const method of paymentMethods) {
    method.percentage = Math.round((method.value / totalPaymentMethod) * 100);
  }

  const turnoverByCategory: TimeSeriesPoint[] = categoryDistribution.map((category) => {
    const booksForCategory = books.filter((book) => (book.genre || "General") === category.name);
    const circulating = booksForCategory.reduce((sum, book) => sum + Math.max(0, book.totalCopies - book.availableCopies), 0);
    const available = booksForCategory.reduce((sum, book) => sum + book.availableCopies, 0);
    return {
      date: "",
      label: category.name,
      available,
      circulating,
    };
  });

  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const checkedOutCopies = Math.max(0, totalCopies - availableCopies);
  const collectionHealth: CategorySlice[] = [
    {
      name: "Available",
      value: availableCopies,
      color: CHART_COLORS.sage,
      percentage: totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0,
    },
    {
      name: "Checked Out",
      value: checkedOutCopies,
      color: CHART_COLORS.amber,
      percentage: totalCopies > 0 ? Math.round((checkedOutCopies / totalCopies) * 100) : 0,
    },
    {
      name: "Maintenance",
      value: 0,
      color: CHART_COLORS.brick,
      percentage: 0,
    },
  ];

  const engagementRate = activeBorrowerPct;
  const alerts = [];
  if (overdueNow.length > 0) {
    alerts.push({
      severity: "warning" as const,
      message: `${overdueNow.length} items are currently overdue`,
      metric: "overdue",
    });
  }
  if (totalOutstanding > 0) {
    alerts.push({
      severity: "info" as const,
      message: `Outstanding estimated balances: $${totalOutstanding.toFixed(2)}`,
      metric: "fines",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      severity: "info" as const,
      message: "No overdue or outstanding balances in the selected window",
      metric: "status",
    });
  }

  const avgFineAmount = paymentCount > 0
    ? round(recentTransactions.filter((tx) => tx.type === "payment").reduce((sum, tx) => sum + tx.amount, 0) / paymentCount)
    : 0;

  const mostActive = topBorrowers[0];

  return {
    overview: {
      kpis: [
        {
          label: "Total Circulation",
          value: totalCirculation,
          formattedValue: totalCirculation.toLocaleString(),
          change: percentChange(totalCirculation, prevTotalCirculation),
          changeLabel: "from last period",
          trend: totalCirculation >= prevTotalCirculation ? "up" : "down",
          sparklineData: circulationTrend.map((point) => Number(point.checkouts || 0)),
          accentColor: "navy",
        },
        {
          label: "Active Members",
          value: users.length,
          formattedValue: users.length.toLocaleString(),
          change: 0,
          changeLabel: "current total",
          trend: "flat",
          sparklineData: memberGrowthTrend.map((point) => Number(point.totalMembers || 0)),
          accentColor: "copper",
        },
        {
          label: "Avg. Loan Duration",
          value: avgDuration,
          formattedValue: `${avgDuration}d`,
          change: percentChange(avgDuration, prevAvgDuration),
          changeLabel: "from last period",
          trend: avgDuration <= prevAvgDuration ? "up" : "down",
          sparklineData: returnsInRange.slice(0, 8).map((loan) => {
            const returnedAt = new Date(loan.returnedAt as string);
            return Math.max(0, diffDays(returnedAt, new Date(loan.checkedOutAt)));
          }),
          accentColor: "amber",
        },
        {
          label: "Fines Collected",
          value: totalCollected,
          formattedValue: `$${totalCollected.toFixed(2)}`,
          change: percentChange(totalCollected, prevCollected),
          changeLabel: "from last period",
          trend: totalCollected >= prevCollected ? "up" : "down",
          sparklineData: revenueTrend.map((point) => Number(point.overdueFines || 0)),
          accentColor: "sage",
        },
      ],
      alerts,
      circulationTrend,
      topBooks: topBooks.slice(0, 5),
      collectionHealth,
      engagementRate,
      revenuePeriod: {
        value: totalCollected,
        change: percentChange(totalCollected, prevCollected),
        sparkline: revenueTrend.map((point) => Number(point.overdueFines || 0)),
      },
    },
    circulation: {
      trends: circulationTrend,
      topBooks,
      overdueBreakdown: categoryDistribution.slice(0, 6),
      peakHours: buildPeakHours(loans, range),
      dueThisWeek: dueThisWeek.length,
      dueThisWeekMembers,
      currentlyOverdue: overdueNow.length,
      avgOverdueDays,
      returnRate,
      returnRateChange: percentChange(returnRate, prevReturnRate),
    },
    collection: {
      categoryDistribution,
      deweyDistribution,
      acquisitionTrend,
      turnoverByCategory,
      totalTitles: books.length,
      newAcquisitions: books.filter((book) => isWithinRange(new Date(book.createdAt), range)).length,
      avgTurnoverRate: totalCopies > 0 ? round(checkouts / totalCopies) : 0,
    },
    members: {
      growthTrend: memberGrowthTrend,
      typeBreakdown: [
        { name: "Active", value: users.length, color: CHART_COLORS.sage, percentage: 100 },
        { name: "Expired", value: 0, color: CHART_COLORS.amber, percentage: 0 },
        { name: "Suspended", value: 0, color: CHART_COLORS.brick, percentage: 0 },
      ],
      topBorrowers,
      newThisMonth,
      newThisMonthChange: percentChange(newThisMonth, newLastMonth),
      activeBorrowerPct,
      avgBooksPerMember: users.length > 0 ? round(totalCirculation / users.length) : 0,
      suspendedAccounts: 0,
      mostActiveName: mostActive?.name || "N/A",
      mostActiveCount: mostActive?.booksBorrowed || 0,
    },
    financial: {
      revenueTrend,
      outstandingByAge,
      paymentMethods,
      recentTransactions,
      totalCollected,
      totalCollectedChange: percentChange(totalCollected, prevCollected),
      totalOutstanding,
      collectionRate: totalCollected + totalOutstanding > 0
        ? round((totalCollected / (totalCollected + totalOutstanding)) * 100)
        : 100,
      avgFineAmount,
    },
  };
}
