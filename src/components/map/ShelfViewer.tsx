"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useCheckoutCart, type CartItem } from "@/components/checkout-cart-provider";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { generateShelfTiers } from "./shelfViewerData";
import type { ShelfNodeData, ShelfBookDetail, ShelfTierData } from "./types";

interface BookCopyResponse {
  id: string;
  barcode: string;
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'LOST' | 'PROCESSING';
  shelfId: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    genre: string | null;
    deweyDecimal: string | null;
    coverImageUrl: string | null;
  };
  activeLoan: { dueDate: string; checkedOutAt: string } | null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const SPINE_COLORS = [
  "#8B4513", "#A0522D", "#D2691E", "#CD853F", "#DEB887",
  "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560",
  "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#b7e4c7",
  "#6d6875", "#b5838d", "#e5989b", "#ffb4a2", "#ffcdb2",
  "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51",
];

function deterministicColor(title: string): string {
  return SPINE_COLORS[hashString(title) % SPINE_COLORS.length];
}

function transformCopiesToTiers(
  copies: BookCopyResponse[],
  numberOfTiers: number,
  capacityPerTier: number,
): ShelfTierData[] {
  const tiers: ShelfTierData[] = [];
  let copyIdx = 0;

  for (let t = 0; t < numberOfTiers; t++) {
    const books: ShelfBookDetail[] = [];
    const tierCapacity = capacityPerTier;
    const booksForTier = copies.slice(copyIdx, copyIdx + tierCapacity);
    copyIdx += tierCapacity;

    for (const copy of booksForTier) {
      books.push({
        id: copy.id,
        title: copy.book.title,
        author: copy.book.author,
        isbn: copy.book.isbn,
        dewey: copy.book.deweyDecimal || '',
        status: copy.status === 'CHECKED_OUT' ? 'checked-out' : 'available',
        dueDate: copy.activeLoan?.dueDate || null,
        spineColor: deterministicColor(copy.book.title),
        spineWidth: 20 + (hashString(copy.book.isbn) % 20),
      });
    }

    tiers.push({
      tierNumber: t + 1,
      books,
      capacity: capacityPerTier,
    });
  }

  return tiers;
}

interface ShelfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShelfNodeData;
  shelfId: string;
}

/** Spine height based on tier count — taller when fewer tiers */
function getSpineHeight(tierCount: number) {
  if (tierCount <= 3) return 90;
  if (tierCount <= 4) return 76;
  if (tierCount <= 6) return 60;
  return 48;
}

