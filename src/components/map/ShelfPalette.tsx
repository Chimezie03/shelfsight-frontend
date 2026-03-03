"use client";

import { useCallback, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpen,
  LayoutGrid,
  Square,
  Table,
  Armchair,
  PanelLeftOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SHELF_TEMPLATES } from "./data";
import type { ShelfTemplate } from "./types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  LayoutGrid,
  Square,
  Table,
  Armchair,
};

const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;

interface ShelfPaletteProps {
  isOpen: boolean;
  onToggle: () => void;
}

function DraggableTemplateCard({ template }: { template: ShelfTemplate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${template.type}`,
      data: { template },
    });

  const Icon = ICON_MAP[template.icon];

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card p-2 cursor-grab transition-colors",
        "hover:border-brand-copper/40 hover:bg-brand-copper/5 dark:hover:border-brand-copper/30 dark:hover:bg-brand-copper/10",
        "active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand-copper/10 dark:bg-brand-copper/20">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-brand-copper dark:text-brand-copper" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium truncate">{template.label}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">
          {template.description}
        </p>
      </div>
    </div>
  );
}

export function ShelfPalette({ isOpen, onToggle }: ShelfPaletteProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const handleMove = (ev: PointerEvent) => {
        if (!isResizing.current) return;
        const delta = ev.clientX - startX.current;
        const newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth.current + delta)
        );
        setWidth(newWidth);
      };

      const handleUp = () => {
        isResizing.current = false;
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [width]
  );

  if (!isOpen) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className="flex-shrink-0 h-full w-10 border-r bg-card flex flex-col items-center pt-3 gap-3 hover:bg-accent/50 transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
              <span
                className="text-[10px] font-medium text-muted-foreground"
                style={{
                  writingMode: "vertical-lr",
                  textOrientation: "mixed",
                }}
              >
                Templates
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Open Shelf Templates</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative flex-shrink-0 flex" style={{ width }}>
      {/* Panel content */}
      <div
        className="h-full overflow-hidden border-r bg-card flex flex-col"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <h3 className="text-sm font-display font-semibold">
            Shelf Templates
          </h3>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <PanelLeftOpen className="h-3.5 w-3.5 rotate-180" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Collapse panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="px-3 pb-1.5 text-xs text-muted-foreground">
          Drag a template onto the canvas to add it.
        </p>

        <Separator />

        {/* Template list */}
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="flex flex-col gap-2">
            {SHELF_TEMPLATES.map((template) => (
              <DraggableTemplateCard key={template.type} template={template} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 group"
      >
        <div className="w-full h-full group-hover:bg-brand-copper/30 group-active:bg-brand-copper/50 transition-colors" />
      </div>
    </div>
  );
}
