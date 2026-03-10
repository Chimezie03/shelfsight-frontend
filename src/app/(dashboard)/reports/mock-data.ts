import { subDays, format, differenceInDays } from "date-fns";
import type {
  ReportsData,
  DateRange,
  TimeSeriesPoint,
  CategorySlice,
  RankedItem,
  HeatmapCell,
  AgingBucket,
  FineTransaction,
  AlertItem,
  KpiData,
  TopBorrower,
} from "./types";
import { CHART_COLORS, HEATMAP_DAYS, HEATMAP_HOURS } from "./constants";

// Deterministic pseudo-random based on seed string
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 10000) / 10000;
  };
}

function randBetween(rng: () => number, min: number, max: number): number {
  return Math.round(min + rng() * (max - min));
}

function generateMonthlyTimeSeries(
  dateRange: DateRange,
  keys: Record<string, [number, number]>,
  seed: string
): TimeSeriesPoint[] {
  const rng = seededRandom(seed);
  const days = Math.max(differenceInDays(dateRange.to, dateRange.from), 1);
  const points: TimeSeriesPoint[] = [];

  // Generate ~7-12 points depending on range
  const numPoints = days <= 7 ? 7 : days <= 30 ? 6 : days <= 90 ? 7 : 12;

  for (let i = 0; i < numPoints; i++) {
    const dayOffset = Math.round((i / (numPoints - 1)) * days);
    const d = subDays(dateRange.to, days - dayOffset);
    const point: TimeSeriesPoint = {
      date: d.toISOString(),
      label: days <= 7 ? format(d, "EEE") : days <= 90 ? format(d, "MMM d") : format(d, "MMM"),
    };
    for (const [key, [min, max]] of Object.entries(keys)) {
      point[key] = randBetween(rng, min, max);
    }
    points.push(point);
  }
  return points;
}

const CATEGORIES: { name: string; color: string }[] = [
  { name: "Fiction", color: CHART_COLORS.navy },
  { name: "Non-Fiction", color: CHART_COLORS.copper },
  { name: "Science", color: CHART_COLORS.sage },
  { name: "History", color: CHART_COLORS.amber },
  { name: "Biography", color: CHART_COLORS.purple },
  { name: "Children", color: CHART_COLORS.teal },
];

