export type PresetRange = "today" | "7d" | "30d" | "90d" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  preset: PresetRange;
}

export interface KpiData {
  label: string;
  value: number;
  formattedValue: string;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "flat";
  sparklineData: number[];
  accentColor: "navy" | "copper" | "sage" | "amber" | "brick";
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  [key: string]: string | number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface RankedItem {
  rank: number;
  label: string;
  sublabel: string;
  value: number;
  valueLabel: string;
  badge?: string;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
  color: string;
}

export interface FineTransaction {
  id: string;
  date: string;
  memberName: string;
  memberNumber: string;
  amount: number;
  type: "payment" | "waiver" | "assessment";
  reason: string;
}

export interface AlertItem {
  severity: "warning" | "info" | "critical";
  message: string;
  metric?: string;
}

export interface TopBorrower {
  rank: number;
  name: string;
  memberNumber: string;
  booksBorrowed: number;
  currentLoans: number;
  fineStatus: "clear" | "outstanding";
  fineAmount: number;
}

export interface OverviewData {
  kpis: KpiData[];
  alerts: AlertItem[];
  circulationTrend: TimeSeriesPoint[];
  topBooks: RankedItem[];
  collectionHealth: CategorySlice[];
  engagementRate: number;
  revenuePeriod: { value: number; change: number; sparkline: number[] };
}

export interface CirculationData {
  trends: TimeSeriesPoint[];
  topBooks: RankedItem[];
  overdueBreakdown: CategorySlice[];
  peakHours: HeatmapCell[];
  dueThisWeek: number;
  dueThisWeekMembers: number;
  currentlyOverdue: number;
  avgOverdueDays: number;
  returnRate: number;
  returnRateChange: number;
}

export interface CollectionData {
  categoryDistribution: CategorySlice[];
  deweyDistribution: RankedItem[];
  acquisitionTrend: TimeSeriesPoint[];
  turnoverByCategory: TimeSeriesPoint[];
  totalTitles: number;
  newAcquisitions: number;
  avgTurnoverRate: number;
}

export interface MembersData {
  growthTrend: TimeSeriesPoint[];
  typeBreakdown: CategorySlice[];
  topBorrowers: TopBorrower[];
  newThisMonth: number;
  newThisMonthChange: number;
  activeBorrowerPct: number;
  avgBooksPerMember: number;
  suspendedAccounts: number;
  mostActiveName: string;
  mostActiveCount: number;
}

export interface FinancialData {
  revenueTrend: TimeSeriesPoint[];
  outstandingByAge: AgingBucket[];
  paymentMethods: CategorySlice[];
  recentTransactions: FineTransaction[];
  totalCollected: number;
  totalCollectedChange: number;
  totalOutstanding: number;
  collectionRate: number;
  avgFineAmount: number;
}

export interface ReportsData {
  overview: OverviewData;
  circulation: CirculationData;
  collection: CollectionData;
  members: MembersData;
  financial: FinancialData;
}
