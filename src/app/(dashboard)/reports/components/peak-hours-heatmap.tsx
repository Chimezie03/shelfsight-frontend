"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import type { HeatmapCell } from "../types";
import { HEATMAP_DAYS, HEATMAP_HOURS } from "../constants";

interface PeakHoursHeatmapProps {
  data: HeatmapCell[];
  isLoading?: boolean;
}

function interpolateColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  // Interpolate from cream (#F0EDE8) to navy (#1B2A4A)
  const r = Math.round(240 - ratio * (240 - 27));
  const g = Math.round(237 - ratio * (237 - 42));
  const b = Math.round(232 - ratio * (232 - 74));
  return `rgb(${r}, ${g}, ${b})`;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return hour === 0 ? "12AM" : "12PM";
  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
}

export function PeakHoursHeatmap({ data, isLoading = false }: PeakHoursHeatmapProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-[260px] rounded-lg" />;
  }

  const maxValue = Math.max(...data.map((c) => c.value), 1);
  const cellMap = new Map(data.map((c) => [`${c.day}-${c.hour}`, c.value]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <TooltipProvider delayDuration={0}>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 min-w-[600px]"
            style={{
              gridTemplateColumns: `56px repeat(${HEATMAP_HOURS.length}, 1fr)`,
              gridTemplateRows: `24px repeat(${HEATMAP_DAYS.length}, 1fr)`,
            }}
          >
            {/* Empty top-left corner */}
            <div />

            {/* Hour labels */}
            {HEATMAP_HOURS.map((h) => (
              <div
                key={`h-${h}`}
                className="text-[10px] text-muted-foreground text-center font-medium"
              >
                {formatHour(h)}
              </div>
            ))}

            {/* Rows: day label + cells */}
            {HEATMAP_DAYS.map((day) => (
              <div key={`row-${day}`} className="contents">
                <div
                  key={`d-${day}`}
                  className="text-[11px] text-muted-foreground font-medium flex items-center pr-2"
                >
                  {day}
                </div>
                {HEATMAP_HOURS.map((hour) => {
                  const value = cellMap.get(`${day}-${hour}`) ?? 0;
                  return (
                    <Tooltip key={`${day}-${hour}`}>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-md h-7 cursor-default transition-transform hover:scale-110"
                          style={{ backgroundColor: interpolateColor(value, maxValue) }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {day} {formatHour(hour)}
                        </p>
                        <p className="text-muted-foreground">
                          {value} checkouts
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
              <div
                key={ratio}
                className="w-5 h-3 rounded-sm"
                style={{ backgroundColor: interpolateColor(ratio * maxValue, maxValue) }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}
