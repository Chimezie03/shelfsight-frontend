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
import { AlertCircle, BookOpen, User } from "lucide-react";
import type { Loan } from "@/types/circulation";

interface CheckinConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  getDaysOverdue: (dueDate: string) => number;
  calculateFine: (dueDate: string) => number;
  onConfirm: (loan: Loan) => void;
}

export function CheckinConfirmDialog({
  open,
  onOpenChange,
  loan,
  getDaysOverdue,
  calculateFine,
  onConfirm,
}: CheckinConfirmDialogProps) {
  if (!loan) return null;

  const daysOver = getDaysOverdue(loan.dueDate);
  const fineAmount = calculateFine(loan.dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Confirm Return</DialogTitle>
          <DialogDescription className="text-xs">
            Review the details below before processing this return.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Book */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-navy/8 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-navy" />
            </div>
            <div>
              <p className="text-[13px] font-medium">{loan.bookTitle}</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {loan.bookISBN}
              </p>
            </div>
          </div>

          {/* Member */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-copper/8 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-copper" />
            </div>
            <div>
              <p className="text-[13px] font-medium">{loan.memberName}</p>
              <p className="text-[11px] text-muted-foreground">
                {loan.memberNumber}
              </p>
            </div>
          </div>

          {/* Fine breakdown */}
          {daysOver > 0 ? (
            <div className="p-3 rounded-xl bg-brand-brick/8 border border-brand-brick/15 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-brand-brick" />
                <p className="text-[12px] font-semibold text-brand-brick">
                  Overdue Fine
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-brand-brick/70">
                <span>{daysOver} days overdue</span>
                <span>@ $0.25/day</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-brick/15">
                <span className="text-[12px] font-medium text-brand-brick">
                  Total Fine
                </span>
                <span className="text-[16px] font-display font-semibold text-brand-brick">
                  ${fineAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-brand-sage/8 border border-brand-sage/15">
              <div className="flex items-center gap-2">
                <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">
                  On Time
                </Badge>
                <p className="text-[11px] text-brand-sage">
                  No fines — returned within due date
                </p>
              </div>
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
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
