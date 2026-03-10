import { CHART_COLORS } from "./constants";
import type {
  AdminDashboardData,
  StaffDashboardData,
  PatronDashboardData,
  DashboardKpi,
  ActivityItem,
  AiInsight,
  PopularBook,
  CirculationTrendPoint,
  CollectionCategory,
  StaffTask,
  PendingReturn,
  PatronLoan,
  PatronRecommendation,
  Announcement,
  ReadingActivityPoint,
  CirculationRangePreset,
} from "./types";

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
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

function generateSparkline(rng: () => number, base: number, variance: number, points = 8): number[] {
  return Array.from({ length: points }, () => base + (rng() - 0.5) * 2 * variance);
}

function generateCirculationTrend(range: CirculationRangePreset, rng: () => number): CirculationTrendPoint[] {
  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().split("T")[0],
      label: `${months[d.getMonth()]} ${d.getDate()}`,
      checkouts: randBetween(rng, 8, 28),
      returns: randBetween(rng, 6, 24),
    };
  });
}

export function generateAdminData(range: CirculationRangePreset = "7d"): AdminDashboardData {
  const rng = seededRandom("admin-dashboard-2026");

  const kpis: DashboardKpi[] = [
    {
      label: "Total Books",
      value: "2,847",
      numericValue: 2847,
      change: 3.2,
      changeLabel: "vs last month",
      trend: "up",
      sparklineData: generateSparkline(rng, 2800, 60),
      accentColor: "navy",
      icon: "BookOpen",
    },
    {
      label: "Active Members",
      value: "342",
      numericValue: 342,
      change: 5.1,
      changeLabel: "vs last month",
      trend: "up",
      sparklineData: generateSparkline(rng, 330, 20),
      accentColor: "sage",
      icon: "Users",
    },
    {
      label: "Checked Out",
      value: "127",
      numericValue: 127,
      change: -2.4,
      changeLabel: "vs last week",
      trend: "down",
      sparklineData: generateSparkline(rng, 130, 15),
      accentColor: "amber",
      icon: "Clock",
    },
    {
      label: "Overdue Items",
      value: "8",
      numericValue: 8,
      change: -12.5,
      changeLabel: "vs last week",
      trend: "down",
      sparklineData: generateSparkline(rng, 10, 4),
      accentColor: "brick",
      icon: "AlertCircle",
    },
  ];

  const rngTrend = seededRandom(`admin-trend-${range}`);
  const circulationTrend = generateCirculationTrend(range, rngTrend);

  const collectionHealth: CollectionCategory[] = [
    { name: "Fiction", count: 892, color: CHART_COLORS.navy, percentage: 31, capacity: 94 },
    { name: "Non-Fiction", count: 634, color: CHART_COLORS.copper, percentage: 22, capacity: 72 },
    { name: "Science", count: 421, color: CHART_COLORS.sage, percentage: 15, capacity: 68 },
    { name: "History", count: 356, color: CHART_COLORS.amber, percentage: 13, capacity: 81 },
    { name: "Children's", count: 298, color: CHART_COLORS.purple, percentage: 10, capacity: 55 },
    { name: "Reference", count: 246, color: CHART_COLORS.teal, percentage: 9, capacity: 43 },
  ];

  const activityFeed: ActivityItem[] = [
    { id: "a1", action: "Book added via AI", title: "The Great Gatsby", time: "5 min ago", status: "success" },
    { id: "a2", action: "Check-out", title: "To Kill a Mockingbird", subtitle: "Jane Doe", time: "12 min ago", status: "info" },
    { id: "a3", action: "AI Classification", title: "Sapiens: A Brief History", time: "18 min ago", status: "pending" },
    { id: "a4", action: "Check-in", title: "1984", subtitle: "Bob Chen", time: "25 min ago", status: "success" },
    { id: "a5", action: "Shelf reorganization", title: "Section C — History", time: "1 hour ago", status: "success" },
    { id: "a6", action: "New member registered", title: "Maria Santos", time: "1.5 hours ago", status: "info" },
    { id: "a7", action: "Overdue notice sent", title: "The Alchemist", subtitle: "Alex Kim", time: "2 hours ago", status: "warning" },
  ];

  const aiInsights: AiInsight[] = [
    {
      id: "i1",
      title: "Shelf capacity warning",
      description: "Section B (Fiction) is at 94% capacity. Consider redistribution to adjacent sections.",
      priority: "high",
      actionLabel: "View Shelf",
      actionHref: "/map",
    },
    {
      id: "i2",
      title: "Misplaced items detected",
      description: "3 Science books found in History section (D-4). AI confidence: 97%.",
      priority: "medium",
      actionLabel: "View Details",
      actionHref: "/catalog",
    },
    {
      id: "i3",
      title: "Optimize organization",
      description: "Philosophy books span 3 sections. Consolidating could improve patron findability by ~23%.",
      priority: "low",
      actionLabel: "Review",
      actionHref: "/map",
    },
  ];

  const popularBooks: PopularBook[] = [
    { rank: 1, title: "Project Hail Mary", author: "Andy Weir", checkouts: 14, trend: "up" },
    { rank: 2, title: "Atomic Habits", author: "James Clear", checkouts: 12, trend: "flat" },
    { rank: 3, title: "Dune", author: "Frank Herbert", checkouts: 11, trend: "up" },
    { rank: 4, title: "The Midnight Library", author: "Matt Haig", checkouts: 9, trend: "down" },
    { rank: 5, title: "Educated", author: "Tara Westover", checkouts: 8, trend: "up" },
  ];

  return {
    kpis,
    circulationTrend,
    collectionHealth,
    activityFeed,
    aiInsights,
    popularBooks,
    overdueCount: 8,
    overdueFinesTotal: 24.5,
  };
}

