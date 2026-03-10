import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCircle,
  BookOpen,
  Search,
  CheckCircle,
  Plus,
  X,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import type { CirculationMember, CirculationBook, CheckoutQueueItem } from "@/types/circulation";
import { LOAN_PERIOD_OPTIONS } from "../constants";

interface CheckoutTabProps {
  memberSearch: string;
  onMemberSearchChange: (v: string) => void;
  filteredMembers: CirculationMember[];
  selectedMember: CirculationMember | null;
  onSelectMember: (m: CirculationMember | null) => void;
  bookSearch: string;
  onBookSearchChange: (v: string) => void;
  filteredBooks: CirculationBook[];
  checkoutQueue: CheckoutQueueItem[];
  onAddToQueue: (b: CirculationBook) => void;
  onRemoveFromQueue: (bookId: string) => void;
  onClearQueue: () => void;
  loanDays: number;
  onLoanDaysChange: (days: number) => void;
  onProcessCheckout: () => void;
}

export function CheckoutTab({
  memberSearch,
  onMemberSearchChange,
  filteredMembers,
  selectedMember,
  onSelectMember,
  bookSearch,
  onBookSearchChange,
  filteredBooks,
  checkoutQueue,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  loanDays,
  onLoanDaysChange,
  onProcessCheckout,
}: CheckoutTabProps) {
  const today = "2026-03-10";
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + loanDays);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  const memberAtLimit = selectedMember
    ? selectedMember.activeLoans >= selectedMember.maxLoans
    : false;
  const memberSuspended = selectedMember?.status === "suspended";
  const memberExpired = selectedMember?.status === "expired";
  const canCheckout =
    selectedMember &&
    checkoutQueue.length > 0 &&
    !memberAtLimit &&
    !memberSuspended &&
    !memberExpired;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Search */}
        <Card className="flex flex-col h-[calc(100vh-44rem)] min-h-[800px]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <UserCircle className="w-4 h-4 text-brand-copper" />
              Select Member
            </CardTitle>
            <CardDescription className="text-xs">
              Search by name or member number
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search member..."
                value={memberSearch}
                onChange={(e) => onMemberSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Member list — fills remaining space */}
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {filteredMembers.map((member) => {
                const isDisabled =
                  member.status === "suspended" || member.status === "expired";
                const isSelected = selectedMember?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (isDisabled) return;
                      onSelectMember(isSelected ? null : member);
                    }}
                    disabled={isDisabled}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-brand-copper/30 bg-brand-copper/5 hover:bg-brand-copper/8"
                        : isDisabled
                        ? "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-brand-copper/30 bg-card cursor-pointer"
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-medium">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {member.memberNumber} · {member.activeLoans}/{member.maxLoans} loans
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <Badge
                        className={`text-[10px] border-0 ${
                          member.status === "active"
                            ? "bg-brand-sage/12 text-brand-sage"
                            : member.status === "suspended"
                            ? "bg-brand-brick/12 text-brand-brick"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.status}
                      </Badge>
                      {!isDisabled && !isSelected && (
                        <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="w-7 h-7 rounded-md bg-brand-copper/12 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-copper" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected member panel — pinned at bottom */}
            {selectedMember && (
              <div className="space-y-2 shrink-0 border-t pt-4">
                <div className="p-3 bg-brand-copper/5 rounded-xl border border-brand-copper/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-brand-copper">
                        Selected Member
                      </p>
                      <p className="text-[15px] font-semibold mt-0.5">
                        {selectedMember.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {selectedMember.email} · {selectedMember.memberNumber}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSelectMember(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {memberAtLimit && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-amber/8 border border-brand-amber/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-amber" />
                    <p className="text-[11px] text-brand-amber font-medium">
                      Member has reached their loan limit ({selectedMember.maxLoans} books)
                    </p>
                  </div>
                )}

                {memberSuspended && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-brick/8 border border-brand-brick/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-brick" />
                    <p className="text-[11px] text-brand-brick font-medium">
                      Member account is suspended
                    </p>
                  </div>
                )}

                {selectedMember.totalFinesOwed > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-amber/8 border border-brand-amber/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-amber" />
                    <p className="text-[11px] text-brand-amber font-medium">
                      Outstanding fines: ${selectedMember.totalFinesOwed.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Book Search + Queue */}
        <Card className="flex flex-col h-[calc(100vh-44rem)] min-h-[800px]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <BookOpen className="w-4 h-4 text-brand-copper" />
              Add Books to Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Search by title, author, or ISBN
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search book..."
                value={bookSearch}
                onChange={(e) => onBookSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Book list — fills remaining space */}
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {filteredBooks.map((book) => {
                const inQueue = checkoutQueue.some((q) => q.bookId === book.id);
                return (
                  <button
                    key={book.id}
                    type="button"
                    disabled={!book.available && !inQueue}
                    onClick={() => {
                      if (inQueue) {
                        onRemoveFromQueue(book.id);
                      } else if (book.available) {
                        onAddToQueue(book);
                      }
                    }}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      inQueue
                        ? "border-brand-sage/30 bg-brand-sage/5 hover:bg-brand-sage/10"
                        : book.available
                        ? "border-border bg-card hover:border-brand-copper/30 cursor-pointer"
                        : "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{book.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {book.author} · <span className="font-mono">{book.isbn}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <Badge
                        className={`text-[10px] border-0 ${
                          book.available
                            ? "bg-brand-sage/12 text-brand-sage"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {book.availableCopies}/{book.copies}
                      </Badge>
                      {book.available && !inQueue && (
                        <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {inQueue && (
                        <div className="w-7 h-7 rounded-md bg-brand-sage/12 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-sage" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Queue — pinned at bottom */}
            {checkoutQueue.length > 0 && (
              <div className="border-t pt-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-brand-copper" />
                    <p className="text-[12px] font-semibold">
                      Checkout Queue ({checkoutQueue.length})
                    </p>
                  </div>
                  <button
                    onClick={onClearQueue}
                    className="text-[11px] text-muted-foreground hover:text-brand-brick transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {checkoutQueue.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium truncate">
                          {item.bookTitle}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Due: {item.dueDate}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 text-[10px] text-muted-foreground hover:text-brand-brick hover:bg-brand-brick/8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromQueue(item.bookId);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">
            Complete Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Loan Period
              </Label>
              <Select
                value={String(loanDays)}
                onValueChange={(v) => onLoanDaysChange(Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_PERIOD_OPTIONS.map((days) => (
                    <SelectItem key={days} value={String(days)}>
                      {days} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Checkout Date
              </Label>
              <Input type="date" value={today} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Due Date
              </Label>
              <Input type="date" value={dueDateStr} readOnly className="mt-1" />
            </div>
          </div>

          {selectedMember && checkoutQueue.length > 0 && (
            <p className="text-[12px] text-muted-foreground">
              Checking out{" "}
              <span className="font-semibold text-foreground">
                {checkoutQueue.length} book{checkoutQueue.length !== 1 ? "s" : ""}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {selectedMember.name}
              </span>
            </p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onProcessCheckout}
              disabled={!canCheckout}
              className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-2" />
              Complete Check-Out
              {checkoutQueue.length > 0 && ` (${checkoutQueue.length})`}
            </Button>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => {
                onSelectMember(null);
                onClearQueue();
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
