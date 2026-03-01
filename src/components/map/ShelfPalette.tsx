"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpen,
  LayoutGrid,
  Square,
  Table,
  Armchair,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
        "hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20",
        "active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/30"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{template.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {template.description}
        </p>
      </div>
    </div>
  );
}

export function ShelfPalette({ isOpen, onToggle }: ShelfPaletteProps) {
  return (
    <div className="relative flex-shrink-0">
      {/* Toggle button — always visible */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-3 z-10 h-5 w-5 rounded-full border bg-card shadow-sm"
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeft className="h-2.5 w-2.5" />
        ) : (
          <ChevronRight className="h-2.5 w-2.5" />
        )}
      </Button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="h-full overflow-hidden border-r bg-card"
          >
            <div className="flex h-full w-[200px] flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                <h3 className="text-xs font-semibold">Shelf Templates</h3>
              </div>
              <p className="px-3 pb-1.5 text-[10px] text-muted-foreground">
                Drag a template onto the canvas to add it.
              </p>

              <Separator />

              {/* Template list */}
              <ScrollArea className="flex-1 px-2 py-2">
                <div className="flex flex-col gap-2">
                  {SHELF_TEMPLATES.map((template) => (
                    <DraggableTemplateCard
                      key={template.type}
                      template={template}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
