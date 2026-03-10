"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  MapPin,
  Edit,
  Trash2,
  Calendar,
  Globe,
  Building,
  Hash,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Book } from "@/types/book";
import { getDeweyCategory } from "../constants";

interface BookDetailSheetProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  userRole?: string;
}

function getStatusBadge(status: Book["status"]) {
  switch (status) {
    case "available":
      return (
        <Badge className="bg-brand-sage/15 text-brand-sage border-0 text-[11px]">
          Available
        </Badge>
      );
    case "checked-out":
      return (
        <Badge className="bg-brand-amber/15 text-brand-amber border-0 text-[11px]">
          Checked Out
        </Badge>
      );
    case "maintenance":
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-[11px]">
          Maintenance
        </Badge>
      );
  }
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export function BookDetailSheet({
  book,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  userRole,
}: BookDetailSheetProps) {
  const canEdit = userRole === "ADMIN" || userRole === "STAFF";
  const canDelete = userRole === "ADMIN";

  if (!book) return null;

  const deweyCategory = getDeweyCategory(book.dewey);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Cover */}
            <div className="w-20 h-28 bg-gradient-to-br from-brand-navy/5 to-brand-copper/5 rounded-lg flex items-center justify-center shrink-0">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen className="w-8 h-8 text-brand-navy/20" />
              )}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-display leading-tight mb-1">
                {book.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mb-2">
                {book.author}
              </p>
              {getStatusBadge(book.status)}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Bibliographic Details */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Bibliographic Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow icon={Hash} label="ISBN" value={book.isbn} />
                <DetailRow
                  icon={BookOpen}
                  label="Dewey Decimal"
                  value={`${book.dewey} — ${deweyCategory}`}
                />
                <DetailRow
                  icon={Building}
                  label="Publisher"
                  value={book.publisher || "—"}
                />
                <DetailRow
                  icon={Calendar}
                  label="Year"
                  value={book.publishYear && book.publishYear > 0 ? book.publishYear : "—"}
                />
                <DetailRow
                  icon={FileText}
                  label="Edition"
                  value={book.edition || "—"}
                />
                <DetailRow
                  icon={Globe}
                  label="Language"
                  value={book.language}
                />
                <DetailRow
                  icon={FileText}
                  label="Pages"
                  value={book.pageCount}
                />
                <DetailRow
                  icon={BookOpen}
                  label="Category"
                  value={book.category}
                />
              </div>
            </div>

            <Separator />

            {/* Location & Availability */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Location & Availability
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{book.location}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {book.copies} {book.copies === 1 ? "copy" : "copies"} total
              </p>
            </div>

            {/* Description */}
            {book.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {book.description}
                  </p>
                </div>
              </>
            )}

            {/* Subjects */}
            {book.subjects.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Subjects
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {book.subjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant="outline"
                        className="text-[11px]"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Dates */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Date Added
                </p>
                <p>{format(parseISO(book.dateAdded), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Last Modified
                </p>
                <p>{format(parseISO(book.lastModified), "MMM d, yyyy")}</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex items-center gap-2 w-full">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onEdit(book);
                  onOpenChange(false);
                }}
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit Book
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive ml-auto"
                onClick={() => {
                  onDelete(book);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
