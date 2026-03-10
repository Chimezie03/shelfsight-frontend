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
import { Search, DollarSign, CheckCircle, XCircle, Ban } from "lucide-react";
import type { Fine, FineFilters } from "@/types/circulation";
import { FINE_STATUS_OPTIONS } from "../constants";

interface FinesTabProps {
  fines: Fine[];
  filters: FineFilters;
  onFiltersChange: (filters: FineFilters) => void;
  fineSummary: { unpaid: number; paid: number; waived: number };
  onPayFine: (fineId: string) => void;
  onWaiveFine: (fineId: string) => void;
  userRole?: string;
}

function getStatusBadge(status: Fine["status"]) {
  switch (status) {
    case "UNPAID":
      return (
        <Badge className="bg-brand-brick/12 text-brand-brick border-0 text-[10px]">
          Unpaid
        </Badge>
      );
    case "PAID":
      return (
        <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">
          Paid
        </Badge>
      );
    case "WAIVED":
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
          Waived
        </Badge>
      );
  }
}

export function FinesTab({
  fines,
  filters,
  onFiltersChange,
  fineSummary,
  onPayFine,
  onWaiveFine,
  userRole,
}: FinesTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Unpaid
                </p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1 text-brand-brick">
                  ${fineSummary.unpaid.toFixed(2)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-brick/10 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5 text-brand-brick" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Collected
                </p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1 text-brand-sage">
                  ${fineSummary.paid.toFixed(2)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-sage/10 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-brand-sage" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Waived
                </p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1 text-muted-foreground">
                  ${fineSummary.waived.toFixed(2)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Ban className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fines Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Fine Records</CardTitle>
          <CardDescription className="text-xs">
            View and manage all fine records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by member or book title..."
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
                {FINE_STATUS_OPTIONS.map((opt) => (
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
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Member
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Book
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Reason
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-12 text-center">
                      <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-[13px] font-medium text-muted-foreground">
                        No fine records found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fines.map((fine) => (
                  <TableRow key={fine.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <div>
                        <p className="text-[13px] font-medium">
                          {fine.memberName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {fine.memberNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[13px]">{fine.bookTitle}</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[13px] font-medium ${
                          fine.status === "UNPAID"
                            ? "text-brand-brick"
                            : "text-muted-foreground"
                        }`}
                      >
                        ${fine.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {fine.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(fine.status)}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      {new Date(fine.createdDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {fine.status === "UNPAID" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onPayFine(fine.id)}
                              className="bg-brand-sage hover:bg-brand-sage/90 text-white text-[11px] h-8"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pay
                            </Button>
                            {userRole === "ADMIN" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onWaiveFine(fine.id)}
                                className="text-[11px] h-8 text-brand-amber border-brand-amber/30 hover:bg-brand-amber/10"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Waive
                              </Button>
                            )}
                          </>
                        )}
                        {fine.status === "PAID" && fine.paidDate && (
                          <span className="text-[10px] text-muted-foreground">
                            Paid {new Date(fine.paidDate).toLocaleDateString()}
                          </span>
                        )}
                        {fine.status === "WAIVED" && fine.waivedBy && (
                          <span className="text-[10px] text-muted-foreground">
                            Waived by {fine.waivedBy}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
