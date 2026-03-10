"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import {
  fetchAdminDashboard,
  fetchStaffDashboard,
  fetchPatronDashboard,
  buildCirculationTrend,
  type BackendLoan,
} from "@/lib/dashboard";
import type {
  CirculationRangePreset,
  StaffTask,
  AdminDashboardData,
  StaffDashboardData,
  PatronDashboardData,
} from "../types";

const EMPTY_ADMIN: AdminDashboardData = {
  kpis: [],
  circulationTrend: [],
  collectionHealth: [],
  activityFeed: [],
  aiInsights: [],
  popularBooks: [],
  overdueCount: 0,
  overdueFinesTotal: 0,
};

const EMPTY_STAFF: StaffDashboardData = {
  kpis: [],
  tasks: [],
  circulationFeed: [],
  pendingReturns: [],
  shiftProgress: { completed: 0, total: 0 },
};

const EMPTY_PATRON: PatronDashboardData = {
  kpis: [],
  currentLoans: [],
  readingActivity: [],
  recommendations: [],
  fineSummary: null,
  announcements: [],
  readingGoal: { target: 0, current: 0, year: new Date().getFullYear() },
};

export function useDashboardState() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboardData>(EMPTY_ADMIN);
  const [staffData, setStaffData] = useState<StaffDashboardData>(EMPTY_STAFF);
  const [patronData, setPatronData] = useState<PatronDashboardData>(EMPTY_PATRON);
  const [rawLoans, setRawLoans] = useState<BackendLoan[]>([]);

  const [circulationRange, setCirculationRange] = useState<CirculationRangePreset>("7d");
  const [overdueBannerDismissed, setOverdueBannerDismissed] = useState(false);
  const [staffTasks, setStaffTasks] = useState<StaffTask[]>([]);

  // Fetch data based on role
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        switch (user!.role) {
          case "ADMIN": {
            const result = await fetchAdminDashboard(circulationRange);
            if (!cancelled) {
              setAdminData(result.data);
              setRawLoans(result.rawLoans);
            }
            break;
          }
          case "STAFF": {
            const data = await fetchStaffDashboard();
            if (!cancelled) {
              setStaffData((prev) => ({
                ...data,
                tasks: staffTasks,
                shiftProgress: {
                  completed: staffTasks.filter((t) => t.status === "done").length,
                  total: staffTasks.length,
                },
              }));
            }
            break;
          }
          case "PATRON": {
            const data = await fetchPatronDashboard(user!.userId);
            if (!cancelled) setPatronData(data);
            break;
          }
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.userId]);

  // Recompute circulation trend when range changes (no re-fetch needed)
  const adminDataWithTrend = useMemo(() => {
    if (rawLoans.length === 0) return adminData;
    return {
      ...adminData,
      circulationTrend: buildCirculationTrend(rawLoans, circulationRange),
    };
  }, [adminData, rawLoans, circulationRange]);

  // Keep staff data in sync with task mutations
  const staffDataWithTasks = useMemo(() => {
    const completed = staffTasks.filter((t) => t.status === "done").length;
    return {
      ...staffData,
      tasks: staffTasks,
      shiftProgress: { completed, total: staffTasks.length },
    };
  }, [staffData, staffTasks]);

  const dismissOverdueBanner = useCallback(() => {
    setOverdueBannerDismissed(true);
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setStaffTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newStatus = t.status === "done" ? "pending" : "done";
        if (newStatus === "done") {
          toast.success(`Task completed: ${t.task}`);
        }
        return { ...t, status: newStatus };
      }),
    );
  }, []);

  const handleRenewLoan = useCallback((loanId: string) => {
    const loan = patronData.currentLoans.find((l) => l.id === loanId);
    if (loan) {
      toast.success(`Renewed: ${loan.title}`, {
        description: "Due date extended by 14 days.",
      });
    }
  }, [patronData.currentLoans]);

  return {
    adminData: adminDataWithTrend,
    staffData: staffDataWithTasks,
    patronData,
    circulationRange,
    setCirculationRange,
    overdueBannerDismissed,
    dismissOverdueBanner,
    toggleTaskComplete,
    handleRenewLoan,
    isLoading,
  };
}
