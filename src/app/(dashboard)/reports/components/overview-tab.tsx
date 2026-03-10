"use client";

import {
  BookOpen,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Info,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import { KpiCard } from "./kpi-card";
import { ChartCard } from "./chart-card";
import { CustomTooltip } from "./custom-tooltip";
import { CHART_COLORS } from "../constants";
import type { OverviewData } from "../types";

interface OverviewTabProps {
  data: OverviewData;
  isLoading: boolean;
}

const KPI_ICONS = [
  <BookOpen key="book" className="w-5 h-5 text-brand-navy" />,
  <Users key="users" className="w-5 h-5 text-brand-copper" />,
  <Clock key="clock" className="w-5 h-5 text-brand-amber" />,
  <DollarSign key="dollar" className="w-5 h-5 text-brand-sage" />,
];

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    bgClass: "bg-brand-brick/8",
    textClass: "text-brand-brick",
    badgeVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-brand-amber/8",
    textClass: "text-brand-amber",
    badgeVariant: "secondary" as const,
  },
  info: {
    icon: Info,
    bgClass: "bg-brand-navy/8",
    textClass: "text-brand-navy",
    badgeVariant: "outline" as const,
  },
};

export function OverviewTab({ data, isLoading }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.formattedValue}
            numericValue={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            trend={kpi.trend}
            sparklineData={kpi.sparklineData}
            icon={KPI_ICONS[i]}
            accentColor={kpi.accentColor}
            isLoading={isLoading}
            index={i}
          />
        ))}
      </div>

      {/* Alerts Banner */}
      {data.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="border-brand-amber/20 bg-brand-amber/[0.03]">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                {data.alerts.map((alert, i) => {
                  const config = SEVERITY_CONFIG[alert.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgClass}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.textClass}`} />
                      <span className="text-[12px] font-medium text-foreground">
                        {alert.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Circulation Trend"
          description="Check-outs and returns over the selected period"
          className="lg:col-span-2"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.circulationTrend}>
              <defs>
                <linearGradient id="gradCheckouts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.navy} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.navy} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.copper} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="checkouts"
                stroke={CHART_COLORS.navy}
                strokeWidth={2}
                fill="url(#gradCheckouts)"
                dot={{ r: 3, fill: CHART_COLORS.navy }}
              />
              <Area
                type="monotone"
                dataKey="returns"
                stroke={CHART_COLORS.copper}
                strokeWidth={2}
                fill="url(#gradReturns)"
                dot={{ r: 3, fill: CHART_COLORS.copper }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top Books"
          description="Most borrowed this period"
          isLoading={isLoading}
          action={<Award className="w-4 h-4 text-brand-amber" />}
        >
          <div className="space-y-4">
            {data.topBooks.slice(0, 5).map((book, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-navy/8 text-brand-navy text-[11px] font-semibold">
                      {book.rank}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium">{book.label}</p>
                      <p className="text-[11px] text-muted-foreground">{book.sublabel}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="text-[13px] font-semibold text-brand-copper">{book.value}</p>
                  <p className="text-[10px] text-muted-foreground">{book.valueLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Bottom summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Collection Health Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Collection Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.collectionHealth}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="var(--background)"
                      >
                        {data.collectionHealth.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {data.collectionHealth.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] text-muted-foreground">{item.name}</span>
                      <span className="text-[11px] font-medium ml-auto">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.48 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Member Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-display font-semibold text-brand-navy">
                  {data.engagementRate}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">of members actively borrowing</p>
                <Progress
                  value={data.engagementRate}
                  className="mt-3 h-2 [&>div]:bg-brand-sage"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue This Period */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.56 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Revenue This Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-semibold text-brand-copper">
                ${data.revenuePeriod.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {data.revenuePeriod.change >= 0 ? "+" : ""}
                {data.revenuePeriod.change}% from last period
              </p>
              <div className="h-8 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenuePeriod.sparkline.map((v, i) => ({ v, i }))}>
                    <defs>
                      <linearGradient id="revSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.copper} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={CHART_COLORS.copper}
                      strokeWidth={1.5}
                      fill="url(#revSpark)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