export function generateStaffData(): StaffDashboardData {
  const rng = seededRandom("staff-dashboard-2026");

  const kpis: DashboardKpi[] = [
    {
      label: "My Check-outs Today",
      value: "14",
      numericValue: 14,
      change: 8.3,
      changeLabel: "vs yesterday",
      trend: "up",
      sparklineData: generateSparkline(rng, 12, 4),
      accentColor: "navy",
      icon: "Clock",
    },
    {
      label: "Pending Returns",
      value: "23",
      numericValue: 23,
      change: -4.2,
      changeLabel: "vs yesterday",
      trend: "down",
      sparklineData: generateSparkline(rng, 25, 5),
      accentColor: "amber",
      icon: "Library",
    },
    {
      label: "Items to Shelve",
      value: "9",
      numericValue: 9,
      change: 12.5,
      changeLabel: "vs yesterday",
      trend: "up",
      sparklineData: generateSparkline(rng, 8, 3),
      accentColor: "sage",
      icon: "BookOpen",
    },
    {
      label: "Overdue Notices",
      value: "3",
      numericValue: 3,
      change: -25.0,
      changeLabel: "vs yesterday",
      trend: "down",
      sparklineData: generateSparkline(rng, 4, 2),
      accentColor: "brick",
      icon: "AlertCircle",
    },
  ];

  const tasks: StaffTask[] = [
    { id: "t1", task: "Process returns bin", status: "done", time: "9:00 AM" },
    { id: "t2", task: "Shelve Science section cart", status: "done", time: "10:30 AM" },
    { id: "t3", task: "Assist with AI book ingestion batch", status: "in-progress", time: "11:00 AM" },
    { id: "t4", task: "Inventory check — Section D", status: "pending", time: "2:00 PM" },
    { id: "t5", task: "Close circulation desk", status: "pending", time: "5:00 PM" },
  ];

  const circulationFeed: ActivityItem[] = [
    { id: "cf1", action: "Check-out", title: "Dune", subtitle: "Jane Doe", time: "10 min ago", status: "info" },
    { id: "cf2", action: "Return", title: "Atomic Habits", subtitle: "John Smith", time: "22 min ago", status: "success" },
    { id: "cf3", action: "Renewal", title: "Educated", subtitle: "Alice Lee", time: "35 min ago", status: "info" },
    { id: "cf4", action: "Check-out", title: "Project Hail Mary", subtitle: "Bob Chen", time: "1 hr ago", status: "info" },
    { id: "cf5", action: "Return", title: "Sapiens", subtitle: "Maria Santos", time: "1.5 hrs ago", status: "success" },
  ];

  const pendingReturns: PendingReturn[] = [
    { id: "pr1", bookTitle: "The Alchemist", patronName: "Alex Kim", dueDate: "Mar 10, 2026", isOverdue: true },
    { id: "pr2", bookTitle: "Thinking, Fast and Slow", patronName: "Sarah Lin", dueDate: "Mar 10, 2026", isOverdue: false },
    { id: "pr3", bookTitle: "Brave New World", patronName: "David Park", dueDate: "Mar 10, 2026", isOverdue: false },
    { id: "pr4", bookTitle: "Fahrenheit 451", patronName: "Emma Jones", dueDate: "Mar 11, 2026", isOverdue: false },
  ];

  return {
    kpis,
    tasks,
    circulationFeed,
    pendingReturns,
    shiftProgress: { completed: 2, total: 5 },
  };
}

