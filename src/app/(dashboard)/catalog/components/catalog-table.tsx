"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Eye,
  Edit,
  Trash2,
  BookOpen,
} from "lucide-react";
import type { Book, SortField, SortDirection } from "@/types/book";

interface CatalogTableProps {
  books: Book[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllOnPage: () => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onViewBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  userRole?: string;
}

function getStatusBadge(status: Book["status"]) {
  switch (status) {
    case "available":
      return (
        <Badge className="bg-brand-sage/15 text-brand-sage border-0 text-[10px]">
          Available
        </Badge>
      );
    case "checked-out":
      return (
        <Badge className="bg-brand-amber/15 text-brand-amber border-0 text-[10px]">
          Checked Out
        </Badge>
      );
    case "maintenance":
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
          Maintenance
        </Badge>
      );
  }
}

function SortIcon({
  field,
  currentField,
  direction,
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
}) {
  if (currentField !== field) {
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  }
  return direction === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1 text-brand-copper" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 text-brand-copper" />
  );
}

const TH_CLASS =
  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

export function CatalogTable({
  books,
  isLoading,
  selectedIds,
  onToggleSelect,
  onSelectAllOnPage,
  sortField,
  sortDirection,
  onSort,
  onViewBook,
  onEditBook,
  onDeleteBook,
  userRole,
}: CatalogTableProps) {
  const canEdit = userRole === "ADMIN" || userRole === "STAFF";
  const canDelete = userRole === "ADMIN";
  const showCheckboxes = userRole === "ADMIN";

  const allOnPageSelected =
    books.length > 0 && books.every((b) => selectedIds.has(b.id));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[70px]" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BookOpen className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-[13px]">No books found matching your search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={onSelectAllOnPage}
                />
              </TableHead>
            )}
            <TableHead className={TH_CLASS}>
              <button
                className="flex items-center hover:text-foreground transition-colors"
                onClick={() => onSort("title")}
              >
                Title
                <SortIcon
                  field="title"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className={TH_CLASS}>
              <button
                className="flex items-center hover:text-foreground transition-colors"
                onClick={() => onSort("author")}
              >
                Author
                <SortIcon
                  field="author"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className={TH_CLASS}>ISBN</TableHead>
            <TableHead className={TH_CLASS}>
              <button
                className="flex items-center hover:text-foreground transition-colors"
                onClick={() => onSort("dewey")}
              >
                Dewey
                <SortIcon
                  field="dewey"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className={TH_CLASS}>Category</TableHead>
            <TableHead className={TH_CLASS}>Location</TableHead>
            <TableHead className={TH_CLASS}>
              <button
                className="flex items-center hover:text-foreground transition-colors"
                onClick={() => onSort("status")}
              >
                Status
                <SortIcon
                  field="status"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className={`${TH_CLASS} text-center`}>Copies</TableHead>
            <TableHead className={`${TH_CLASS} text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow
              key={book.id}
              className="hover:bg-secondary/40 cursor-pointer"
              onClick={() => onViewBook(book)}
            >
              {showCheckboxes && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(book.id)}
                    onCheckedChange={() => onToggleSelect(book.id)}
                  />
                </TableCell>
              )}
              <TableCell className="text-[13px] font-medium max-w-[200px] truncate">
                {book.title}
              </TableCell>
              <TableCell className="text-[13px]">{book.author}</TableCell>
              <TableCell className="text-[12px] text-muted-foreground font-mono">
                {book.isbn}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {book.dewey}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px]">{book.category}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {book.location}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(book.status)}</TableCell>
              <TableCell className="text-center text-[13px]">
                {book.copies}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onViewBook(book)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEditBook(book)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onDeleteBook(book)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
