"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "@xyflow/react";
import {
  DndContext,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { MapCanvas } from "@/components/map/MapCanvas";
import { ShelfPalette } from "@/components/map/ShelfPalette";
import { ShelfSettingsPanel } from "@/components/map/ShelfSettingsPanel";
import { CanvasToolbar } from "@/components/map/CanvasToolbar";
import { useMapHistory } from "@/components/map/useMapHistory";
import {
  MapCallbacksContext,
  type MapCallbacks,
} from "@/components/map/MapCallbacksContext";
import {
  INITIAL_NODES,
  INITIAL_EDGES,
} from "@/components/map/data";
import type { ShelfFlowNode, ShelfNodeData, ShelfTemplate } from "@/components/map/types";

function MapPageContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);

  const { pushSnapshot, undo, redo, canUndo, canRedo, isProgrammatic } =
    useMapHistory(INITIAL_NODES, INITIAL_EDGES);
  const reactFlowInstance = useReactFlow();
  const nodeIdCounter = useRef(INITIAL_NODES.length + 1);

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
    pushSnapshot(nodes, edges);
  }, [nodes, edges, pushSnapshot]);

  // --- Node actions ---
  const deleteNode = useCallback(
    (nodeId: string) => {
      const nextNodes = nodes.filter((n) => n.id !== nodeId);
      const nextEdges = edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      pushSnapshot(nextNodes, nextEdges);
    },
    [nodes, edges, selectedNodeId, setNodes, setEdges, pushSnapshot]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;
      const newId = `shelf-${nodeIdCounter.current++}`;
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
          sectionCode: newId.replace("shelf-", "S-"),
        },
      };
      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      pushSnapshot(nextNodes, edges);
      toast.success("Shelf duplicated");
    },
    [nodes, edges, setNodes, pushSnapshot]
  );

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const deleteEdge = useCallback(
    (edgeId: string) => {
      const nextEdges = edges.filter((e) => e.id !== edgeId);
      setEdges(nextEdges);
      pushSnapshot(nodes, nextEdges);
    },
    [nodes, edges, setEdges, pushSnapshot]
  );

  // --- Callbacks context value ---
  const callbacks: MapCallbacks = useMemo(
    () => ({
      onUpdateNodeData: updateNodeData,
      onDeleteNode: deleteNode,
      onDuplicateNode: duplicateNode,
      onSelectNode: selectNode,
      onDeleteEdge: deleteEdge,
      onCommitChange: commitChange,
    }),
    [updateNodeData, deleteNode, duplicateNode, selectNode, deleteEdge, commitChange]
  );

  // --- Edge connection ---
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) => addEdge({ ...connection, type: "labeled", data: { label: "Adjacent" } }, prev));
    },
    [setEdges]
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

      const newId = `shelf-${nodeIdCounter.current++}`;
      const newNode: ShelfFlowNode = {
        id: newId,
        type: "shelf",
        position,
        style: { width: template.defaultData.width as number, height: template.defaultData.height as number },
        data: {
          ...template.defaultData,
          label: `${template.label} ${nodeIdCounter.current - 1}`,
          sectionCode: newId.replace("shelf-", "S-"),
        } as ShelfNodeData,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      pushSnapshot(nextNodes, edges);
      toast.success(`Added ${template.label}`);
    },
    [reactFlowInstance, nodes, edges, setNodes, pushSnapshot]
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
          setEdges(snapshot.edges);
          isProgrammatic.current = false;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setNodes, setEdges, isProgrammatic, selectedNodeId, deleteNode]);

  // --- Toolbar handlers ---
  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) {
      isProgrammatic.current = true;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      isProgrammatic.current = false;
    }
  }, [undo, setNodes, setEdges, isProgrammatic]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) {
      isProgrammatic.current = true;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      isProgrammatic.current = false;
    }
  }, [redo, setNodes, setEdges, isProgrammatic]);

  const handleSave = useCallback(() => {
    const layout = { nodes, edges };
    console.log("Saved layout:", JSON.stringify(layout, null, 2));
    toast.success("Layout saved to console");
  }, [nodes, edges]);

  const handleClear = useCallback(() => {
    pushSnapshot(nodes, edges);
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    toast.success("Canvas cleared");
  }, [nodes, edges, setNodes, setEdges, pushSnapshot]);

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
      const layout = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([layout], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "library-map.json";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exported layout as JSON (install html-to-image for PNG export)");
    }
  }, [nodes, edges]);

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
          pushSnapshot(nodes, edges);
        });
      }
    },
    [onNodesChange, nodes, edges, pushSnapshot]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <MapCallbacksContext.Provider value={callbacks}>
        <div className="flex h-full flex-col">
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
              onClear={handleClear}
              onExportImage={handleExportImage}
            />
          </div>

          {/* Main content: palette + canvas + settings */}
          <div className="flex flex-1 overflow-hidden">
            <ShelfPalette
              isOpen={paletteOpen}
              onToggle={() => setPaletteOpen((prev) => !prev)}
            />

            <div className="flex-1">
              <MapCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={wrappedOnNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={selectNode}
                snapToGrid={snapToGrid}
                showMinimap={showMinimap}
              />
            </div>

            <ShelfSettingsPanel
              node={selectedNode}
              nodes={nodes}
              edges={edges}
              onUpdateNodeData={updateNodeData}
              onDeleteEdge={deleteEdge}
              onClose={() => setSelectedNodeId(null)}
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
