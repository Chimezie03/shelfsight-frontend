import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import type { Loan } from "@/types/circulation";

interface CheckinTabProps {
  checkinSearch: string;
  onSearchChange: (query: string) => void;
  detectedLoan: Loan | null;
  getDaysOverdue: (dueDate: string) => number;
  calculateFine: (dueDate: string) => number;
  onProcessReturn: (loan: Loan) => void;
}

export function CheckinTab({
  checkinSearch,
  onSearchChange,
  detectedLoan,
  getDaysOverdue,
  calculateFine,
  onProcessReturn,
}: CheckinTabProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <RotateCcw className="w-4 h-4 text-brand-copper" />
            Process Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Scan barcode or enter ISBN / book title..."
              value={checkinSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 text-[13px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detected Loan */}
      {detectedLoan && (
        <Card className="border-brand-copper/20">
          <CardContent className="pt-6 space-y-5">
            {/* Book Info */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-navy/8 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-brand-navy" />
              </div>
              <div>
                <p className="text-[15px] font-semibold">{detectedLoan.bookTitle}</p>
                <p className="text-[12px] text-muted-foreground">
                  {detectedLoan.bookAuthor} ·{" "}
                  <span className="font-mono">{detectedLoan.bookISBN}</span>
                </p>
              </div>
            </div>

            {/* Member Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-copper/8 flex items-center justify-center shrink-0">
                <User className="w-4.5 h-4.5 text-brand-copper" />
              </div>
              <div>
                <p className="text-[13px] font-medium">{detectedLoan.memberName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {detectedLoan.memberNumber}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Checked Out
                  </p>
                  <p className="text-[12px] font-medium">
                    {new Date(detectedLoan.checkoutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Due Date
                  </p>
                  <p className="text-[12px] font-medium">
                    {new Date(detectedLoan.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge
                className={`text-[10px] border-0 ${
                  detectedLoan.status === "OVERDUE"
                    ? "bg-brand-brick/12 text-brand-brick"
                    : "bg-brand-navy/10 text-brand-navy"
                }`}
              >
                {detectedLoan.status === "OVERDUE" ? "Overdue" : "Active"}
              </Badge>

              {detectedLoan.renewalCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Renewed {detectedLoan.renewalCount} time
                  {detectedLoan.renewalCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Fine Preview */}
            {getDaysOverdue(detectedLoan.dueDate) > 0 && (
              <div className="p-3 rounded-xl bg-brand-brick/8 border border-brand-brick/15">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-brand-brick" />
                  <p className="text-[12px] font-semibold text-brand-brick">
                    Overdue Fine
                  </p>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] text-brand-brick/70">
                    {getDaysOverdue(detectedLoan.dueDate)} days overdue @ $0.25/day
                  </p>
                  <p className="text-[18px] font-display font-semibold text-brand-brick">
                    ${calculateFine(detectedLoan.dueDate).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Action */}
            <Button
              onClick={() => onProcessReturn(detectedLoan)}
              className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-2" />
              Process Return
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {checkinSearch && !detectedLoan && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-[13px] font-medium text-muted-foreground">
              No active loan found
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Try searching by a different ISBN or book title
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
