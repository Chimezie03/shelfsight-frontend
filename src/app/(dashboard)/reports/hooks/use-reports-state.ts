"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { subDays, startOfDay, endOfDay, startOfYear, format } from "date-fns";
import type { DateRange, PresetRange, ReportsData } from "../types";
import { fetchReportsData } from "@/lib/reports";

function getPresetRange(preset: PresetRange): { from: Date; to: Date } {
  const now = new Date();
  const to = endOfDay(now);

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to };
    case "7d":
      return { from: startOfDay(subDays(now, 7)), to };
    case "30d":
      return { from: startOfDay(subDays(now, 30)), to };
    case "90d":
      return { from: startOfDay(subDays(now, 90)), to };
    case "year":
      return { from: startOfYear(now), to };
    default:
      return { from: startOfDay(subDays(now, 30)), to };
  }
}

function exportCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvRows = rows.map((row) => row.map(escape).join(","));
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shelfsight-${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useReportsState() {
  const [activeTab, setActiveTab] = useState("overview");

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const { from, to } = getPresetRange("30d");
    return { from, to, preset: "30d" };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportsData | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReports = useCallback(async (range: DateRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchReportsData(range);
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load reports data";
      setError(message);
    } finally {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => setIsLoading(false), 150);
    }
  }, []);

  useEffect(() => {
    loadReports(dateRange);
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [dateRange, loadReports]);

  const handlePresetChange = useCallback((preset: PresetRange) => {
    if (preset === "custom") return;
    const { from, to } = getPresetRange(preset);
    setDateRange({ from, to, preset });
  }, []);

  const handleCustomRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from: startOfDay(from), to: endOfDay(to), preset: "custom" });
  }, []);

  const handleExportCsv = useCallback(
    (tabName: string) => {
      if (!data) return;
      switch (tabName) {
        case "circulation": {
          const headers = ["Period", "Checkouts", "Returns", "Renewals"];
          const rows = data.circulation.trends.map((p) => [
            p.label,
            String(p.checkouts ?? ""),
            String(p.returns ?? ""),
            String(p.renewals ?? ""),
          ]);
          exportCsv("circulation-report", headers, rows);
          break;
        }
        case "collection": {
          const headers = ["Category", "Books", "Percentage"];
          const rows = data.collection.categoryDistribution.map((c) => [
            c.name,
            String(c.value),
            `${c.percentage}%`,
          ]);
          exportCsv("collection-report", headers, rows);
          break;
        }
        case "members": {
          const headers = ["Rank", "Name", "Member #", "Books Borrowed", "Current Loans", "Fine Status"];
          const rows = data.members.topBorrowers.map((b) => [
            String(b.rank),
            b.name,
            b.memberNumber,
            String(b.booksBorrowed),
            String(b.currentLoans),
            b.fineStatus,
          ]);
          exportCsv("members-report", headers, rows);
          break;
        }
        case "financial": {
          const headers = ["Date", "Member", "Member #", "Amount", "Type", "Reason"];
          const rows = data.financial.recentTransactions.map((t) => [
            t.date,
            t.memberName,
            t.memberNumber,
            `$${t.amount.toFixed(2)}`,
            t.type,
            t.reason,
          ]);
          exportCsv("financial-report", headers, rows);
          break;
        }
        default: {
          const headers = ["Metric", "Value", "Change"];
          const rows = data.overview.kpis.map((k) => [
            k.label,
            k.formattedValue,
            `${k.change >= 0 ? "+" : ""}${k.change}%`,
          ]);
          exportCsv("overview-report", headers, rows);
          break;
        }
      }
    },
    [data]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const retry = useCallback(() => {
    loadReports(dateRange);
  }, [dateRange, loadReports]);

  return {
    activeTab,
    setActiveTab,
    dateRange,
    handlePresetChange,
    handleCustomRangeChange,
    data,
    isLoading,
    error,
    handleExportCsv,
    handlePrint,
    retry,
  };
}
