import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import type { Loan } from "@/types/circulation";

interface RenewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  loanDays: number;
  onConfirm: (loan: Loan) => void;
}

export function RenewDialog({
  open,
  onOpenChange,
  loan,
  loanDays,
  onConfirm,
}: RenewDialogProps) {
  if (!loan) return null;

  const newDueDate = new Date(loan.dueDate);
  newDueDate.setDate(newDueDate.getDate() + loanDays);
  const newDueDateStr = newDueDate.toLocaleDateString();
  const isLastRenewal = loan.renewalCount + 1 >= loan.maxRenewals;
  const isOverdue = loan.status === "OVERDUE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-brand-copper" />
            Renew Loan
          </DialogTitle>
          <DialogDescription className="text-xs">
            Extend the due date for this loan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Book info */}
          <div>
            <p className="text-[15px] font-semibold">{loan.bookTitle}</p>
            <p className="text-[12px] text-muted-foreground">
              {loan.memberName} · {loan.memberNumber}
            </p>
          </div>

          {/* Date change */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Current Due Date
                </p>
              </div>
              <p className="text-[13px] font-medium">
                {new Date(loan.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-sage/5 border border-brand-sage/15">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-brand-sage" />
                <p className="text-[10px] text-brand-sage uppercase tracking-wide">
                  New Due Date
                </p>
              </div>
              <p className="text-[13px] font-semibold text-brand-sage">
                {newDueDateStr}
              </p>
            </div>
          </div>

          {/* Renewal count */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
            <span className="text-[12px] text-muted-foreground">Renewal</span>
            <Badge
              className={`text-[10px] border-0 ${
                isLastRenewal
                  ? "bg-brand-amber/12 text-brand-amber"
                  : "bg-brand-navy/10 text-brand-navy"
              }`}
            >
              {loan.renewalCount + 1} of {loan.maxRenewals}
            </Badge>
          </div>

          {/* Warnings */}
          {isLastRenewal && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-amber/8 border border-brand-amber/20">
              <AlertTriangle className="w-3.5 h-3.5 text-brand-amber shrink-0" />
              <p className="text-[11px] text-brand-amber font-medium">
                This is the final renewal allowed for this loan.
              </p>
            </div>
          )}

          {isOverdue && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-brick/8 border border-brand-brick/20">
              <AlertTriangle className="w-3.5 h-3.5 text-brand-brick shrink-0" />
              <p className="text-[11px] text-brand-brick font-medium">
                This loan is overdue. Renewing will reset the due date and clear the
                fine.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(loan)}
            className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Confirm Renewal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
