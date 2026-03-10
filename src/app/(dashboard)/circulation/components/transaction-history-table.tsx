import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, History, Clock } from "lucide-react";
import type { TransactionLog, TransactionFilters } from "@/types/circulation";
import { TRANSACTION_TYPE_OPTIONS } from "../constants";
import { CirculationPagination } from "./circulation-pagination";

interface TransactionHistoryTableProps {
  transactions: TransactionLog[];
  total: number;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function getTypeBadge(type: TransactionLog["type"]) {
  switch (type) {
    case "CHECKOUT":
      return (
        <Badge className="bg-brand-navy/10 text-brand-navy border-0 text-[10px]">
          Check-Out
        </Badge>
      );
    case "CHECKIN":
      return (
        <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">
          Check-In
        </Badge>
      );
    case "RENEWAL":
      return (
        <Badge className="bg-brand-copper/12 text-brand-copper border-0 text-[10px]">
          Renewal
        </Badge>
      );
    case "FINE_PAID":
      return (
        <Badge className="bg-brand-amber/12 text-brand-amber border-0 text-[10px]">
          Fine Paid
        </Badge>
      );
    case "FINE_WAIVED":
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
          Fine Waived
        </Badge>
      );
  }
}

export function TransactionHistoryTable({
  transactions,
  total,
  filters,
  onFiltersChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TransactionHistoryTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <History className="w-4 h-4 text-brand-copper" />
          Transaction History
        </CardTitle>
        <CardDescription className="text-xs">
          Complete log of all circulation activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
          <Select
            value={filters.type}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, type: v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="From date"
            value={filters.dateFrom}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateFrom: e.target.value })
            }
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Timestamp
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Book
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Member
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Processed By
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="py-12 text-center">
                    <History className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-[13px] font-medium text-muted-foreground">
                      No transactions found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-secondary/40">
                  <TableCell className="text-[12px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <div>
                        <p>
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[10px]">
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(tx.type)}</TableCell>
                  <TableCell>
                    <p className="text-[13px] font-medium">{tx.bookTitle}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-[13px]">{tx.memberName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.memberNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {tx.processedBy}
                  </TableCell>
                  <TableCell>
                    <p className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                      {tx.details}
                    </p>
                  </TableCell>
                </TableRow>
              ))
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
  );
}
