import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  User,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { Loan } from "@/types/circulation";

interface LoanDetailSheetProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getDaysOverdue: (dueDate: string) => number;
  onCheckin: (loan: Loan) => void;
  onRenew: (loan: Loan) => void;
}

function InfoRow({ icon: Icon, label, value, valueClass }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-[13px] font-medium ${valueClass ?? ""}`}>{value}</p>
      </div>
    </div>
  );
}

export function LoanDetailSheet({
  loan,
  open,
  onOpenChange,
  getDaysOverdue,
  onCheckin,
  onRenew,
}: LoanDetailSheetProps) {
  if (!loan) return null;

  const daysOver = getDaysOverdue(loan.dueDate);
  const isActive = loan.status === "CHECKED_OUT" || loan.status === "OVERDUE";

  const statusBadge = (() => {
    switch (loan.status) {
      case "CHECKED_OUT":
        return (
          <Badge className="bg-brand-navy/10 text-brand-navy border-0 text-[10px]">
            Active
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-brand-brick/12 text-brand-brick border-0 text-[10px]">
            Overdue
          </Badge>
        );
      case "RETURNED":
        return (
          <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">
            Returned
          </Badge>
        );
      case "LOST":
        return (
          <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
            Lost
          </Badge>
        );
    }
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Loan Details</SheetTitle>
          <SheetDescription className="text-xs">
            Full information for this loan record
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Book Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-navy" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Book Information
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40 space-y-2">
              <p className="text-[15px] font-semibold">{loan.bookTitle}</p>
              <p className="text-[12px] text-muted-foreground">
                {loan.bookAuthor}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                ISBN: {loan.bookISBN}
              </p>
            </div>
          </div>

          <Separator />

          {/* Member Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-copper" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Member Information
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40 space-y-1">
              <p className="text-[14px] font-medium">{loan.memberName}</p>
              <p className="text-[11px] text-muted-foreground">
                {loan.memberNumber}
              </p>
            </div>
          </div>

          <Separator />

          {/* Loan Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-sage" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Loan Details
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Status</span>
                {statusBadge}
              </div>
              <InfoRow
                icon={Calendar}
                label="Checkout Date"
                value={new Date(loan.checkoutDate).toLocaleDateString()}
              />
              <InfoRow
                icon={Clock}
                label="Due Date"
                value={`${new Date(loan.dueDate).toLocaleDateString()}${
                  daysOver > 0 ? ` (${daysOver} days overdue)` : ""
                }`}
                valueClass={daysOver > 0 ? "text-brand-brick" : ""}
              />
              {loan.returnDate && (
                <InfoRow
                  icon={CheckCircle}
                  label="Return Date"
                  value={new Date(loan.returnDate).toLocaleDateString()}
                  valueClass="text-brand-sage"
                />
              )}
              <InfoRow
                icon={RefreshCw}
                label="Renewals"
                value={`${loan.renewalCount} of ${loan.maxRenewals}`}
              />
              {loan.fine > 0 && (
                <InfoRow
                  icon={AlertCircle}
                  label="Fine"
                  value={`$${loan.fine.toFixed(2)}`}
                  valueClass="text-brand-brick"
                />
              )}
              {loan.notes && (
                <div className="p-2.5 rounded-lg bg-brand-amber/5 border border-brand-amber/15">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Notes
                  </p>
                  <p className="text-[12px]">{loan.notes}</p>
                </div>
              )}
              <InfoRow
                icon={User}
                label="Processed By"
                value={loan.checkedOutBy}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {isActive && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick Actions
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onCheckin(loan);
                      onOpenChange(false);
                    }}
                    className="bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] flex-1"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Check In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onRenew(loan);
                      onOpenChange(false);
                    }}
                    disabled={loan.renewalCount >= loan.maxRenewals}
                    className="text-[11px] flex-1"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Renew
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
