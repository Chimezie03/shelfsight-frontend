"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, MapPin } from "lucide-react";
import type { Book } from "@/types/book";

interface CatalogGridProps {
  books: Book[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onViewBook: (book: Book) => void;
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

export function CatalogGrid({
  books,
  isLoading,
  selectedIds,
  onToggleSelect,
  onViewBook,
  userRole,
}: CatalogGridProps) {
  const showCheckboxes = userRole === "ADMIN";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-40 w-full mb-3 rounded-lg" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {books.map((book) => (
        <Card
          key={book.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedIds.has(book.id)
              ? "border-brand-copper ring-1 ring-brand-copper/30"
              : ""
          }`}
          onClick={() => onViewBook(book)}
        >
          <CardContent className="p-4 relative">
            {showCheckboxes && (
              <div
                className="absolute top-3 right-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(book.id)}
                  onCheckedChange={() => onToggleSelect(book.id)}
                />
              </div>
            )}

            {/* Cover placeholder */}
            <div className="h-36 bg-gradient-to-br from-brand-navy/5 to-brand-copper/5 rounded-lg mb-3 flex items-center justify-center">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen className="w-10 h-10 text-brand-navy/20" />
              )}
            </div>

            {/* Info */}
            <h3 className="text-sm font-medium leading-tight line-clamp-2 mb-1">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {book.author}
            </p>

            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(book.status)}
              <Badge variant="outline" className="text-[10px] font-mono">
                {book.dewey}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {book.location}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
