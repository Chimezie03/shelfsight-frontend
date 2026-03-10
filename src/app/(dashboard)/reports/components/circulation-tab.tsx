"use client";

import { Calendar, Clock, TrendingUp, Award } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { KpiCard } from "./kpi-card";
import { ChartCard } from "./chart-card";
import { CustomTooltip } from "./custom-tooltip";
import { PeakHoursHeatmap } from "./peak-hours-heatmap";
import { CHART_COLORS } from "../constants";
import type { CirculationData } from "../types";

interface CirculationTabProps {
  data: CirculationData;
  isLoading: boolean;
}

export function CirculationTab({ data, isLoading }: CirculationTabProps) {
  const totalOverdue = data.overdueBreakdown.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Due This Week"
          value={`${data.dueThisWeek}`}
          numericValue={data.dueThisWeek}
          change={0}
          changeLabel={`across ${data.dueThisWeekMembers} members`}
          trend="flat"
          sparklineData={[]}
          icon={<Calendar className="w-5 h-5 text-brand-navy" />}
          accentColor="navy"
          isLoading={isLoading}
          index={0}
        />
        <KpiCard
          label="Currently Overdue"
          value={`${data.currentlyOverdue}`}
          numericValue={data.currentlyOverdue}
          change={0}
          changeLabel={`avg. ${data.avgOverdueDays} days overdue`}
          trend="flat"
          sparklineData={[]}
          icon={<Clock className="w-5 h-5 text-brand-amber" />}
          accentColor="amber"
          isLoading={isLoading}
          index={1}
        />
        <KpiCard
          label="Return Rate"
          value={`${data.returnRate}%`}
          numericValue={data.returnRate}
          change={data.returnRateChange}
          changeLabel="from last period"
          trend={data.returnRateChange >= 0 ? "up" : "down"}
          sparklineData={[]}
          icon={<TrendingUp className="w-5 h-5 text-brand-sage" />}
          accentColor="sage"
          isLoading={isLoading}
          index={2}
        />
      </div>

      {/* Trends + Overdue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Circulation Trends"
          description="Check-outs, returns, and renewals"
          className="lg:col-span-2"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="gcCheckouts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.navy} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={CHART_COLORS.navy} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gcReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.copper} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gcRenewals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.sage} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={CHART_COLORS.sage} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="checkouts" stroke={CHART_COLORS.navy} strokeWidth={2} fill="url(#gcCheckouts)" dot={{ r: 3, fill: CHART_COLORS.navy }} />
              <Area type="monotone" dataKey="returns" stroke={CHART_COLORS.copper} strokeWidth={2} fill="url(#gcReturns)" dot={{ r: 3, fill: CHART_COLORS.copper }} />
              <Area type="monotone" dataKey="renewals" stroke={CHART_COLORS.sage} strokeWidth={2} fill="url(#gcRenewals)" dot={{ r: 3, fill: CHART_COLORS.sage }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Overdue Breakdown"
          description="By category"
          isLoading={isLoading}
        >
          <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.overdueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.overdueBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-display font-semibold">{totalOverdue}</p>
                  <p className="text-[10px] text-muted-foreground">overdue</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {data.overdueBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-muted-foreground">{item.name}</span>
                  <span className="text-[10px] font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Peak Hours Heatmap */}
      <ChartCard
        title="Peak Usage Hours"
        description="Checkout activity by day and hour"
        isLoading={isLoading}
      >
        <PeakHoursHeatmap data={data.peakHours} isLoading={isLoading} />
      </ChartCard>

      {/* Top 10 Most Borrowed */}
      <ChartCard
        title="Top 10 Most Borrowed"
        description="Books by total borrows this period"
        isLoading={isLoading}
        action={<Award className="w-4 h-4 text-brand-amber" />}
      >
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={data.topBooks}
            layout="vertical"
            margin={{ left: 120, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#7C8594" }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "#7C8594" }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={CHART_COLORS.copper} radius={[0, 4, 4, 0]} barSize={20} name="borrows" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
