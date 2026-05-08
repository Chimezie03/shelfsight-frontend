"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
} from "@xyflow/react";
import {
  DndContext,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, Library, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { MapCanvas } from "@/components/map/MapCanvas";
import { ShelfPalette } from "@/components/map/ShelfPalette";
import { ShelfSettingsPanel } from "@/components/map/ShelfSettingsPanel";
import { CanvasToolbar } from "@/components/map/CanvasToolbar";
import { useMapHistory } from "@/components/map/useMapHistory";
import {
  MapCallbacksContext,
  type MapCallbacks,
} from "@/components/map/MapCallbacksContext";
import type { ShelfFlowNode, ShelfNodeData, ShelfTemplate } from "@/components/map/types";
import { computeLayoutSignature } from "@/components/map/mapLayoutSignature";

interface PlacementHintsPayload {
  unshelvedCount: number;
  genreCounts: Record<string, number>;
  shelfHints: Array<{
    shelfId: string;
    label: string;
    category: string | null;
    estimatedMatchCount: number;
    note: string;
  }>;
}

interface BackendShelfSection {
  id: string;
  label: string;
  mapX: number;
  mapY: number;
  width: number;
  height: number;
  floor: number;
  sectionCode: string | null;
  category: string;
  deweyRangeStart: string | null;
  deweyRangeEnd: string | null;
  numberOfTiers: number;
  capacityPerTier: number;
  color: string;
  rotation: number;
  notes: string | null;
  shelfType: string;
  currentUsed: number;
  tierCapacities?: number[] | null;
}

/** Merge server shelf stats into existing nodes without moving positions (occupancy / tiers). */
function mergeShelfSectionsIntoNodes(
  prev: ShelfFlowNode[],
  sections: BackendShelfSection[],
): ShelfFlowNode[] {
  if (prev.length === 0 && sections.length > 0) {
    return sections.map(transformBackendToNode);
  }
  const byId = new Map(sections.map((s) => [s.id, s]));
  return prev.map((node) => {
    const s = byId.get(node.id);
    if (!s) return node;
    const tierCapacities =
      Array.isArray(s.tierCapacities) && s.tierCapacities.length > 0
        ? s.tierCapacities.filter((n): n is number => typeof n === "number" && n >= 1)
        : node.data.tierCapacities;
    return {
      ...node,
      data: {
        ...node.data,
        currentUsed: s.currentUsed ?? 0,
        numberOfTiers: s.numberOfTiers ?? node.data.numberOfTiers,
        capacityPerTier: s.capacityPerTier ?? node.data.capacityPerTier,
        tierCapacities,
      } as ShelfNodeData,
    };
  });
}

function transformBackendToNode(section: BackendShelfSection): ShelfFlowNode {
  return {
    id: section.id,
    type: 'shelf' as const,
    position: { x: section.mapX, y: section.mapY },
    style: { width: section.width, height: section.height },
    data: {
      label: section.label,
      shelfType: section.shelfType || 'single-shelf',
      category: section.category || 'Uncategorized',
      deweyRangeStart: section.deweyRangeStart || '',
      deweyRangeEnd: section.deweyRangeEnd || '',
      numberOfTiers: section.numberOfTiers || 4,
      capacityPerTier: section.capacityPerTier || 30,
      tierCapacities:
        Array.isArray(section.tierCapacities) && section.tierCapacities.length > 0
          ? section.tierCapacities.filter((n): n is number => typeof n === 'number' && n >= 1)
          : null,
      currentUsed: section.currentUsed || 0,
      sectionCode: section.sectionCode || '',
      notes: section.notes || '',
      color: section.color || '#1B2A4A',
      rotation: section.rotation || 0,
      width: section.width,
      height: section.height,
    } as ShelfNodeData,
  };
}

function MapPageContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ShelfFlowNode>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [shelfViewerOpen, setShelfViewerOpen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedLayoutSignature, setSavedLayoutSignature] = useState("");
  const lastSavedNodesRef = useRef<ShelfFlowNode[]>([]);
  const [placementHints, setPlacementHints] = useState<PlacementHintsPayload | null>(null);
  const [shelvingAssistantDismissed, setShelvingAssistantDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("shelving-assistant-dismissed") === "1") {
        setShelvingAssistantDismissed(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const dismissShelvingAssistant = useCallback(() => {
    setShelvingAssistantDismissed(true);
    try {
      localStorage.setItem("shelving-assistant-dismissed", "1");
    } catch {
      /* ignore storage errors */
    }
  }, []);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const shelfIdParam = searchParams.get("shelfId");
  const shelfQueryParam = shelfIdParam || searchParams.get("shelf");
  const openViewerFromUrl = searchParams.get("viewer") === "1";
  const occupancyRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Avoid re-applying ?shelfId / ?viewer when occupancy refresh updates nodes. */
  const shelfUrlAppliedSigRef = useRef<string>("");

  const { pushSnapshot, undo, redo, canUndo, canRedo, isProgrammatic } =
    useMapHistory([]);
  const reactFlowInstance = useReactFlow();
  const nodeIdCounter = useRef(1);

  const establishBaseline = useCallback((next: ShelfFlowNode[]) => {
    lastSavedNodesRef.current = structuredClone(next);
    setSavedLayoutSignature(computeLayoutSignature(next));
  }, []);
  const establishBaselineRef = useRef(establishBaseline);
  establishBaselineRef.current = establishBaseline;

  const currentLayoutSignature = useMemo(
    () => computeLayoutSignature(nodes),
    [nodes],
  );

  const layoutDirty =
    !isLoading &&
    savedLayoutSignature.length > 0 &&
    currentLayoutSignature !== savedLayoutSignature;

  useEffect(() => {
    if (!layoutDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [layoutDirty]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    async function loadHints() {
      try {
        const data = await apiFetch<PlacementHintsPayload>("/map/placement-hints");
        if (!cancelled) setPlacementHints(data);
      } catch {
        if (!cancelled) setPlacementHints(null);
      }
    }
    void loadHints();
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  // Load map data from API on mount
  useEffect(() => {
    let cancelled = false;
    async function loadMap() {
      try {
        const sections = await apiFetch<BackendShelfSection[]>('/map');
        if (cancelled) return;
        if (sections && sections.length > 0) {
          const loaded = sections.map(transformBackendToNode);
          setNodes(loaded);
          pushSnapshot(loaded);
          nodeIdCounter.current = loaded.length + 1;
          // Auto-select shelf from query param (e.g. ?shelfId=uuid or ?shelf=823)
          if (shelfQueryParam) {
            let match: ShelfFlowNode | undefined;
            if (shelfIdParam) {
              // Direct ID match
              match = loaded.find((n) => n.id === shelfIdParam);
            } else {
              // Dewey range match
              const deweyNum = parseInt(shelfQueryParam, 10);
              match = loaded.find((n) => {
                const start = parseInt(n.data.deweyRangeStart, 10);
                const end = parseInt(n.data.deweyRangeEnd, 10);
                if (isNaN(start) || isNaN(end) || isNaN(deweyNum)) return false;
                return deweyNum >= start && deweyNum <= end;
              });
            }
            if (match) {
              setSelectedNodeId(match.id);
              setShelfViewerOpen(openViewerFromUrl);
              setTimeout(() => {
                reactFlowInstance.fitView({
                  nodes: [{ id: match.id }],
                  padding: 0.5,
                  duration: 500,
                });
              }, 200);
            }
          }
          if (!cancelled) establishBaselineRef.current(loaded);
        } else {
          // Empty map for fresh orgs — show a blank canvas, not someone else's defaults.
          setNodes([]);
          pushSnapshot([]);
          nodeIdCounter.current = 1;
          if (!cancelled) establishBaselineRef.current([]);
        }
      } catch {
        if (cancelled) return;
        setNodes([]);
        pushSnapshot([]);
        nodeIdCounter.current = 1;
        establishBaselineRef.current([]);
        toast.error('Failed to load map');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          if (!shelfQueryParam) {
            setTimeout(() => {
              reactFlowInstance.fitView({ padding: 0.2 });
            }, 100);
          }
        }
      }
    }
    loadMap();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only full load

  // Client navigations: ?shelfId= / ?shelf= / ?viewer=1 after nodes exist
  useEffect(() => {
    if (!shelfQueryParam) {
      shelfUrlAppliedSigRef.current = "";
      return;
    }
    if (isLoading || nodes.length === 0) return;

    let match: ShelfFlowNode | undefined;
    if (shelfIdParam) {
      match = nodes.find((n) => n.id === shelfIdParam);
    } else {
      const deweyNum = parseInt(shelfQueryParam, 10);
      match = nodes.find((n) => {
        const start = parseInt(n.data.deweyRangeStart, 10);
        const end = parseInt(n.data.deweyRangeEnd, 10);
        if (isNaN(start) || isNaN(end) || isNaN(deweyNum)) return false;
        return deweyNum >= start && deweyNum <= end;
      });
    }

    if (!match) return;

    const sig = `${shelfIdParam ?? ""}|${shelfQueryParam}|${openViewerFromUrl ? "1" : "0"}`;
    if (shelfUrlAppliedSigRef.current === sig) return;

    shelfUrlAppliedSigRef.current = sig;
    setSelectedNodeId(match.id);
    setShelfViewerOpen(openViewerFromUrl);
    const t = setTimeout(() => {
      reactFlowInstance.fitView({
        nodes: [{ id: match!.id }],
        padding: 0.45,
        duration: 400,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [
    isLoading,
    nodes,
    shelfQueryParam,
    shelfIdParam,
    openViewerFromUrl,
    reactFlowInstance,
  ]);

  const topGenreHint = useMemo(() => {
    if (!placementHints?.genreCounts) return null;
    const entries = Object.entries(placementHints.genreCounts);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [placementHints]);

  useEffect(() => {
    if (!pathname?.endsWith("/map") || isLoading) return;

    const schedulePump = () => {
      if (document.visibilityState !== "visible") return;
      if (occupancyRefreshTimerRef.current) clearTimeout(occupancyRefreshTimerRef.current);
      occupancyRefreshTimerRef.current = setTimeout(async () => {
        occupancyRefreshTimerRef.current = null;
        try {
          const sections = await apiFetch<BackendShelfSection[]>("/map");
          setNodes((prev) => mergeShelfSectionsIntoNodes(prev, sections ?? []));
        } catch {
          /* stale refresh ignored */
        }
      }, 300);
    };

    window.addEventListener("focus", schedulePump);
    document.addEventListener("visibilitychange", schedulePump);
    return () => {
      window.removeEventListener("focus", schedulePump);
      document.removeEventListener("visibilitychange", schedulePump);
      if (occupancyRefreshTimerRef.current) clearTimeout(occupancyRefreshTimerRef.current);
    };
  }, [pathname, isLoading, setNodes]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Selected node object
  const selectedNode = useMemo(
    () =>
      selectedNodeId
        ? (nodes.find((n) => n.id === selectedNodeId) as ShelfFlowNode | undefined) ?? null
        : null,
    [nodes, selectedNodeId]
  );

  // --- Node data updates ---
  const updateNodeData = useCallback(
    (nodeId: string, updates: Partial<ShelfNodeData>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [setNodes]
  );

  const commitChange = useCallback(() => {
    pushSnapshot(nodes);
  }, [nodes, pushSnapshot]);

  // --- Node actions ---
  const deleteNode = useCallback(
    (nodeId: string) => {
      const nextNodes = nodes.filter((n) => n.id !== nodeId);
      setNodes(nextNodes);
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
        setShelfViewerOpen(false);
      }
      pushSnapshot(nextNodes);
    },
    [nodes, selectedNodeId, setNodes, pushSnapshot]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;
      const newId = `new-${nodeIdCounter.current++}`;
      const newNode: ShelfFlowNode = {
        ...source,
        id: newId,
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40,
        },
        selected: false,
        data: {
          ...source.data,
          label: `${source.data.label} (copy)`,
          sectionCode: newId.replace("new-", "S-"),
        },
      };
      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      setShelfViewerOpen(false);
      pushSnapshot(nextNodes);
      toast.success("Shelf duplicated");
    },
    [nodes, setNodes, pushSnapshot]
  );

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId((prev) => {
      if (prev !== nodeId) setShelfViewerOpen(false);
      return nodeId;
    });
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShelfViewerOpen(true);
  }, []);

  // --- Callbacks context value ---
  const callbacks: MapCallbacks = useMemo(
    () => ({
      onUpdateNodeData: updateNodeData,
      onDeleteNode: deleteNode,
      onDuplicateNode: duplicateNode,
      onSelectNode: selectNode,
      onCommitChange: commitChange,
      onOpenShelfViewer: handleNodeDoubleClick,
    }),
    [updateNodeData, deleteNode, duplicateNode, selectNode, commitChange, handleNodeDoubleClick]
  );

  // --- DnD: palette → canvas ---
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || over.id !== "react-flow-canvas") return;

      const template = active.data.current?.template as ShelfTemplate | undefined;
      if (!template) return;

      const translated = active.rect.current.translated;
      if (!translated) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: translated.left + translated.width / 2,
        y: translated.top + translated.height / 2,
      });

      const newId = `new-${nodeIdCounter.current++}`;
      const newNode: ShelfFlowNode = {
        id: newId,
        type: "shelf",
        position,
        style: { width: template.defaultData.width as number, height: template.defaultData.height as number },
        data: {
          ...template.defaultData,
          label: `${template.label} ${nodeIdCounter.current - 1}`,
          sectionCode: newId.replace("new-", "S-"),
        } as ShelfNodeData,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      setShelfViewerOpen(false);
      pushSnapshot(nextNodes);
      toast.success(`Added ${template.label}`);
    },
    [reactFlowInstance, nodes, setNodes, pushSnapshot]
  );

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        const snapshot = e.shiftKey ? redo() : undo();
        if (snapshot) {
          isProgrammatic.current = true;
          setNodes(snapshot.nodes);
          isProgrammatic.current = false;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setNodes, isProgrammatic, selectedNodeId, deleteNode]);

  // --- Toolbar handlers ---
  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) {
      isProgrammatic.current = true;
      setNodes(snapshot.nodes);
      isProgrammatic.current = false;
    }
  }, [undo, setNodes, isProgrammatic]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) {
      isProgrammatic.current = true;
      setNodes(snapshot.nodes);
      isProgrammatic.current = false;
    }
  }, [redo, setNodes, isProgrammatic]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const sections = nodes.map((n) => ({
        id: n.id.startsWith('new-') ? null : n.id,
        label: n.data.label,
        mapX: Math.round(n.position.x),
        mapY: Math.round(n.position.y),
        width: typeof n.style?.width === 'number' ? n.style.width : n.data.width,
        height: typeof n.style?.height === 'number' ? n.style.height : n.data.height,
        floor: 1,
        sectionCode: n.data.sectionCode || null,
        category: n.data.category || null,
        deweyRangeStart: n.data.deweyRangeStart || null,
        deweyRangeEnd: n.data.deweyRangeEnd || null,
        numberOfTiers: n.data.numberOfTiers,
        capacityPerTier: n.data.capacityPerTier,
        tierCapacities: n.data.tierCapacities?.length ? n.data.tierCapacities : null,
        color: n.data.color || null,
        rotation: n.data.rotation,
        notes: n.data.notes || null,
        shelfType: n.data.shelfType || null,
      }));

      const updated = await apiFetch<BackendShelfSection[]>('/map/layout', {
        method: 'PUT',
        body: sections,
      });

      // Replace nodes with real UUIDs from the response
      const updatedNodes = updated.map(transformBackendToNode);
      setNodes(updatedNodes);
      pushSnapshot(updatedNodes);
      establishBaseline(updatedNodes);
      setShelfViewerOpen(false);
      toast.success('Layout saved successfully');
    } catch {
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [nodes, setNodes, pushSnapshot, establishBaseline]);

  const handleClear = useCallback(() => {
    pushSnapshot(nodes);
    setNodes([]);
    setSelectedNodeId(null);
    setShelfViewerOpen(false);
    toast.success("Canvas cleared");
  }, [nodes, setNodes, pushSnapshot]);

  const handleDiscardLayout = useCallback(() => {
    const restored = structuredClone(lastSavedNodesRef.current);
    isProgrammatic.current = true;
    setNodes(restored);
    isProgrammatic.current = false;
    pushSnapshot(restored);
    establishBaseline(restored);
    setShelfViewerOpen(false);
    toast.info("Restored last saved layout");
  }, [setNodes, pushSnapshot, establishBaseline]);

  const handleExportImage = useCallback(async () => {
    const viewport = document.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement;
    if (!viewport) {
      toast.error("Could not find canvas to export");
      return;
    }
    try {
      // Dynamic import to avoid hard dependency
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        quality: 1,
      });
      const link = document.createElement("a");
      link.download = "library-map.png";
      link.href = dataUrl;
      link.click();
      toast.success("Exported canvas as PNG");
    } catch {
      // Fallback: export as JSON download
      const layout = JSON.stringify({ nodes }, null, 2);
      const blob = new Blob([layout], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "library-map.json";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exported layout as JSON (install html-to-image for PNG export)");
    }
  }, [nodes]);

  // Track node drag end for history
  const wrappedOnNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      const hasDragStop = changes.some(
        (c) => c.type === "position" && c.dragging === false
      );
      if (hasDragStop) {
        // Defer so React Flow state is flushed before snapshot
        requestAnimationFrame(() => {
          pushSnapshot(nodes);
        });
      }
    },
    [onNodesChange, nodes, pushSnapshot]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <MapCallbacksContext.Provider value={callbacks}>
        <div className="flex h-full flex-col">
          {layoutDirty && (
            <div
              role="status"
              className="flex-none flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-50"
            >
              <p className="text-[13px] font-medium">
                You have unsaved layout changes. Save to keep them, or discard to reload the last saved map.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-brand-navy text-white hover:bg-brand-navy/90"
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                >
                  Save layout
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8" disabled={isSaving}>
                      Discard changes
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display">Discard layout changes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will revert the map to the last saved layout. Changes that were not saved will be lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDiscardLayout}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          {/* Toolbar */}
          <div className="flex-none border-b px-3 py-2">
            <CanvasToolbar
              onZoomIn={() => reactFlowInstance.zoomIn()}
              onZoomOut={() => reactFlowInstance.zoomOut()}
              onFitView={() => reactFlowInstance.fitView({ padding: 0.2 })}
              snapToGrid={snapToGrid}
              onToggleSnapToGrid={() => setSnapToGrid((prev) => !prev)}
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap((prev) => !prev)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSave={handleSave}
              saveDisabled={isSaving}
              layoutDirty={layoutDirty}
              onClear={handleClear}
              onExportImage={handleExportImage}
            />
          </div>

          {placementHints && placementHints.shelfHints.length > 0 && !shelvingAssistantDismissed && (
            <div className="flex-none border-b border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 gap-2">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                    <Library className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-display font-semibold tracking-tight">
                      Shelving assistant
                    </h3>
                    <p className="max-w-xl text-[11px] leading-snug text-muted-foreground">
                      {placementHints.unshelvedCount} unshelved available cop
                      {placementHints.unshelvedCount === 1 ? "y" : "ies"}. Shelf chips match{" "}
                      <span className="font-medium text-foreground">genre → shelf category</span> (exact). Nothing
                      moves automatically — use this while shelving from the catalog.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {topGenreHint && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-[11px]"
                      title="Copy for spine labels or staff notes"
                      onClick={() => {
                        const text = `${topGenreHint[0]} (${topGenreHint[1]} unshelved)`;
                        void navigator.clipboard.writeText(text).then(() =>
                          toast.success("Copied genre summary"),
                        );
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy top genre
                    </Button>
                  )}
                  <Button variant="default" size="sm" className="h-8 gap-1.5 bg-brand-navy text-[11px] text-white hover:bg-brand-navy/90" asChild>
                    <Link href="/catalog?unshelved=1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Unshelved in catalog
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Dismiss"
                    onClick={dismissShelvingAssistant}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {placementHints.shelfHints
                  .filter((h) => h.estimatedMatchCount > 0)
                  .map((h) => (
                    <button
                      key={h.shelfId}
                      type="button"
                      className="group flex max-w-[240px] flex-col rounded-lg border border-border bg-background px-2.5 py-1.5 text-left shadow-sm transition-colors hover:bg-accent"
                      title={h.note}
                      onClick={() => {
                        setSelectedNodeId(h.shelfId);
                        setShelfViewerOpen(false);
                        setTimeout(() => {
                          reactFlowInstance.fitView({
                            nodes: [{ id: h.shelfId }],
                            padding: 0.45,
                            duration: 400,
                          });
                        }, 120);
                      }}
                    >
                      <span className="truncate text-[11px] font-medium">{h.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {h.estimatedMatchCount} genre match{h.estimatedMatchCount === 1 ? "" : "es"}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Main content: palette + canvas + settings */}
          <div className="flex flex-1 overflow-hidden">
            <ShelfPalette
              isOpen={paletteOpen}
              onToggle={() => setPaletteOpen((prev) => !prev)}
            />

            <div className="flex-1">
              <MapCanvas
                nodes={nodes}
                onNodesChange={wrappedOnNodesChange}
                onNodeClick={selectNode}
                onNodeDoubleClick={handleNodeDoubleClick}
                snapToGrid={snapToGrid}
                showMinimap={showMinimap}
              />
            </div>

            <ShelfSettingsPanel
              node={selectedNode}
              onUpdateNodeData={updateNodeData}
              shelfViewerOpen={shelfViewerOpen}
              onShelfViewerOpenChange={setShelfViewerOpen}
              onClose={() => {
                setSelectedNodeId(null);
                setShelfViewerOpen(false);
              }}
            />
          </div>
        </div>
      </MapCallbacksContext.Provider>
    </DndContext>
  );
}

export default function LibraryMapPage() {
  return (
    <ReactFlowProvider>
      <MapPageContent />
    </ReactFlowProvider>
  );
}
