"use client";

import { useMemo } from "react";
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
import { generateShelfTiers } from "./shelfViewerData";
import type { ShelfNodeData, ShelfBookDetail } from "./types";

interface ShelfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShelfNodeData;
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
}: {
  book: ShelfBookDetail;
  index: number;
  spineHeight: number;
}) {
  const isOut = book.status === "checked-out";
  // Slight height variation per book (±8px) so they look natural
  const heightVariation = ((book.spineWidth * 3) % 13) - 6;
  const height = spineHeight + heightVariation;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.015, duration: 0.2 }}
            className="rounded-sm border cursor-default select-none flex-shrink-0"
            style={{
              width: book.spineWidth,
              height,
              backgroundColor: isOut ? "transparent" : book.spineColor,
              borderStyle: isOut ? "dashed" : "solid",
              borderColor: isOut ? "var(--border)" : `${book.spineColor}80`,
              opacity: isOut ? 0.4 : 1,
            }}
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
        <TooltipContent side="top" className="max-w-[200px]">
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
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ShelfViewer({ open, onOpenChange, data }: ShelfViewerProps) {
  const tiers = useMemo(() => generateShelfTiers(data), [data]);

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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
