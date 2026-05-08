import type { ShelfFlowNode } from "./types";

/** Stable JSON signature for comparing map layout (persisted fields only). */
export function computeLayoutSignature(nodes: ShelfFlowNode[]): string {
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const normalized = sorted.map((n) => ({
    id: n.id,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
    w: typeof n.style?.width === "number" ? n.style.width : n.data.width,
    h: typeof n.style?.height === "number" ? n.style.height : n.data.height,
    data: {
      label: n.data.label,
      shelfType: n.data.shelfType,
      category: n.data.category,
      deweyRangeStart: n.data.deweyRangeStart,
      deweyRangeEnd: n.data.deweyRangeEnd,
      numberOfTiers: n.data.numberOfTiers,
      capacityPerTier: n.data.capacityPerTier,
      tierCapacities: n.data.tierCapacities ?? null,
      // Omit currentUsed — it reflects catalog/checkout state, not persisted layout geometry.
      sectionCode: n.data.sectionCode,
      notes: n.data.notes,
      color: n.data.color,
      rotation: n.data.rotation,
    },
  }));
  return JSON.stringify(normalized);
}
