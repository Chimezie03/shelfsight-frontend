import type { Node } from "@xyflow/react";

// Shelf template types available in the palette
export type ShelfType =
  | "single-shelf"
  | "double-shelf"
  | "end-cap"
  | "display-table"
  | "reading-nook";

// Category options for shelf classification
export type ShelfCategory =
  | "Fiction"
  | "Non-Fiction"
  | "Science"
  | "History"
  | "Children's"
  | "Reference"
  | "Periodicals"
  | "Special Collections"
  | "Uncategorized";

// Color preset for shelf accent colors
export interface ColorPreset {
  name: string;
  value: string;
}

// The data payload inside each React Flow shelf node
export interface ShelfNodeData {
  [key: string]: unknown;
  label: string;
  shelfType: ShelfType;
  category: ShelfCategory;
  deweyRangeStart: string;
  deweyRangeEnd: string;
  numberOfTiers: number;
  capacityPerTier: number;
  /** When set, length should match numberOfTiers; each value is that tier's soft capacity. */
  tierCapacities?: number[] | null;
  currentUsed: number;
  sectionCode: string;
  notes: string;
  color: string;
  rotation: number;
  width: number;
  height: number;
}

// Typed React Flow node for shelves
export type ShelfFlowNode = Node<ShelfNodeData, "shelf">;

// Palette template definition
export interface ShelfTemplate {
  type: ShelfType;
  label: string;
  icon: string;
  description: string;
  defaultData: Omit<ShelfNodeData, "label" | "sectionCode">;
}

// History snapshot for undo/redo
export interface HistorySnapshot {
  nodes: ShelfFlowNode[];
}

// Book status for shelf visualization
export type BookStatus = "available" | "checked-out";

// Individual book on a shelf
export interface ShelfBookDetail {
  id: string;
  title: string;
  author: string;
  isbn: string;
  dewey: string;
  status: BookStatus;
  dueDate: string | null;
  spineColor: string;
  spineWidth: number;
  /** 1-based order within tier (optional). */
  shelfSlot?: number | null;
}

// Tier data for shelf visualization
export interface ShelfTierData {
  tierNumber: number;
  books: ShelfBookDetail[];
  capacity: number;
}

// --- Legacy types (kept for old components preserved as reference) ---

export interface ShelfBook {
  title: string;
  author: string;
  dewey: string;
  color: string;
}

export interface ShelfSection {
  id: string;
  name: string;
  category: string;
  capacity: number;
  used: number;
  x: number;
  y: number;
  width: number;
  height: number;
  books: ShelfBook[];
}

export type MapViewMode = "map" | "shelf";
