import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Loan, LoanSortField, SortDirection, LoanFilters } from "@/types/circulation";
import { LOAN_STATUS_OPTIONS } from "../constants";
import { CirculationPagination } from "./circulation-pagination";

interface ActiveLoansTableProps {
  loans: Loan[];
  total: number;
  filters: LoanFilters;
  onFiltersChange: (filters: LoanFilters) => void;
  sortField: LoanSortField | null;
  sortDirection: SortDirection;
  onToggleSort: (field: LoanSortField) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getDaysOverdue: (dueDate: string) => number;
  onCheckin: (loan: Loan) => void;
  onRenew: (loan: Loan) => void;
  onViewDetail: (loan: Loan) => void;
}

function SortIcon({
  field,
  activeField,
  direction,
}: {
  field: LoanSortField;
  activeField: LoanSortField | null;
  direction: SortDirection;
}) {
  if (field !== activeField) {
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
  }
  return direction === "asc" ? (
    <ArrowUp className="w-3 h-3" />
  ) : (
    <ArrowDown className="w-3 h-3" />
  );
}

export function ActiveLoansTable({
  loans,
  total,
  filters,
  onFiltersChange,
  sortField,
  sortDirection,
  onToggleSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getDaysOverdue,
  onCheckin,
  onRenew,
  onViewDetail,
}: ActiveLoansTableProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Active Loans</CardTitle>
          <CardDescription className="text-xs">
            Manage current checkouts and overdue items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by book title, member, or ISBN..."
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, status: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("bookTitle")}
                  >
                    Book
                    <SortIcon
                      field="bookTitle"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("memberName")}
                  >
                    Member
                    <SortIcon
                      field="memberName"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("checkoutDate")}
                  >
                    Checkout
                    <SortIcon
                      field="checkoutDate"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("dueDate")}
                  >
                    Due Date
                    <SortIcon
                      field="dueDate"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("status")}
                  >
                    Status
                    <SortIcon
                      field="status"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSort("fine")}
                  >
                    Fine
                    <SortIcon
                      field="fine"
                      activeField={sortField}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-12 text-center">
                      <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-[13px] font-medium text-muted-foreground">
                        No active loans found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => {
                  const daysOver = getDaysOverdue(loan.dueDate);
                  return (
                    <TableRow key={loan.id} className="hover:bg-secondary/40">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium">
                            {loan.bookTitle}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {loan.bookISBN}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium">
                            {loan.memberName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {loan.memberNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(loan.checkoutDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(loan.dueDate).toLocaleDateString()}
                          {daysOver > 0 && (
                            <span className="text-[10px] text-brand-brick ml-1">
                              ({daysOver}d overdue)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border-0 ${
                            loan.status === "OVERDUE"
                              ? "bg-brand-brick/12 text-brand-brick"
                              : "bg-brand-navy/10 text-brand-navy"
                          }`}
                        >
                          {loan.status === "OVERDUE" ? "Overdue" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[13px] ${
                            loan.fine > 0
                              ? "text-brand-brick font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          ${loan.fine.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => onCheckin(loan)}
                            className="bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] h-8"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Check In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRenew(loan)}
                            disabled={
                              loan.renewalCount >= loan.maxRenewals
                            }
                            className="text-[11px] h-8"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Renew
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onViewDetail(loan)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <CirculationPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
