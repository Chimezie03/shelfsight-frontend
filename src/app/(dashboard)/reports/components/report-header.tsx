"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Download, Printer, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange, PresetRange } from "../types";
import { DATE_PRESETS } from "../constants";
import type { DateRange as RdpDateRange } from "react-day-picker";

interface ReportHeaderProps {
  dateRange: DateRange;
  onPresetChange: (preset: PresetRange) => void;
  onCustomRangeChange: (from: Date, to: Date) => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export function ReportHeader({
  dateRange,
  onPresetChange,
  onCustomRangeChange,
  onExportCsv,
  onPrint,
}: ReportHeaderProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleRangeSelect = (range: RdpDateRange | undefined) => {
    if (range?.from && range?.to) {
      onCustomRangeChange(range.from, range.to);
      setCalendarOpen(false);
    }
  };

  const displayLabel =
    dateRange.preset !== "custom"
      ? DATE_PRESETS.find((p) => p.value === dateRange.preset)?.label ?? "Last 30 Days"
      : `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`;

  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">
          Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Insights and statistics for library performance
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Date range picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal gap-2 h-9 px-3",
                dateRange.preset === "custom" && "min-w-[220px]"
              )}
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{displayLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
            {/* Preset pills */}
            <div className="flex flex-wrap gap-1 px-3 pt-3 pb-2 border-b">
              {DATE_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    onPresetChange(preset.value as PresetRange);
                    setCalendarOpen(false);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    dateRange.preset === preset.value
                      ? "bg-brand-navy text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportCsv} className="gap-2">
              <FileDown className="h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
