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
  Loader2,
  MapPin,
} from "lucide-react";
import { CATEGORIES, LANGUAGES, STATUS_OPTIONS } from "../constants";
import type { CatalogFilters } from "../hooks/use-catalog-state";

interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: CatalogFilters;
  onFilterChange: (key: keyof CatalogFilters, value: string) => void;
  activeFilterCount: number;
  isSearchPending: boolean;
  isSearching: boolean;
  onClearFilters: () => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
  totalResults: number;
  selectedCount: number;
  onAddBook: () => void;
  onBulkUpload?: () => void;
  onExport: () => void;
  onBulkDelete: () => void;
  onExportSelected: () => void;
  onDeleteAll?: () => void;
  userRole?: string;
  /** True when URL includes ?unshelved=1 (from map “Unshelved in catalog”). */
  unshelvedOnly?: boolean;
  /** Clears unshelved mode by updating the URL (removes query param). */
  onClearUnshelvedFilter?: () => void;
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  activeFilterCount,
  isSearchPending,
  isSearching,
  onClearFilters,
  viewMode,
  onViewModeChange,
  totalResults,
  selectedCount,
  onAddBook,
  onBulkUpload,
  onExport,
  onBulkDelete,
  onExportSelected,
  onDeleteAll,
  userRole,
  unshelvedOnly = false,
  onClearUnshelvedFilter,
}: CatalogToolbarProps) {
  const canEdit = userRole === "ADMIN" || userRole === "STAFF";
  const canDelete = userRole === "ADMIN";
  const hasActiveSearch = searchQuery.trim().length > 0;
  const activeCriteriaCount = activeFilterCount + (hasActiveSearch ? 1 : 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <Filter className="w-4 h-4 text-brand-copper" />
          Search & Filter
          {activeCriteriaCount > 0 && (
            <Badge className="bg-brand-copper/15 text-brand-copper border-0 text-[10px] ml-1">
              {activeCriteriaCount} active
              {unshelvedOnly ? " · unshelved" : ""}
            </Badge>
          )}
          {activeCriteriaCount > 0 && (
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
        {unshelvedOnly && onClearUnshelvedFilter && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-lg border border-brand-copper/35 bg-brand-copper/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-copper" aria-hidden />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground">Unshelved copies only</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Results are limited to catalog titles that have at least one{" "}
                  <span className="font-medium text-foreground">AVAILABLE</span> copy with{" "}
                  <span className="font-medium text-foreground">no shelf</span> assigned. Other copies
                  of the same title may still be shelved.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-brand-copper/40 text-[11px] sm:ml-2"
              onClick={onClearUnshelvedFilter}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Remove unshelved filter
            </Button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, ISBN, or Dewey number..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearchPending || isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              ) : hasActiveSearch ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
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
            {isSearchPending && (
              <span className="text-xs text-muted-foreground">Typing...</span>
            )}
            {!isSearchPending && isSearching && (
              <span className="text-xs text-muted-foreground">Searching...</span>
            )}
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

            {canEdit && onBulkUpload && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={onBulkUpload}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Bulk Upload
              </Button>
            )}

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

            {canDelete && onDeleteAll && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteAll}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete All
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
