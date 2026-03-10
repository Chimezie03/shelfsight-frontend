"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  Download,
  Plus,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES, LANGUAGES, STATUS_OPTIONS } from "../constants";
import type { CatalogFilters } from "../hooks/use-catalog-state";

interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: CatalogFilters;
  onFilterChange: (key: keyof CatalogFilters, value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
  totalResults: number;
  selectedCount: number;
  onAddBook: () => void;
  onExport: () => void;
  onBulkDelete: () => void;
  onExportSelected: () => void;
  userRole?: string;
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  activeFilterCount,
  onClearFilters,
  viewMode,
  onViewModeChange,
  totalResults,
  selectedCount,
  onAddBook,
  onExport,
  onBulkDelete,
  onExportSelected,
  userRole,
}: CatalogToolbarProps) {
  const canEdit = userRole === "ADMIN" || userRole === "STAFF";
  const canDelete = userRole === "ADMIN";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <Filter className="w-4 h-4 text-brand-copper" />
          Search & Filter
          {activeFilterCount > 0 && (
            <Badge className="bg-brand-copper/15 text-brand-copper border-0 text-[10px] ml-1">
              {activeFilterCount} active
            </Badge>
          )}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-6 px-2 ml-auto"
              onClick={onClearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, ISBN, or Dewey number..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.category}
            onValueChange={(v) => onFilterChange("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => onFilterChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional filters row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            value={filters.language}
            onValueChange={(v) => onFilterChange("language", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Year from"
            value={filters.yearMin}
            onChange={(e) => onFilterChange("yearMin", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Year to"
            value={filters.yearMax}
            onChange={(e) => onFilterChange("yearMax", e.target.value)}
          />
          <div />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className={`h-8 px-2.5 rounded-none ${
                  viewMode === "table"
                    ? "bg-brand-navy text-white hover:bg-brand-navy/90"
                    : ""
                }`}
                onClick={() => onViewModeChange("table")}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className={`h-8 px-2.5 rounded-none ${
                  viewMode === "grid"
                    ? "bg-brand-navy text-white hover:bg-brand-navy/90"
                    : ""
                }`}
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalResults} {totalResults === 1 ? "book" : "books"} found
            </span>
            {selectedCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {selectedCount} selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk actions */}
            {selectedCount > 0 && canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Bulk Actions
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onExportSelected}>
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onBulkDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={onExport}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>

            {canEdit && (
              <Button
                size="sm"
                className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs h-8"
                onClick={onAddBook}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add New Book
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