function BookSpine({
  book,
  index,
  spineHeight,
  copyData,
}: {
  book: ShelfBookDetail;
  index: number;
  spineHeight: number;
  copyData?: BookCopyResponse;
}) {
  const isOut = book.status === "checked-out";
  const cart = useCheckoutCart();
  const inCart = copyData ? cart.has(copyData.id) : false;
  // Slight height variation per book (±8px) so they look natural
  const heightVariation = ((book.spineWidth * 3) % 13) - 6;
  const height = spineHeight + heightVariation;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyData || isOut || inCart) return;
    cart.addItem({
      bookCopyId: copyData.id,
      bookId: copyData.book.id,
      title: copyData.book.title,
      author: copyData.book.author,
      isbn: copyData.book.isbn,
      barcode: copyData.barcode,
    });
    toast.success(`Added "${copyData.book.title}" to checkout cart`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.015, duration: 0.2 }}
            className={`rounded-sm border select-none flex-shrink-0 ${!isOut && copyData ? "cursor-pointer" : "cursor-default"}`}
            style={{
              width: book.spineWidth,
              height,
              backgroundColor: isOut ? "transparent" : inCart ? "#22c55e" : book.spineColor,
              borderStyle: isOut ? "dashed" : "solid",
              borderColor: isOut ? "var(--border)" : inCart ? "#16a34a" : `${book.spineColor}80`,
              opacity: isOut ? 0.4 : 1,
            }}
            onClick={handleAddToCart}
          >
            <div
              className="h-full w-full flex items-center justify-center overflow-hidden"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              <span
                className="font-medium"
                style={{
                  fontSize: spineHeight >= 70 ? 9 : 8,
                  lineHeight: 1,
                  color: isOut ? "var(--muted-foreground)" : "#fff",
                  textShadow: isOut ? "none" : "0 1px 2px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxHeight: "calc(100% - 8px)",
                }}
              >
                {book.title}
              </span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold">{book.title}</p>
            <p className="text-[10px] text-muted-foreground">{book.author}</p>
            <p className="text-[10px] text-muted-foreground">
              ISBN: {book.isbn}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Dewey: {book.dewey}
            </p>
            <Badge
              variant={isOut ? "destructive" : "secondary"}
              className="text-[9px] px-1 py-0 mt-1"
            >
              {isOut ? "Checked Out" : "Available"}
            </Badge>
            {isOut && book.dueDate && (
              <p className="text-[9px] text-muted-foreground">
                Due: {book.dueDate}
              </p>
            )}
            {!isOut && copyData && (
              <Button
                size="sm"
                variant={inCart ? "secondary" : "default"}
                className="mt-1.5 h-6 text-[10px] w-full"
                onClick={handleAddToCart}
                disabled={inCart}
              >
                {inCart ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    In Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add to Cart
                  </>
                )}
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ShelfViewer({ open, onOpenChange, data, shelfId }: ShelfViewerProps) {
  const [apiTiers, setApiTiers] = useState<ShelfTierData[] | null>(null);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [copyMap, setCopyMap] = useState<Map<string, BookCopyResponse>>(new Map());
  const cart = useCheckoutCart();
  const router = useRouter();

  const isNewNode = shelfId.startsWith('new-');
  const fallbackTiers = useMemo(() => generateShelfTiers(data), [data]);

  // Fetch real book data when dialog opens for saved shelves
  useEffect(() => {
    if (!open || isNewNode) {
      setApiTiers(null);
      setCopyMap(new Map());
      return;
    }

    let cancelled = false;
    async function fetchBooks() {
      setIsLoadingBooks(true);
      try {
        const copies = await apiFetch<BookCopyResponse[]>(`/map/${shelfId}/books`);
        if (cancelled) return;
        setApiTiers(transformCopiesToTiers(copies, data.numberOfTiers, data.capacityPerTier));
        setCopyMap(new Map(copies.map((c) => [c.id, c])));
      } catch {
        if (cancelled) return;
        setApiTiers(null);
        setCopyMap(new Map());
      } finally {
        if (!cancelled) setIsLoadingBooks(false);
      }
    }
    fetchBooks();
    return () => { cancelled = true; };
  }, [open, shelfId, isNewNode, data.numberOfTiers, data.capacityPerTier]);

  const tiers = apiTiers ?? fallbackTiers;

  const totalCapacity = data.numberOfTiers * data.capacityPerTier;
  const spineHeight = getSpineHeight(tiers.length);
  const tierMinHeight = spineHeight + 12;
  // Show fewer empty slots for compactness — just enough to hint at remaining capacity
  const maxEmptySlots = tiers.length <= 4 ? 8 : 4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[85vw] !max-w-6xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-display">{data.label}</DialogTitle>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{data.category}</span>
            {data.deweyRangeStart && (
              <>
                <span>·</span>
                <span>
                  Dewey {data.deweyRangeStart}–{data.deweyRangeEnd}
                </span>
              </>
            )}
            {data.sectionCode && (
              <>
                <span>·</span>
                <span>Section {data.sectionCode}</span>
              </>
            )}
            <span>·</span>
            <span>
              {data.currentUsed}/{totalCapacity} books
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoadingBooks ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading books...</p>
              </div>
            </div>
          ) : !isNewNode && apiTiers && tiers.every(t => t.books.length === 0) ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">No books shelved here yet</p>
            </div>
          ) : (
          <>
          {/* Horizontally scrollable wrapper for narrow screens */}
          <div className="overflow-x-auto">
          {/* Shelf frame — min-width ensures readability; scrolls horizontally on small screens */}
          <div className="rounded-lg border-2 border-amber-800/30 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-700/30 overflow-hidden min-w-[700px]">
            <div className="relative">
              {tiers.map((tier, tierIdx) => {
                const emptySlots = Math.max(
                  0,
                  Math.min(tier.capacity - tier.books.length, maxEmptySlots)
                );
                return (
                  <div key={tier.tierNumber}>
                    {/* Tier label bar */}
                    <div className="flex items-center justify-between px-3 py-0.5 bg-amber-800/10 dark:bg-amber-700/10">
                      <span className="text-[9px] font-medium text-amber-900 dark:text-amber-300">
                        Tier {tier.tierNumber}
                      </span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400">
                        {tier.books.length} / {tier.capacity} books
                      </span>
                    </div>

                    {/* Books row */}
                    <div
                      className="flex items-end gap-[2px] px-2 py-1.5"
                      style={{ minHeight: tierMinHeight }}
                    >
                      {tier.books.map((book, bookIdx) => (
                        <BookSpine
                          key={book.id}
                          book={book}
                          index={tierIdx * 10 + bookIdx}
                          spineHeight={spineHeight}
                          copyData={copyMap.get(book.id)}
                        />
                      ))}
                      {/* Empty slots — capped for compactness */}
                      {Array.from({ length: emptySlots }, (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="rounded-sm border border-dashed border-amber-800/20 dark:border-amber-600/20 flex-shrink-0"
                          style={{
                            width: 12,
                            height: Math.round(spineHeight * 0.6),
                          }}
                        />
                      ))}
                    </div>

                    {/* Wooden shelf divider */}
                    {tierIdx < tiers.length - 1 && (
                      <div className="h-1 bg-gradient-to-b from-amber-700/40 to-amber-800/20 dark:from-amber-600/30 dark:to-amber-700/10 shadow-sm" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm bg-amber-800" />
              <span className="text-[9px] text-muted-foreground">
                Available
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm border border-dashed opacity-40" />
              <span className="text-[9px] text-muted-foreground">
                Checked Out
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm border border-dashed border-amber-800/20" />
              <span className="text-[9px] text-muted-foreground">
                Empty Slot
              </span>
            </div>
          </div>
          </>
          )}
        </ScrollArea>

        {cart.count > 0 && (
          <div className="flex items-center justify-between border-t pt-3 mt-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium">
                {cart.count} {cart.count === 1 ? "book" : "books"} in cart
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-[11px] h-7" onClick={() => cart.clear()}>
                Clear Cart
              </Button>
              <Button
                size="sm"
                className="text-[11px] h-7 bg-brand-navy text-white hover:bg-brand-navy/90"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/circulation");
                }}
              >
                Go to Checkout
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
