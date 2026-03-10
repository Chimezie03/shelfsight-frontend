"use client";

import { BookOpen, Plus, RefreshCw } from "lucide-react";
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
import { CHART_COLORS } from "../constants";
import type { CollectionData } from "../types";

interface CollectionTabProps {
  data: CollectionData;
  isLoading: boolean;
}

export function CollectionTab({ data, isLoading }: CollectionTabProps) {
  const totalBooks = data.categoryDistribution.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total Titles"
          value={data.totalTitles.toLocaleString()}
          numericValue={data.totalTitles}
          change={0}
          changeLabel={`across ${data.categoryDistribution.length} categories`}
          trend="flat"
          sparklineData={[]}
          icon={<BookOpen className="w-5 h-5 text-brand-navy" />}
          accentColor="navy"
          isLoading={isLoading}
          index={0}
        />
        <KpiCard
          label="New Acquisitions"
          value={`${data.newAcquisitions}`}
          numericValue={data.newAcquisitions}
          change={0}
          changeLabel="this period via AI ingestion"
          trend="up"
          sparklineData={[]}
          icon={<Plus className="w-5 h-5 text-brand-copper" />}
          accentColor="copper"
          isLoading={isLoading}
          index={1}
        />
        <KpiCard
          label="Avg. Turnover Rate"
          value={`${data.avgTurnoverRate}x`}
          numericValue={data.avgTurnoverRate}
          change={0}
          changeLabel="checkouts per copy"
          trend="flat"
          sparklineData={[]}
          icon={<RefreshCw className="w-5 h-5 text-brand-sage" />}
          accentColor="sage"
          isLoading={isLoading}
          index={2}
        />
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Category Distribution"
          description="Books across categories"
          isLoading={isLoading}
        >
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.categoryDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xl font-display font-semibold">{totalBooks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">total</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {data.categoryDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] text-foreground">{item.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{item.value.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Dewey Classification"
          description="Top divisions by volume"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.deweyDistribution.slice(0, 8)}
              layout="vertical"
              margin={{ left: 140, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#7C8594" }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 10, fill: "#7C8594" }}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={CHART_COLORS.navy} radius={[0, 4, 4, 0]} barSize={18} name="titles" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Acquisition Trend */}
      <ChartCard
        title="Acquisition Trend"
        description="New books added to the collection over time"
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.acquisitionTrend}>
            <defs>
              <linearGradient id="gradNewBooks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.sage} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.sage} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
            <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="newBooks"
              stroke={CHART_COLORS.sage}
              strokeWidth={2}
              fill="url(#gradNewBooks)"
              dot={{ r: 3, fill: CHART_COLORS.sage }}
              name="new books"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Turnover by Category */}
      <ChartCard
        title="Category Turnover"
        description="Available vs. in circulation by category"
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.turnoverByCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7C8594" }} />
            <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="available" fill={CHART_COLORS.navy} radius={[4, 4, 0, 0]} barSize={24} name="available" />
            <Bar dataKey="circulating" fill={CHART_COLORS.copper} radius={[4, 4, 0, 0]} barSize={24} name="circulating" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
