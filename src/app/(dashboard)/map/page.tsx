"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { shelfSections } from "@/components/map/data";
import { LibraryMapCanvas } from "@/components/map/LibraryMapCanvas";
import { MapControls } from "@/components/map/MapControls";
import { MapLegend } from "@/components/map/MapLegend";
import { ShelfFirstPersonView } from "@/components/map/ShelfFirstPersonView";
import { ShelfSectionCard } from "@/components/map/ShelfSectionCard";
import { MapViewMode, ShelfSection } from "@/components/map/types";
import { getCapacityPercent } from "@/components/map/utils";

export default function LibraryMapPage() {
  const [viewMode, setViewMode] = useState<MapViewMode>("map");
  const [selectedSection, setSelectedSection] = useState<ShelfSection | null>(null);

  const totals = useMemo(() => {
    const totalCapacity = shelfSections.reduce((acc, section) => acc + section.capacity, 0);
    const totalUsed = shelfSections.reduce((acc, section) => acc + section.used, 0);

    return {
      totalCapacity,
      totalUsed,
      utilization: getCapacityPercent(totalUsed, totalCapacity),
    };
  }, []);

  const selectSection = (section: ShelfSection) => {
    setSelectedSection(section);
    setViewMode("shelf");
  };

  const showFullMap = () => {
    setViewMode("map");
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-semibold">Interactive Library Map</h1>
          <p className="text-gray-600">
            {viewMode === "map"
              ? "Zoomed out layout. Click a shelf section to enter first-person shelf view."
              : `Zoomed in on ${selectedSection?.name} (${selectedSection?.category}).`}
          </p>
        </div>
        <MapControls
          viewMode={viewMode}
          onBackToMap={showFullMap}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-indigo-600" />
              {viewMode === "map" ? "Full 2D Layout" : "First-person Shelf View"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[600px] p-4">
            <AnimatePresence mode="wait">
              {viewMode === "map" ? (
                <motion.div
                  key="map-mode"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  className="relative h-full"
                >
                  <MapLegend />
                  <LibraryMapCanvas
                    sections={shelfSections}
                    selectedSectionId={selectedSection?.id ?? null}
                    onSelectSection={selectSection}
                  />
                </motion.div>
              ) : selectedSection ? (
                <motion.div key="shelf-mode" className="h-full">
                  <ShelfFirstPersonView section={selectedSection} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedSection ? (
            <ShelfSectionCard section={selectedSection} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Map Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Sections</span>
                  <span className="font-semibold">{shelfSections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity</span>
                  <span className="font-semibold">{totals.totalUsed}/{totals.totalCapacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Utilization</span>
                  <Badge variant="outline">{totals.utilization}%</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Shelf Books</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection ? (
                <div className="space-y-2">
                  {selectedSection.books.map((book) => (
                    <div
                      key={`${selectedSection.id}-${book.title}`}
                      className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.author}</p>
                      </div>
                      <Badge variant="outline">{book.dewey}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Select a section in the map to view shelf contents.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
