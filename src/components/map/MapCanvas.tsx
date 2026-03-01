"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDroppable } from "@dnd-kit/core";
import { ShelfNode } from "./ShelfNode";
import { LabeledEdge } from "./LabeledEdge";
import type { ShelfFlowNode, ShelfFlowEdge, ShelfNodeData } from "./types";

interface MapCanvasProps {
  nodes: ShelfFlowNode[];
  edges: ShelfFlowEdge[];
  onNodesChange: OnNodesChange<ShelfFlowNode>;
  onEdgesChange: OnEdgesChange<ShelfFlowEdge>;
  onConnect: OnConnect;
  onNodeClick: (nodeId: string) => void;
  snapToGrid: boolean;
  showMinimap: boolean;
}

export function MapCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  snapToGrid,
  showMinimap,
}: MapCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(() => ({ shelf: ShelfNode }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ labeled: LabeledEdge }), []);

  // Make the canvas a drop target for @dnd-kit palette items
  const { setNodeRef } = useDroppable({ id: "react-flow-canvas" });

  return (
    <div ref={setNodeRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        defaultEdgeOptions={{ type: "labeled", data: { label: "Adjacent" } }}
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
              return data.color ?? "#4F46E5";
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
