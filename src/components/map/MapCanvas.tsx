"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnNodesChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDroppable } from "@dnd-kit/core";
import { ShelfNode } from "./ShelfNode";
import type { ShelfFlowNode, ShelfNodeData } from "./types";

interface MapCanvasProps {
  nodes: ShelfFlowNode[];
  onNodesChange: OnNodesChange<ShelfFlowNode>;
  onNodeClick: (nodeId: string) => void;
  snapToGrid: boolean;
  showMinimap: boolean;
}

export function MapCanvas({
  nodes,
  onNodesChange,
  onNodeClick,
  snapToGrid,
  showMinimap,
}: MapCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(() => ({ shelf: ShelfNode }), []);

  // Make the canvas a drop target for @dnd-kit palette items
  const { setNodeRef } = useDroppable({ id: "react-flow-canvas" });

  return (
    <div ref={setNodeRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        deleteKeyCode={["Backspace", "Delete"]}
        defaultViewport={{ x: 50, y: 50, zoom: 1.2 }}
        fitView
        fitViewOptions={{ maxZoom: 1.5, padding: 0.3 }}
        className="!bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border)"
        />
        <Controls
          className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
          showInteractive={false}
        />
        {showMinimap && (
          <MiniMap
            className="!bg-card !border-border !shadow-sm"
            nodeColor={(node) => {
              const data = node.data as ShelfNodeData;
              return data.color ?? "#1B2A4A";
            }}
            maskColor="rgba(0, 0, 0, 0.08)"
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  );
}
