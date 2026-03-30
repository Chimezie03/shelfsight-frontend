"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { useCirculationState } from "./hooks/use-circulation-state";
import { CirculationStats } from "./components/circulation-stats";
import { OverdueAlertBanner } from "./components/overdue-alert-banner";
import { CheckoutTab } from "./components/checkout-tab";
import { CheckinTab } from "./components/checkin-tab";
import { CheckinConfirmDialog } from "./components/checkin-confirm-dialog";
import { ActiveLoansTable } from "./components/active-loans-table";
import { LoanDetailSheet } from "./components/loan-detail-sheet";
import { RenewDialog } from "./components/renew-dialog";
import { FinesTab } from "./components/fines-tab";
import { TransactionHistoryTable } from "./components/transaction-history-table";

export default function CirculationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const circ = useCirculationState();
  const canAccess = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  if (user && !canAccess) {
    return null;
  }

  const handleCheckout = async () => {
    try {
      const result = await circ.processCheckout();
      if (result) {
        toast.success(
          `Checked out ${result.count} book${result.count !== 1 ? "s" : ""} to ${result.memberName}`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Checkout could not be completed";
      toast.error(message);
    }
  };

  const handleCheckin = (loan: Parameters<typeof circ.openCheckinConfirm>[0]) => {
    circ.openCheckinConfirm(loan);
  };

  const handleConfirmCheckin = async (loan: Parameters<typeof circ.processCheckin>[0]) => {
    try {
      const result = await circ.processCheckin(loan);
      if (result) {
        if (result.fine > 0) {
          toast.success(
            `"${result.bookTitle}" returned — fine of $${result.fine.toFixed(2)} applied`
          );
        } else {
          toast.success(`"${result.bookTitle}" returned successfully`);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Check-in could not be completed";
      toast.error(message);
    }
  };

  const handleRenew = (loan: Parameters<typeof circ.processRenewal>[0]) => {
    const result = circ.processRenewal(loan);
    if (result) {
      toast.success(
        `"${result.bookTitle}" renewed — new due date: ${result.newDueDate}`
      );
    }
  };

  const handlePayFine = (fineId: string) => {
    const fine = circ.payFine(fineId);
    if (fine) {
      toast.success(`Fine of $${fine.amount.toFixed(2)} paid for "${fine.bookTitle}"`);
    }
  };

  const handleWaiveFine = (fineId: string) => {
    const fine = circ.waiveFine(fineId);
    if (fine) {
      toast.success(`Fine of $${fine.amount.toFixed(2)} waived for "${fine.bookTitle}"`);
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">
          Circulation Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Handle check-ins, check-outs, renewals, and manage fines
        </p>
      </div>

      {/* Stats */}
      <CirculationStats
        activeLoansCount={circ.activeLoansCount}
        overdueCount={circ.overdueCount}
        returnsTodayCount={circ.returnsTodayCount}
        totalOutstandingFines={circ.totalOutstandingFines}
      />

      {/* Overdue Banner */}
      <OverdueAlertBanner
        overdueCount={circ.overdueCount}
        totalFines={circ.totalOutstandingFines}
        onViewOverdue={circ.goToOverdue}
      />

      {circ.loadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to fully load circulation data</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{circ.loadError}</span>
            <Button variant="outline" size="sm" onClick={circ.reloadData}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={circ.activeTab} onValueChange={circ.setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="checkout" className="text-[11px]">Check-Out</TabsTrigger>
          <TabsTrigger value="checkin" className="text-[11px]">Check-In</TabsTrigger>
          <TabsTrigger value="active-loans" className="text-[11px]">Active Loans</TabsTrigger>
          <TabsTrigger value="fines" className="text-[11px]">Fines</TabsTrigger>
          <TabsTrigger value="history" className="text-[11px]">History</TabsTrigger>
        </TabsList>

        {/* Check-Out */}
        <TabsContent value="checkout">
          <CheckoutTab
            memberSearch={circ.memberSearch}
            onMemberSearchChange={circ.setMemberSearch}
            filteredMembers={circ.filteredMembers}
            selectedMember={circ.selectedMember}
            onSelectMember={circ.setSelectedMember}
            bookSearch={circ.bookSearch}
            onBookSearchChange={circ.setBookSearch}
            filteredBooks={circ.filteredBooks}
            checkoutQueue={circ.checkoutQueue}
            onAddToQueue={circ.addToQueue}
            onRemoveFromQueue={circ.removeFromQueue}
            onClearQueue={circ.clearQueue}
            loanDays={circ.loanDays}
            onLoanDaysChange={circ.setLoanDays}
            onProcessCheckout={handleCheckout}
          />
        </TabsContent>

        {/* Check-In */}
        <TabsContent value="checkin">
          <CheckinTab
            checkinSearch={circ.checkinSearch}
            onSearchChange={circ.searchForCheckin}
            detectedLoan={circ.detectedLoan}
            getDaysOverdue={circ.getDaysOverdue}
            calculateFine={circ.calculateFine}
            onProcessReturn={handleCheckin}
          />
        </TabsContent>

        {/* Active Loans */}
        <TabsContent value="active-loans">
          <ActiveLoansTable
            loans={circ.paginatedLoans}
            total={circ.totalFilteredLoans}
            filters={circ.loanFilters}
            onFiltersChange={circ.setLoanFilters}
            sortField={circ.loanSortField}
            sortDirection={circ.loanSortDirection}
            onToggleSort={circ.toggleLoanSort}
            page={circ.loanPage}
            pageSize={circ.loanPageSize}
            onPageChange={circ.setLoanPage}
            onPageSizeChange={circ.setLoanPageSize}
            getDaysOverdue={circ.getDaysOverdue}
            onCheckin={handleCheckin}
            onRenew={circ.openRenew}
            onViewDetail={circ.viewLoanDetail}
          />
        </TabsContent>

        {/* Fines */}
        <TabsContent value="fines">
          <FinesTab
            fines={circ.filteredFines}
            filters={circ.fineFilters}
            onFiltersChange={circ.setFineFilters}
            fineSummary={circ.fineSummary}
            onPayFine={handlePayFine}
            onWaiveFine={handleWaiveFine}
            userRole={user?.role}
          />
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <TransactionHistoryTable
            transactions={circ.paginatedHistory}
            total={circ.totalFilteredHistory}
            filters={circ.historyFilters}
            onFiltersChange={circ.setHistoryFilters}
            page={circ.historyPage}
            pageSize={circ.historyPageSize}
            onPageChange={circ.setHistoryPage}
            onPageSizeChange={circ.setHistoryPageSize}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs & Sheets */}
      <CheckinConfirmDialog
        open={circ.isCheckinConfirmOpen}
        onOpenChange={circ.setIsCheckinConfirmOpen}
        loan={circ.checkinLoan}
        getDaysOverdue={circ.getDaysOverdue}
        calculateFine={circ.calculateFine}
        onConfirm={handleConfirmCheckin}
      />

      <LoanDetailSheet
        loan={circ.detailLoan}
        open={circ.isDetailOpen}
        onOpenChange={circ.setIsDetailOpen}
        getDaysOverdue={circ.getDaysOverdue}
        onCheckin={handleCheckin}
        onRenew={circ.openRenew}
      />

      <RenewDialog
        open={circ.isRenewOpen}
        onOpenChange={circ.setIsRenewOpen}
        loan={circ.renewLoan}
        loanDays={circ.loanDays}
        onConfirm={handleRenew}
      />
    </div>
  );
}
