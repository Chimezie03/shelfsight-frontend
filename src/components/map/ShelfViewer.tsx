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

function BookSpine({ book, index }: { book: ShelfBookDetail; index: number }) {
  const isOut = book.status === "checked-out";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.25 }}
            className="flex-shrink-0 rounded-sm border cursor-default select-none"
            style={{
              width: book.spineWidth,
              height: "100%",
              backgroundColor: isOut ? "transparent" : book.spineColor,
              borderStyle: isOut ? "dashed" : "solid",
              borderColor: isOut ? "var(--border)" : `${book.spineColor}80`,
              opacity: isOut ? 0.4 : 1,
            }}
          >
            <div
              className="flex h-full items-center justify-center overflow-hidden px-0.5"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              <span
                className="truncate text-[7px] font-medium leading-tight"
                style={{ color: isOut ? "var(--muted-foreground)" : "#fff", textShadow: isOut ? "none" : "0 1px 2px rgba(0,0,0,0.5)" }}
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
            <p className="text-[10px] text-muted-foreground">ISBN: {book.isbn}</p>
            <p className="text-[10px] text-muted-foreground">Dewey: {book.dewey}</p>
            <Badge
              variant={isOut ? "destructive" : "secondary"}
              className="text-[9px] px-1 py-0 mt-1"
            >
              {isOut ? "Checked Out" : "Available"}
            </Badge>
            {isOut && book.dueDate && (
              <p className="text-[9px] text-muted-foreground">Due: {book.dueDate}</p>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">{data.label}</DialogTitle>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{data.category}</span>
            {data.deweyRangeStart && (
              <>
                <span>·</span>
                <span>Dewey {data.deweyRangeStart}–{data.deweyRangeEnd}</span>
              </>
            )}
            {data.sectionCode && (
              <>
                <span>·</span>
                <span>Section {data.sectionCode}</span>
              </>
            )}
            <span>·</span>
            <span>{data.currentUsed}/{totalCapacity} books</span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Shelf frame */}
          <div className="rounded-lg border-2 border-amber-800/30 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-700/30 overflow-hidden">
            {/* Side panels decorative */}
            <div className="relative">
              {tiers.map((tier, tierIdx) => {
                const emptySlots = Math.max(0, Math.min(tier.capacity - tier.books.length, 20));
                return (
                  <div key={tier.tierNumber}>
                    {/* Tier label bar */}
                    <div className="flex items-center justify-between px-3 py-1 bg-amber-800/10 dark:bg-amber-700/10">
                      <span className="text-[9px] font-medium text-amber-900 dark:text-amber-300">
                        Tier {tier.tierNumber}
                      </span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400">
                        {tier.books.length} / {tier.capacity} books
                      </span>
                    </div>

                    {/* Books row */}
                    <div className="flex items-end gap-[2px] px-3 py-2 min-h-[80px]">
                      {tier.books.map((book, bookIdx) => (
                        <BookSpine
                          key={book.id}
                          book={book}
                          index={tierIdx * 10 + bookIdx}
                        />
                      ))}
                      {/* Empty slots */}
                      {Array.from({ length: emptySlots }, (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex-shrink-0 rounded-sm border border-dashed border-amber-800/20 dark:border-amber-600/20"
                          style={{ width: 14, height: "60%" }}
                        />
                      ))}
                    </div>

                    {/* Wooden shelf divider */}
                    {tierIdx < tiers.length - 1 && (
                      <div className="h-1.5 bg-gradient-to-b from-amber-700/40 to-amber-800/20 dark:from-amber-600/30 dark:to-amber-700/10 shadow-sm" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm bg-amber-800" />
              <span className="text-[9px] text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm border border-dashed opacity-40" />
              <span className="text-[9px] text-muted-foreground">Checked Out</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-2 rounded-sm border border-dashed border-amber-800/20" />
              <span className="text-[9px] text-muted-foreground">Empty Slot</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