export function generatePatronData(): PatronDashboardData {
  const rng = seededRandom("patron-dashboard-2026");

  const kpis: DashboardKpi[] = [
    {
      label: "Books Borrowed",
      value: "3",
      numericValue: 3,
      change: 0,
      changeLabel: "this month",
      trend: "flat",
      sparklineData: generateSparkline(rng, 3, 1),
      accentColor: "navy",
      icon: "BookMarked",
    },
    {
      label: "Due Soon",
      value: "1",
      numericValue: 1,
      change: 0,
      changeLabel: "within 5 days",
      trend: "flat",
      sparklineData: generateSparkline(rng, 1, 1),
      accentColor: "amber",
      icon: "CalendarClock",
    },
    {
      label: "Overdue",
      value: "1",
      numericValue: 1,
      change: 100,
      changeLabel: "vs last month",
      trend: "up",
      sparklineData: generateSparkline(rng, 0.5, 0.5),
      accentColor: "brick",
      icon: "AlertCircle",
    },
    {
      label: "Books Read",
      value: "27",
      numericValue: 27,
      change: 12.5,
      changeLabel: "vs last year",
      trend: "up",
      sparklineData: generateSparkline(rng, 24, 5),
      accentColor: "sage",
      icon: "Star",
    },
  ];

  const currentLoans: PatronLoan[] = [
    { id: "l1", title: "Dune", author: "Frank Herbert", coverColor: CHART_COLORS.navy, dueDate: "Mar 22, 2026", daysLeft: 12, status: "on-time", progress: 40 },
    { id: "l2", title: "Atomic Habits", author: "James Clear", coverColor: CHART_COLORS.copper, dueDate: "Mar 15, 2026", daysLeft: 5, status: "due-soon", progress: 75 },
    { id: "l3", title: "The Alchemist", author: "Paulo Coelho", coverColor: CHART_COLORS.sage, dueDate: "Mar 7, 2026", daysLeft: -3, status: "overdue", progress: 100 },
  ];

  const readingActivity: ReadingActivityPoint[] = [
    { month: "Oct", books: 3 },
    { month: "Nov", books: 5 },
    { month: "Dec", books: 2 },
    { month: "Jan", books: 4 },
    { month: "Feb", books: 6 },
    { month: "Mar", books: 2 },
  ];

  const recommendations: PatronRecommendation[] = [
    { id: "r1", title: "Project Hail Mary", author: "Andy Weir", reason: "Because you enjoyed Dune", coverColor: CHART_COLORS.amber },
    { id: "r2", title: "Sapiens", author: "Yuval Noah Harari", reason: "Popular in Non-Fiction", coverColor: CHART_COLORS.sage },
    { id: "r3", title: "The Midnight Library", author: "Matt Haig", reason: "Trending this month", coverColor: CHART_COLORS.purple },
  ];

  const announcements: Announcement[] = [
    { id: "an1", title: "New Arrivals: March 2026", body: "42 new titles added to Fiction, Science, and Children's sections.", date: "Mar 8, 2026", type: "new-arrival" },
    { id: "an2", title: "Spring Reading Challenge", body: "Read 5 books this month and earn a ShelfSight badge!", date: "Mar 1, 2026", type: "event" },
    { id: "an3", title: "Extended Hours", body: "Library now open until 9 PM on weekdays starting March 15.", date: "Feb 28, 2026", type: "hours" },
  ];

  return {
    kpis,
    currentLoans,
    readingActivity,
    recommendations,
    fineSummary: { totalOwed: 4.5, itemCount: 1, oldestDate: "Mar 7, 2026" },
    announcements,
    readingGoal: { target: 36, current: 27, year: 2026 },
  };
}
