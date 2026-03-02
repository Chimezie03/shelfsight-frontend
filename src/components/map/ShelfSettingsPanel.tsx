"use client";

import { useCallback, useState } from "react";
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
import { X, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS } from "./data";
import { ShelfViewer } from "./ShelfViewer";
import type { ShelfFlowNode, ShelfFlowEdge, ShelfNodeData, ShelfCategory } from "./types";

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
  nodes: ShelfFlowNode[];
  edges: ShelfFlowEdge[];
  onUpdateNodeData: (nodeId: string, data: Partial<ShelfNodeData>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}

export function ShelfSettingsPanel({
  node,
  nodes,
  edges,
  onUpdateNodeData,
  onDeleteEdge,
  onClose,
}: ShelfSettingsPanelProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

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
                <h3 className="text-sm font-semibold truncate">
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
            <ScrollArea className="flex-1">
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
                    onValueChange={([value]) =>
                      update({ numberOfTiers: value })
                    }
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

                {/* Current Used (for mock data control) */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-used" className="text-xs">
                    Books Stored
                  </Label>
                  <Input
                    id="current-used"
                    type="number"
                    min={0}
                    value={node.data.currentUsed}
                    onChange={(e) =>
                      update({
                        currentUsed: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="h-8 text-xs"
                  />
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
                  onClick={() => setViewerOpen(true)}
                >
                  <Eye className="mr-1.5 h-3 w-3" />
                  View Shelf
                </Button>

                <Separator />

                {/* Connections */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Connections</Label>
                  {(() => {
                    const connectedEdges = edges.filter(
                      (e) => e.source === node.id || e.target === node.id
                    );
                    if (connectedEdges.length === 0) {
                      return (
                        <p className="text-[10px] text-muted-foreground">
                          No connections
                        </p>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-1.5">
                        {connectedEdges.map((edge) => {
                          const otherId =
                            edge.source === node.id
                              ? edge.target
                              : edge.source;
                          const otherNode = nodes.find(
                            (n) => n.id === otherId
                          );
                          const edgeLabel =
                            (edge.data as { label?: string })?.label ??
                            "Connected";
                          return (
                            <div
                              key={edge.id}
                              className="flex items-center justify-between rounded border px-2 py-1"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium truncate">
                                  {otherNode?.data.label ?? otherId}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {edgeLabel}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 flex-shrink-0 text-destructive hover:text-destructive"
                                onClick={() => onDeleteEdge(edge.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {node && (
      <ShelfViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        data={node.data}
      />
    )}
    </>
  );
}
