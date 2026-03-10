export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
] as const;

export const CHART_COLORS = {
  navy: "#1B2A4A",
  copper: "#C4956A",
  sage: "#3D8B7A",
  amber: "#D4A026",
  brick: "#C4454D",
  purple: "#8B6BB5",
  teal: "#5EADBD",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.navy,
  CHART_COLORS.copper,
  CHART_COLORS.sage,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.brick,
];

export const EXPORT_FORMATS = [
  { value: "csv", label: "Export as CSV" },
  { value: "print", label: "Print Report" },
] as const;

export const TAB_CONFIG = [
  { value: "overview", label: "Overview" },
  { value: "circulation", label: "Circulation" },
  { value: "collection", label: "Collection" },
  { value: "members", label: "Members" },
  { value: "financial", label: "Financial" },
] as const;

export const HEATMAP_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
export const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ACCENT_COLOR_MAP: Record<string, string> = {
  navy: "brand-navy",
  copper: "brand-copper",
  sage: "brand-sage",
  amber: "brand-amber",
  brick: "brand-brick",
};

export const ACCENT_HEX_MAP: Record<string, string> = {
  navy: CHART_COLORS.navy,
  copper: CHART_COLORS.copper,
  sage: CHART_COLORS.sage,
  amber: CHART_COLORS.amber,
  brick: CHART_COLORS.brick,
};
