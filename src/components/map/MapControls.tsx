import { Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapViewMode } from "@/components/map/types";

interface MapControlsProps {
  viewMode: MapViewMode;
  onBackToMap: () => void;
}

export function MapControls({ viewMode, onBackToMap }: MapControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant={viewMode === "map" ? "secondary" : "outline"} size="sm" onClick={onBackToMap}>
        <Minus className="h-4 w-4" />
        Full Map
      </Button>
    </div>
  );
}
