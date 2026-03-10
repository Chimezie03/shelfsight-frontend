import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverdueAlertBannerProps {
  overdueCount: number;
  totalFines: number;
  onViewOverdue: () => void;
}

export function OverdueAlertBanner({
  overdueCount,
  totalFines,
  onViewOverdue,
}: OverdueAlertBannerProps) {
  if (overdueCount === 0) return null;

  return (
    <div className="mb-6 bg-brand-brick/8 border border-brand-brick/20 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-brick/15 flex items-center justify-center">
          <AlertCircle className="w-4.5 h-4.5 text-brand-brick" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-brand-brick">
            {overdueCount} item{overdueCount !== 1 ? "s" : ""} overdue
          </p>
          <p className="text-[11px] text-brand-brick/70">
            ${totalFines.toFixed(2)} in accumulated fines
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewOverdue}
        className="text-[11px] border-brand-brick/30 text-brand-brick hover:bg-brand-brick/10"
      >
        View Overdue
      </Button>
    </div>
  );
}
