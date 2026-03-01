"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";
import { useMapCallbacks } from "./MapCallbacksContext";
import type { ShelfEdgeData } from "./types";

const LABEL_PRESETS = ["Adjacent", "Across Aisle", "Same Section", "Overflow"];

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps & { data?: ShelfEdgeData }) {
  const { onDeleteEdge } = useMapCallbacks();
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const label = data?.label ?? "Adjacent";

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleLabelDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const commitLabelChange = useCallback(
    (newLabel: string) => {
      setIsEditing(false);
      if (newLabel && newLabel !== label) {
        setEdges((edges) =>
          edges.map((edge) =>
            edge.id === id
              ? { ...edge, data: { ...edge.data, label: newLabel } }
              : edge
          )
        );
      }
    },
    [id, label, setEdges]
  );

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="nodrag nopan"
            >
              {isEditing ? (
                <select
                  ref={selectRef}
                  defaultValue={label}
                  onChange={(e) => commitLabelChange(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  className="rounded border bg-card px-1.5 py-0.5 text-[9px] shadow-sm outline-none"
                >
                  {LABEL_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  onDoubleClick={handleLabelDoubleClick}
                  className="cursor-pointer rounded-full border bg-card px-2 py-0.5 text-[9px] text-muted-foreground shadow-sm transition-colors hover:border-indigo-300 hover:text-foreground"
                >
                  {label}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-36">
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteEdge(id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Connection
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </EdgeLabelRenderer>
    </>
  );
}
