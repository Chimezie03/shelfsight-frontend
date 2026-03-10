"use client";

import { UserPlus, Users, BookOpen, AlertTriangle, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { motion } from "motion/react";
import { KpiCard } from "./kpi-card";
import { ChartCard } from "./chart-card";
import { CustomTooltip } from "./custom-tooltip";
import { CHART_COLORS } from "../constants";
import type { MembersData } from "../types";

interface MembersTabProps {
  data: MembersData;
  isLoading: boolean;
}

export function MembersTab({ data, isLoading }: MembersTabProps) {
  const totalMembers = data.typeBreakdown.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="New This Month"
          value={`${data.newThisMonth}`}
          numericValue={data.newThisMonth}
          change={data.newThisMonthChange}
          changeLabel="from last month"
          trend={data.newThisMonthChange >= 0 ? "up" : "down"}
          sparklineData={[]}
          icon={<UserPlus className="w-5 h-5 text-brand-navy" />}
          accentColor="navy"
          isLoading={isLoading}
          index={0}
        />
        <KpiCard
          label="Active Borrowers"
          value={`${data.activeBorrowerPct}%`}
          numericValue={data.activeBorrowerPct}
          change={0}
          changeLabel="of total members"
          trend="flat"
          sparklineData={[]}
          icon={<Users className="w-5 h-5 text-brand-sage" />}
          accentColor="sage"
          isLoading={isLoading}
          index={1}
        />
        <KpiCard
          label="Avg. Books / Member"
          value={`${data.avgBooksPerMember}`}
          numericValue={data.avgBooksPerMember}
          change={0}
          changeLabel="per year"
          trend="flat"
          sparklineData={[]}
          icon={<BookOpen className="w-5 h-5 text-brand-copper" />}
          accentColor="copper"
          isLoading={isLoading}
          index={2}
        />
        <KpiCard
          label="Suspended Accounts"
          value={`${data.suspendedAccounts}`}
          numericValue={data.suspendedAccounts}
          change={0}
          changeLabel="due to overdue items"
          trend="flat"
          sparklineData={[]}
          icon={<AlertTriangle className="w-5 h-5 text-brand-brick" />}
          accentColor="brick"
          isLoading={isLoading}
          index={3}
        />
      </div>

      {/* Growth trend + Type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Member Growth"
          description="Total and new members over time"
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.growthTrend}>
              <defs>
                <linearGradient id="gmTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.copper} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gmNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.sage} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_COLORS.sage} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7C8594" }} />
              <YAxis tick={{ fontSize: 12, fill: "#7C8594" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="totalMembers" stroke={CHART_COLORS.copper} strokeWidth={2} fill="url(#gmTotal)" dot={{ r: 3, fill: CHART_COLORS.copper }} name="total members" />
              <Area type="monotone" dataKey="newMembers" stroke={CHART_COLORS.sage} strokeWidth={2} fill="url(#gmNew)" dot={{ r: 3, fill: CHART_COLORS.sage }} name="new members" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="space-y-6">
          <ChartCard
            title="Member Status"
            description="Active, expired, and suspended"
            isLoading={isLoading}
          >
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.typeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {data.typeBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-display font-semibold">{totalMembers}</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {data.typeBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[12px] text-foreground">{item.name}</span>
                    <span className="text-[11px] font-medium ml-auto">{item.value}</span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Most Active Member highlight */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
          >
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-copper/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-brand-copper" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Most Active Member</p>
                    <p className="text-[15px] font-display font-semibold">{data.mostActiveName}</p>
                    <p className="text-[11px] text-muted-foreground">{data.mostActiveCount} books borrowed this period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Top Borrowers Table */}
      <ChartCard
        title="Top 10 Borrowers"
        description="Members with the highest borrowing activity"
        isLoading={isLoading}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Member #</TableHead>
                <TableHead className="text-xs text-right">Books Borrowed</TableHead>
                <TableHead className="text-xs text-right">Current Loans</TableHead>
                <TableHead className="text-xs text-right">Fines</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topBorrowers.map((member) => (
                <TableRow key={member.memberNumber}>
                  <TableCell className="font-medium text-[13px]">{member.rank}</TableCell>
                  <TableCell className="text-[13px]">{member.name}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{member.memberNumber}</TableCell>
                  <TableCell className="text-[13px] text-right font-medium">{member.booksBorrowed}</TableCell>
                  <TableCell className="text-[13px] text-right">{member.currentLoans}</TableCell>
                  <TableCell className="text-right">
                    {member.fineStatus === "clear" ? (
                      <Badge variant="secondary" className="text-[10px] bg-brand-sage/10 text-brand-sage border-0">
                        Clear
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-brand-brick/10 text-brand-brick border-0">
                        ${member.fineAmount.toFixed(2)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
