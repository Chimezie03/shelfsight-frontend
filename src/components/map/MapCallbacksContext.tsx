"use client";

import { createContext, useContext } from "react";
import type { ShelfNodeData } from "./types";

export interface MapCallbacks {
  onUpdateNodeData: (nodeId: string, data: Partial<ShelfNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string | null) => void;
  onDeleteEdge: (edgeId: string) => void;
  onCommitChange: () => void;
}

const MapCallbacksContext = createContext<MapCallbacks | null>(null);

export function useMapCallbacks(): MapCallbacks {
  const ctx = useContext(MapCallbacksContext);
  if (!ctx) {
    throw new Error(
      "useMapCallbacks must be used within a MapCallbacksContext.Provider"
    );
  }
  return ctx;
}

export { MapCallbacksContext };
