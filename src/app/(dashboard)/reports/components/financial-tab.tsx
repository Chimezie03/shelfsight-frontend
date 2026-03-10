"use client";

import { DollarSign, Wallet, TrendingUp, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { FinancialData } from "../types";

interface FinancialTabProps {
  data: FinancialData;
  isLoading: boolean;
}

const TRANSACTION_TYPE_CONFIG = {
  payment: { label: "Payment", className: "bg-brand-sage/10 text-brand-sage border-0" },
  waiver: { label: "Waived", className: "bg-brand-amber/10 text-brand-amber border-0" },
  assessment: { label: "Assessed", className: "bg-brand-brick/10 text-brand-brick border-0" },
};

export function FinancialTab({ data, isLoading }: FinancialTabProps) {
  const totalPayments = data.paymentMethods.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Collected"
          value={`$${data.totalCollected}`}
          numericValue={data.totalCollected}
          change={data.totalCollectedChange}
          changeLabel="from last period"
          trend={data.totalCollectedChange >= 0 ? "up" : "down"}
          sparklineData={[]}
          icon={<DollarSign className="w-5 h-5 text-brand-sage" />}
          accentColor="sage"
          isLoading={isLoading}
          index={0}
        />
        <KpiCard
          label="Total Outstanding"
          value={`$${data.totalOutstanding.toFixed(0)}`}
          numericValue={data.totalOutstanding}
          change={0}
          changeLabel="across all members"
          trend="flat"
          sparklineData={[]}
          icon={<Wallet className="w-5 h-5 text-brand-brick" />}
          accentColor="brick"
          isLoading={isLoading}
          index={1}
        />
        <KpiCard
          label="Collection Rate"
          value={`${data.collectionRate}%`}
          numericValue={data.collectionRate}
          change={0}
          changeLabel="of assessed fines collected"
          trend="up"
          sparklineData={[]}
          icon={<TrendingUp className="w-5 h-5 text-brand-navy" />}
          accentColor="navy"
          isLoading={isLoading}
          index={2}
        />
        <KpiCard
          label="Avg. Fine Amount"
          value={`$${data.avgFineAmount}`}
          numericValue={data.avgFineAmount}
          change={0}
          changeLabel="per fine assessed"
          trend="flat"
          sparklineData={[]}
          icon={<Calculator className="w-5 h-5 text-brand-copper" />}
          accentColor="copper"
          isLoading={isLoading}
          index={3}
        />
      </div>

      {/* Revenue trend + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Revenue Trend"
          description="Fine payments received over time"
          className="lg:col-span-2"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueTrend}>
              <defs>
                <linearGradient id="gfOverdue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gfLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.brick} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.brick} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip formatter={(v) => `$${v}`} />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="overdueFines"
                stackId="1"
                stroke={CHART_COLORS.amber}
                strokeWidth={2}
                fill="url(#gfOverdue)"
                name="overdue fines"
              />
              <Area
                type="monotone"
                dataKey="lostBookFees"
                stackId="1"
                stroke={CHART_COLORS.brick}
                strokeWidth={2}
                fill="url(#gfLost)"
                name="lost book fees"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          description="How fines are resolved"
          isLoading={isLoading}
        >
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.paymentMethods.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-lg font-display font-semibold">{totalPayments}</p>
                  <p className="text-[10px] text-muted-foreground">total</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
              {data.paymentMethods.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-muted-foreground">{item.name}</span>
                  <span className="text-[11px] font-medium ml-auto">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Aging Report */}
      <ChartCard
        title="Outstanding Fines Aging"
        description="Outstanding balances by age"
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.outstandingByAge}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
            <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(v, name) =>
                    name === "amount" ? `$${v.toFixed(2)}` : String(v)
                  }
                />
              }
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="amount" name="amount" radius={[4, 4, 0, 0]} barSize={48}>
              {data.outstandingByAge.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="count" name="accounts" fill={CHART_COLORS.navy} radius={[4, 4, 0, 0]} barSize={48} opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Recent Transactions Table */}
      <ChartCard
        title="Recent Fine Transactions"
        description="Latest fine payments, assessments, and waivers"
        isLoading={isLoading}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Member</TableHead>
                <TableHead className="text-xs">Member #</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.map((tx) => {
                const typeConfig = TRANSACTION_TYPE_CONFIG[tx.type];
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-[13px] text-muted-foreground">{tx.date}</TableCell>
                    <TableCell className="text-[13px]">{tx.memberName}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{tx.memberNumber}</TableCell>
                    <TableCell className="text-[13px] text-right font-medium">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${typeConfig.className}`}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{tx.reason}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
