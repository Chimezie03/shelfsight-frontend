"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS } from "./data";
import { ShelfViewer } from "./ShelfViewer";
import type { ShelfFlowNode, ShelfNodeData, ShelfCategory } from "./types";

const CATEGORIES: ShelfCategory[] = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "History",
  "Children's",
  "Reference",
  "Periodicals",
  "Special Collections",
  "Uncategorized",
];

interface ShelfSettingsPanelProps {
  node: ShelfFlowNode | null;
  onUpdateNodeData: (nodeId: string, data: Partial<ShelfNodeData>) => void;
  onClose: () => void;
  shelfViewerOpen: boolean;
  onShelfViewerOpenChange: (open: boolean) => void;
}

export function ShelfSettingsPanel({
  node,
  onUpdateNodeData,
  onClose,
  shelfViewerOpen,
  onShelfViewerOpenChange,
}: ShelfSettingsPanelProps) {
  const [tierCapsDraft, setTierCapsDraft] = useState("");

  useEffect(() => {
    if (!node) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft when selected shelf or tier caps change
    setTierCapsDraft(node.data.tierCapacities?.join(", ") ?? "");
  }, [node?.id, node?.data.tierCapacities]);

  const update = useCallback(
    (data: Partial<ShelfNodeData>) => {
      if (node) {
        onUpdateNodeData(node.id, data);
      }
    },
    [node, onUpdateNodeData]
  );

  return (
    <>
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="h-full flex-shrink-0 overflow-hidden border-l bg-card"
        >
          <div className="flex h-full w-[280px] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
              <div className="min-w-0">
                <h3 className="text-sm font-display font-semibold truncate">
                  {node.data.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Shelf Settings
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Separator />

            {/* Form fields */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-3.5 p-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="shelf-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="shelf-name"
                    value={node.data.label}
                    onChange={(e) => update({ label: e.target.value })}
                    placeholder="e.g. Shelf A-12"
                    className="h-8 text-xs"
                  />
                </div>

                {/* Section Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="section-code" className="text-xs">
                    Section Code
                  </Label>
                  <Input
                    id="section-code"
                    value={node.data.sectionCode}
                    onChange={(e) => update({ sectionCode: e.target.value })}
                    placeholder="e.g. A-12"
                    className="h-8 text-xs"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={node.data.category}
                    onValueChange={(value) =>
                      update({ category: value as ShelfCategory })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dewey Range */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Dewey Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={node.data.deweyRangeStart}
                      onChange={(e) =>
                        update({ deweyRangeStart: e.target.value })
                      }
                      placeholder="000"
                      className="h-8 text-xs text-center"
                    />
                    <span className="text-sm text-muted-foreground">–</span>
                    <Input
                      value={node.data.deweyRangeEnd}
                      onChange={(e) =>
                        update({ deweyRangeEnd: e.target.value })
                      }
                      placeholder="999"
                      className="h-8 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Number of Tiers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Number of Tiers</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {node.data.numberOfTiers}
                    </span>
                  </div>
                  <Slider
                    value={[node.data.numberOfTiers]}
                    onValueChange={([value]) => {
                      const caps = node.data.tierCapacities;
                      const nextCaps =
                        caps && caps.length === value ? caps : null;
                      update({ numberOfTiers: value, tierCapacities: nextCaps });
                    }}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>

                {/* Capacity per Tier */}
                <div className="space-y-1.5">
                  <Label htmlFor="capacity-per-tier" className="text-xs">
                    Capacity per Tier
                  </Label>
                  <Input
                    id="capacity-per-tier"
                    type="number"
                    min={1}
                    value={node.data.capacityPerTier}
                    onChange={(e) =>
                      update({
                        capacityPerTier: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tier-caps" className="text-xs">
                    Per-tier capacities (optional)
                  </Label>
                  <Textarea
                    id="tier-caps"
                    rows={2}
                    value={tierCapsDraft}
                    onChange={(e) => setTierCapsDraft(e.target.value)}
                    onBlur={() => {
                      if (!node) return;
                      const raw = tierCapsDraft.trim();
                      if (!raw) {
                        update({ tierCapacities: null });
                        return;
                      }
                      const parts = raw.split(",").map((s) => parseInt(s.trim(), 10));
                      if (parts.some((n) => !Number.isFinite(n) || n < 1)) {
                        toast.error(
                          "Use positive whole numbers separated by commas, or leave empty.",
                        );
                        setTierCapsDraft(node.data.tierCapacities?.join(", ") ?? "");
                        return;
                      }
                      if (parts.length !== node.data.numberOfTiers) {
                        toast.error(
                          `Provide exactly ${node.data.numberOfTiers} values (one per tier), or leave empty.`,
                        );
                        setTierCapsDraft(node.data.tierCapacities?.join(", ") ?? "");
                        return;
                      }
                      update({ tierCapacities: parts });
                    }}
                    placeholder="e.g. 40, 35, 30, 30"
                    className="min-h-[52px] text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Leave empty to use the same capacity for every tier. You can still shelve more books than these
                    soft limits.
                  </p>
                </div>

                {/* Current Used (computed from real data) */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Books Stored (computed)
                  </Label>
                  <div className="flex h-8 items-center rounded-md border bg-muted px-3 text-xs text-muted-foreground">
                    {node.data.currentUsed}
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                          node.data.color === preset.value
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => update({ color: preset.value })}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Rotation</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {node.data.rotation}°
                    </span>
                  </div>
                  <Slider
                    value={[node.data.rotation]}
                    onValueChange={([value]) => update({ rotation: value })}
                    min={0}
                    max={359}
                    step={1}
                  />
                  <div className="flex gap-1.5">
                    {[0, 90, 180, 270].map((deg) => (
                      <Button
                        key={deg}
                        variant={node.data.rotation === deg ? "secondary" : "outline"}
                        size="sm"
                        className="h-6 flex-1 text-[10px]"
                        onClick={() => update({ rotation: deg })}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="shelf-notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="shelf-notes"
                    value={node.data.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder="Add notes about this shelf..."
                    rows={3}
                    className="text-xs"
                  />
                </div>

                {/* View Shelf */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => onShelfViewerOpenChange(true)}
                >
                  <Eye className="mr-1.5 h-3 w-3" />
                  View Shelf
                </Button>

              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {node && (
      <ShelfViewer
        open={shelfViewerOpen}
        onOpenChange={onShelfViewerOpenChange}
        data={node.data}
        shelfId={node.id}
      />
    )}
    </>
  );
}
