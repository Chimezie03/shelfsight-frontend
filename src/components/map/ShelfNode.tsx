"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  BookOpen,
  LayoutGrid,
  Square,
  Table,
  Armchair,
  Pencil,
  Copy,
  Trash2,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCapacityPercent, getCapacityFill } from "./utils";
import { useMapCallbacks } from "./MapCallbacksContext";
import { COLOR_PRESETS } from "./data";
import type { ShelfNodeData, ShelfType } from "./types";

const SHELF_TYPE_ICONS: Record<ShelfType, React.ComponentType<{ className?: string }>> = {
  "single-shelf": BookOpen,
  "double-shelf": LayoutGrid,
  "end-cap": Square,
  "display-table": Table,
  "reading-nook": Armchair,
};

const SHELF_TYPE_LABELS: Record<ShelfType, string> = {
  "single-shelf": "Single Shelf",
  "double-shelf": "Double Shelf",
  "end-cap": "End Cap",
  "display-table": "Display Table",
  "reading-nook": "Reading Nook",
};

function ShelfNodeComponent({ id, data, selected }: NodeProps & { data: ShelfNodeData }) {
  const { onUpdateNodeData, onDeleteNode, onDuplicateNode, onCommitChange } =
    useMapCallbacks();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = SHELF_TYPE_ICONS[data.shelfType];
  const totalCapacity = data.numberOfTiers * data.capacityPerTier;
  const capacityPercent = getCapacityPercent(data.currentUsed, totalCapacity);
  const capacityColor = getCapacityFill(data.currentUsed, totalCapacity);

  // Inline editing
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(data.label);
    },
    [data.label]
  );

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.label) {
      onUpdateNodeData(id, { label: trimmed });
      onCommitChange();
    }
  }, [editValue, data.label, id, onUpdateNodeData, onCommitChange]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitEdit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(data.label);
      }
    },
    [commitEdit, data.label]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Context menu color change
  const handleColorChange = useCallback(
    (color: string) => {
      onUpdateNodeData(id, { color });
      onCommitChange();
    },
    [id, onUpdateNodeData, onCommitChange]
  );

  // Tier indicator dots
  const tierDots = Array.from({ length: Math.min(data.numberOfTiers, 8) }, (_, i) => (
    <div
      key={i}
      className="h-1 w-2.5 rounded-sm"
      style={{ backgroundColor: data.color, opacity: 0.5 + (i / data.numberOfTiers) * 0.5 }}
    />
  ));

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
            "hover:shadow-md",
            selected && "ring-2 ring-indigo-600 ring-offset-1 ring-offset-background"
          )}
          style={{
            width: "100%",
            height: "100%",
            borderTopWidth: 3,
            borderTopColor: data.color,
          }}
        >
          {/* NodeResizer — visible only when selected */}
          <NodeResizer
            minWidth={120}
            minHeight={60}
            isVisible={!!selected}
            lineClassName="!border-indigo-400"
            handleClassName="!h-2 !w-2 !rounded-sm !border-2 !border-indigo-400 !bg-background"
          />
          {/* Connection handles — 8 total (4 sides + 4 corners), hidden by default */}
          <Handle
            id="top"
            type="source"
            position={Position.Top}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="top-right"
            type="source"
            position={Position.Top}
            style={{ left: "85%" }}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="right"
            type="source"
            position={Position.Right}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="bottom-right"
            type="source"
            position={Position.Bottom}
            style={{ left: "85%" }}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="bottom-left"
            type="source"
            position={Position.Bottom}
            style={{ left: "15%" }}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="left"
            type="source"
            position={Position.Left}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />
          <Handle
            id="top-left"
            type="source"
            position={Position.Top}
            style={{ left: "15%" }}
            className="!h-1.5 !w-1.5 !rounded-full !border !border-indigo-400 !bg-background !opacity-0 transition-opacity group-hover:!opacity-100"
          />

          {/* Node content */}
          <div className="flex h-full flex-col justify-between p-1.5 overflow-hidden">
            {/* Header row: icon + name + category */}
            <div className="flex items-start gap-1.5">
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: `${data.color}20`, color: data.color }}
              >
                <Icon className="h-3 w-3" />
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-transparent text-xs font-semibold outline-none border-b border-indigo-400 pb-0.5"
                  />
                ) : (
                  <p
                    className="truncate text-xs font-semibold cursor-text"
                    onDoubleClick={handleDoubleClick}
                    title={data.label}
                  >
                    {data.label}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground truncate">
                  {SHELF_TYPE_LABELS[data.shelfType]}
                  {data.sectionCode && ` · ${data.sectionCode}`}
                </p>
              </div>

              <Badge
                variant="secondary"
                className="flex-shrink-0 text-[9px] px-1 py-0"
                style={{
                  backgroundColor: `${data.color}15`,
                  color: data.color,
                  borderColor: `${data.color}30`,
                }}
              >
                {data.category}
              </Badge>
            </div>

            {/* Middle: tier indicators */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {tierDots}
              <span className="ml-1 text-[9px] text-muted-foreground">
                {data.numberOfTiers} tiers
              </span>
            </div>

            {/* Bottom: capacity bar */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground">Capacity</span>
                <span className="text-[9px] font-medium">
                  {data.currentUsed}/{totalCapacity}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(capacityPercent, 100)}%`,
                    backgroundColor: capacityColor,
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem
          onClick={() => {
            setIsEditing(true);
            setEditValue(data.label);
          }}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit Name
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicateNode(id)}>
          <Copy className="mr-2 h-3.5 w-3.5" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="p-2">
          <Palette className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-125",
                  data.color === preset.value
                    ? "border-foreground"
                    : "border-transparent"
                )}
                style={{ backgroundColor: preset.value }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(preset.value);
                }}
                title={preset.name}
              />
            ))}
          </div>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDeleteNode(id)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const ShelfNode = memo(ShelfNodeComponent);