const TOP_BOOKS_DATA = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", cat: "Fiction" },
  { title: "Sapiens", author: "Yuval Noah Harari", cat: "Non-Fiction" },
  { title: "1984", author: "George Orwell", cat: "Fiction" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", cat: "Fiction" },
  { title: "A Brief History of Time", author: "Stephen Hawking", cat: "Science" },
  { title: "Educated", author: "Tara Westover", cat: "Biography" },
  { title: "Becoming", author: "Michelle Obama", cat: "Biography" },
  { title: "The Alchemist", author: "Paulo Coelho", cat: "Fiction" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", cat: "Non-Fiction" },
  { title: "Atomic Habits", author: "James Clear", cat: "Non-Fiction" },
];

const MEMBER_NAMES = [
  { name: "Emily Davis", num: "M-1042" },
  { name: "James Wilson", num: "M-1187" },
  { name: "Sarah Chen", num: "M-0893" },
  { name: "Michael Torres", num: "M-1305" },
  { name: "Rachel Kim", num: "M-0756" },
  { name: "David Patel", num: "M-1420" },
  { name: "Lisa Johnson", num: "M-0612" },
  { name: "Robert Martinez", num: "M-1089" },
  { name: "Amanda White", num: "M-0934" },
  { name: "Chris Thompson", num: "M-1256" },
];

const DEWEY_DIVISIONS = [
  { label: "000 - Computer Science", sublabel: "Generalities" },
  { label: "100 - Philosophy", sublabel: "Psychology" },
  { label: "200 - Religion", sublabel: "Theology" },
  { label: "300 - Social Sciences", sublabel: "Education, Law" },
  { label: "400 - Language", sublabel: "Linguistics" },
  { label: "500 - Natural Sciences", sublabel: "Mathematics" },
  { label: "600 - Technology", sublabel: "Applied Sciences" },
  { label: "700 - Arts", sublabel: "Recreation" },
  { label: "800 - Literature", sublabel: "Rhetoric" },
  { label: "900 - History", sublabel: "Geography" },
];

export function generateReportsData(dateRange: DateRange): ReportsData {
  const rng = seededRandom(format(dateRange.from, "yyyyMMdd") + format(dateRange.to, "yyyyMMdd"));
  const days = Math.max(differenceInDays(dateRange.to, dateRange.from), 1);
  const scale = Math.max(days / 30, 0.5); // scale numbers relative to 30-day baseline

  // ── Overview ──
  const overviewKpis: KpiData[] = [
    {
      label: "Total Circulation",
      value: randBetween(rng, Math.round(1800 * scale), Math.round(2400 * scale)),
      formattedValue: "",
      change: +(rng() * 16 - 4).toFixed(1),
      changeLabel: "from last period",
      trend: "up",
      sparklineData: Array.from({ length: 7 }, () => randBetween(rng, 40, 80)),
      accentColor: "navy",
    },
    {
      label: "Active Members",
      value: randBetween(rng, 310, 380),
      formattedValue: "",
      change: +(rng() * 8 - 2).toFixed(1),
      changeLabel: "from last period",
      trend: "up",
      sparklineData: Array.from({ length: 7 }, () => randBetween(rng, 300, 370)),
      accentColor: "copper",
    },
    {
      label: "Avg. Loan Duration",
      value: +(8 + rng() * 4).toFixed(1),
      formattedValue: "",
      change: +(rng() * 3 - 1.5).toFixed(1),
      changeLabel: "from last period",
      trend: "down",
      sparklineData: Array.from({ length: 7 }, () => +(8 + rng() * 4).toFixed(1)),
      accentColor: "amber",
    },
    {
      label: "Fines Collected",
      value: randBetween(rng, Math.round(100 * scale), Math.round(200 * scale)),
      formattedValue: "",
      change: +(rng() * 12 - 3).toFixed(1),
      changeLabel: "from last period",
      trend: "up",
      sparklineData: Array.from({ length: 7 }, () => randBetween(rng, 15, 35)),
      accentColor: "sage",
    },
  ];

  // Format values after generation
  overviewKpis[0].formattedValue = overviewKpis[0].value.toLocaleString();
  overviewKpis[1].formattedValue = overviewKpis[1].value.toLocaleString();
  overviewKpis[2].formattedValue = `${overviewKpis[2].value}d`;
  overviewKpis[3].formattedValue = `$${overviewKpis[3].value}`;

  overviewKpis.forEach((kpi) => {
    kpi.trend = kpi.change >= 0 ? "up" : "down";
  });

  const alerts: AlertItem[] = [
    { severity: "critical", message: `${randBetween(rng, 5, 12)} books overdue by 5+ days`, metric: "overdue" },
    { severity: "warning", message: `Shelf A-1 at ${randBetween(rng, 90, 98)}% capacity`, metric: "capacity" },
    { severity: "info", message: `${randBetween(rng, 2, 5)} member accounts suspended`, metric: "accounts" },
  ];

  const circulationTrend = generateMonthlyTimeSeries(dateRange, {
    checkouts: [220, 340],
    returns: [210, 330],
  }, "circ-overview");

  const topBooks: RankedItem[] = TOP_BOOKS_DATA.map((b, i) => ({
    rank: i + 1,
    label: b.title,
    sublabel: b.author,
    value: randBetween(rng, 20, 50) - i * 2,
    valueLabel: "borrows",
    badge: b.cat,
  }));

  const collectionHealth: CategorySlice[] = [
    { name: "Available", value: randBetween(rng, 2100, 2400), color: CHART_COLORS.sage, percentage: 0 },
    { name: "Checked Out", value: randBetween(rng, 300, 500), color: CHART_COLORS.amber, percentage: 0 },
    { name: "Maintenance", value: randBetween(rng, 30, 80), color: CHART_COLORS.brick, percentage: 0 },
  ];
  const totalHealth = collectionHealth.reduce((s, c) => s + c.value, 0);
  collectionHealth.forEach((c) => (c.percentage = Math.round((c.value / totalHealth) * 100)));

  const engagementRate = randBetween(rng, 62, 78);
  const revenuePeriod = {
    value: overviewKpis[3].value,
    change: overviewKpis[3].change,
    sparkline: overviewKpis[3].sparklineData,
  };

  // ── Circulation ──
  const circulationTrends = generateMonthlyTimeSeries(dateRange, {
    checkouts: [220, 340],
    returns: [210, 330],
    renewals: [30, 80],
  }, "circ-trends");

  const overdueBreakdown: CategorySlice[] = CATEGORIES.map((c) => {
    const val = randBetween(rng, 2, 18);
    return { name: c.name, value: val, color: c.color, percentage: 0 };
  });
  const totalOverdue = overdueBreakdown.reduce((s, c) => s + c.value, 0);
  overdueBreakdown.forEach((c) => (c.percentage = Math.round((c.value / totalOverdue) * 100)));

  const peakHours: HeatmapCell[] = [];
  for (const day of HEATMAP_DAYS) {
    for (const hour of HEATMAP_HOURS) {
      const isWeekend = day === "Sat" || day === "Sun";
      const isPeakHour = hour >= 10 && hour <= 14;
      const base = isWeekend ? 5 : isPeakHour ? 30 : 15;
      peakHours.push({ day, hour, value: randBetween(rng, Math.max(1, base - 10), base + 15) });
    }
  }

  const dueThisWeek = randBetween(rng, 35, 65);
  const currentlyOverdue = totalOverdue;
  const avgOverdueDays = +(2 + rng() * 6).toFixed(1);
  const returnRate = +(94 + rng() * 5).toFixed(1);
  const returnRateChange = +(rng() * 2 - 0.5).toFixed(1);

  // ── Collection ──
  const categoryDistribution: CategorySlice[] = CATEGORIES.map((c) => {
    const val = randBetween(rng, 250, 900);
    return { name: c.name, value: val, color: c.color, percentage: 0 };
  });
  const totalCat = categoryDistribution.reduce((s, c) => s + c.value, 0);
  categoryDistribution.forEach((c) => (c.percentage = Math.round((c.value / totalCat) * 100)));

  const deweyDistribution: RankedItem[] = DEWEY_DIVISIONS.map((d, i) => ({
    rank: i + 1,
    label: d.label,
    sublabel: d.sublabel,
    value: randBetween(rng, 80, 450),
    valueLabel: "titles",
  })).sort((a, b) => b.value - a.value);

  const acquisitionTrend = generateMonthlyTimeSeries(dateRange, {
    newBooks: [8, 35],
  }, "acq-trend");

  const turnoverByCategory: TimeSeriesPoint[] = CATEGORIES.map((c) => ({
    date: "",
    label: c.name,
    available: randBetween(rng, 150, 700),
    circulating: randBetween(rng, 30, 200),
  }));

  const totalTitles = categoryDistribution.reduce((s, c) => s + c.value, 0);

  // ── Members ──
  const growthTrend = generateMonthlyTimeSeries(dateRange, {
    totalMembers: [310, 380],
    newMembers: [5, 20],
  }, "member-growth");

  const typeBreakdown: CategorySlice[] = [
    { name: "Active", value: randBetween(rng, 280, 340), color: CHART_COLORS.sage, percentage: 0 },
    { name: "Expired", value: randBetween(rng, 20, 45), color: CHART_COLORS.amber, percentage: 0 },
    { name: "Suspended", value: randBetween(rng, 2, 8), color: CHART_COLORS.brick, percentage: 0 },
  ];
  const totalType = typeBreakdown.reduce((s, c) => s + c.value, 0);
  typeBreakdown.forEach((c) => (c.percentage = Math.round((c.value / totalType) * 100)));

  const topBorrowers: TopBorrower[] = MEMBER_NAMES.map((m, i) => ({
    rank: i + 1,
    name: m.name,
    memberNumber: m.num,
    booksBorrowed: randBetween(rng, 15, 65) - i * 3,
    currentLoans: randBetween(rng, 0, 5),
    fineStatus: rng() > 0.7 ? "outstanding" as const : "clear" as const,
    fineAmount: rng() > 0.7 ? +(rng() * 12).toFixed(2) : 0,
  })).sort((a, b) => b.booksBorrowed - a.booksBorrowed);

  const activePct = randBetween(rng, 65, 82);

  // ── Financial ──
  const revenueTrend = generateMonthlyTimeSeries(dateRange, {
    overdueFines: [60, 160],
    lostBookFees: [10, 50],
  }, "fin-revenue");

  const outstandingByAge: AgingBucket[] = [
    { label: "0–30 days", count: randBetween(rng, 15, 35), amount: +(rng() * 80 + 20).toFixed(2), color: CHART_COLORS.sage },
    { label: "31–60 days", count: randBetween(rng, 8, 20), amount: +(rng() * 120 + 40).toFixed(2), color: CHART_COLORS.amber },
    { label: "61–90 days", count: randBetween(rng, 3, 12), amount: +(rng() * 100 + 30).toFixed(2), color: CHART_COLORS.copper },
    { label: "90+ days", count: randBetween(rng, 1, 6), amount: +(rng() * 150 + 50).toFixed(2), color: CHART_COLORS.brick },
  ];

  const paymentMethods: CategorySlice[] = [
    { name: "Card", value: randBetween(rng, 40, 55), color: CHART_COLORS.navy, percentage: 0 },
    { name: "Cash", value: randBetween(rng, 15, 30), color: CHART_COLORS.copper, percentage: 0 },
    { name: "Online", value: randBetween(rng, 10, 25), color: CHART_COLORS.sage, percentage: 0 },
    { name: "Waived", value: randBetween(rng, 5, 15), color: CHART_COLORS.amber, percentage: 0 },
  ];
  const totalPay = paymentMethods.reduce((s, c) => s + c.value, 0);
  paymentMethods.forEach((c) => (c.percentage = Math.round((c.value / totalPay) * 100)));

  const fineReasons = ["Overdue return", "Lost book", "Damaged item", "Late renewal", "Missing pages"];
  const recentTransactions: FineTransaction[] = Array.from({ length: 15 }, (_, i) => {
    const member = MEMBER_NAMES[randBetween(rng, 0, MEMBER_NAMES.length - 1)];
    const typeRoll = rng();
    return {
      id: `FT-${1000 + i}`,
      date: format(subDays(dateRange.to, randBetween(rng, 0, Math.min(days, 60))), "yyyy-MM-dd"),
      memberName: member.name,
      memberNumber: member.num,
      amount: +(rng() * 20 + 0.5).toFixed(2),
      type: (typeRoll < 0.5 ? "payment" : typeRoll < 0.8 ? "assessment" : "waiver") as "payment" | "waiver" | "assessment",
      reason: fineReasons[randBetween(rng, 0, fineReasons.length - 1)],
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalCollected = randBetween(rng, Math.round(120 * scale), Math.round(250 * scale));
  const totalOutstanding = outstandingByAge.reduce((s, b) => s + b.amount, 0);

  return {
    overview: {
      kpis: overviewKpis,
      alerts,
      circulationTrend,
      topBooks: topBooks.slice(0, 5),
      collectionHealth,
      engagementRate,
      revenuePeriod,
    },
    circulation: {
      trends: circulationTrends,
      topBooks: topBooks.slice(0, 10),
      overdueBreakdown,
      peakHours,
      dueThisWeek,
      dueThisWeekMembers: randBetween(rng, 20, 40),
      currentlyOverdue,
      avgOverdueDays,
      returnRate,
      returnRateChange,
    },
    collection: {
      categoryDistribution,
      deweyDistribution,
      acquisitionTrend,
      turnoverByCategory,
      totalTitles,
      newAcquisitions: randBetween(rng, 12, 40),
      avgTurnoverRate: +(1 + rng() * 3).toFixed(1),
    },
    members: {
      growthTrend,
      typeBreakdown,
      topBorrowers,
      newThisMonth: randBetween(rng, 6, 20),
      newThisMonthChange: +(rng() * 30 - 10).toFixed(1),
      activeBorrowerPct: activePct,
      avgBooksPerMember: +(5 + rng() * 6).toFixed(1),
      suspendedAccounts: typeBreakdown[2].value,
      mostActiveName: topBorrowers[0].name,
      mostActiveCount: topBorrowers[0].booksBorrowed,
    },
    financial: {
      revenueTrend,
      outstandingByAge,
      paymentMethods,
      recentTransactions,
      totalCollected,
      totalCollectedChange: +(rng() * 14 - 3).toFixed(1),
      totalOutstanding: +totalOutstanding.toFixed(2),
      collectionRate: +(75 + rng() * 20).toFixed(1),
      avgFineAmount: +(2 + rng() * 8).toFixed(2),
    },
  };
}
