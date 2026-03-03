"use client";

import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Map,
  Undo2,
  Redo2,
  Save,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface CanvasToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onClear: () => void;
  onExportImage: () => void;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "ghost" | "destructive";
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  variant = "ghost",
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant === "destructive" ? "ghost" : "ghost"}
          size="icon"
          className={cn(
            "h-7 w-7",
            active && "bg-brand-copper/10 text-brand-copper dark:bg-brand-copper/20 dark:text-brand-copper",
            variant === "destructive" &&
              "text-destructive hover:text-destructive hover:bg-destructive/10"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function CanvasToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  snapToGrid,
  onToggleSnapToGrid,
  showMinimap,
  onToggleMinimap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onClear,
  onExportImage,
}: CanvasToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 rounded-lg border bg-card/80 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
        {/* Zoom controls */}
        <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
        <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
        <ToolbarButton icon={Maximize} label="Fit View" onClick={onFitView} />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Canvas toggles */}
        <ToolbarButton
          icon={Grid3X3}
          label={snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"}
          onClick={onToggleSnapToGrid}
          active={snapToGrid}
        />
        <ToolbarButton
          icon={Map}
          label={showMinimap ? "Hide Minimap" : "Show Minimap"}
          onClick={onToggleMinimap}
          active={showMinimap}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Undo / Redo */}
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
          disabled={!canRedo}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Save */}
        <ToolbarButton icon={Save} label="Save Layout" onClick={onSave} />

        {/* Clear Canvas with confirmation */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Clear Canvas</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all shelf nodes from the canvas.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClear}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export */}
        <ToolbarButton icon={Download} label="Export as Image" onClick={onExportImage} />
      </div>
    </TooltipProvider>
  );
}
