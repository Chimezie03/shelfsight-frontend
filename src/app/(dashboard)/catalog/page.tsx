"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { exportBooksCsv } from "@/lib/books";
import { useCatalogState } from "./hooks/use-catalog-state";
import { CatalogStats } from "./components/catalog-stats";
import { CatalogToolbar } from "./components/catalog-toolbar";
import { CatalogTable } from "./components/catalog-table";
import { CatalogGrid } from "./components/catalog-grid";
import { CatalogPagination } from "./components/catalog-pagination";
import { BookDetailSheet } from "./components/book-detail-sheet";
import { BookFormDialog } from "./components/book-form-dialog";
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog";
import type { Book } from "@/types/book";

export default function CatalogPage() {
  const { user } = useAuth();
  const catalog = useCatalogState();

  // Dialog / sheet state
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Handlers
  const handleViewBook = (book: Book) => {
    setDetailBook(book);
    setIsDetailOpen(true);
  };

  const handleAddBook = () => {
    setEditBook(null);
    setIsFormOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setEditBook(book);
    setIsFormOpen(true);
  };

  const handleDeleteBook = (book: Book) => {
    setBookToDelete(book);
    setIsDeleteOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleExport = () => {
    exportBooksCsv(catalog.allBooks);
  };

  const handleExportSelected = () => {
    const selected = catalog.allBooks.filter((b) =>
      catalog.selectedIds.has(b.id)
    );
    exportBooksCsv(selected);
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">
          Library Catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Search and manage your book collection
        </p>
      </div>

      {/* Stats */}
      <CatalogStats books={catalog.allBooks} isLoading={catalog.isLoading} />

      {/* Toolbar */}
      <CatalogToolbar
        searchQuery={catalog.searchQuery}
        onSearchChange={catalog.setSearchQuery}
        filters={catalog.filters}
        onFilterChange={catalog.setFilter}
        activeFilterCount={catalog.activeFilterCount}
        onClearFilters={catalog.clearAllFilters}
        viewMode={catalog.viewMode}
        onViewModeChange={catalog.setViewMode}
        totalResults={catalog.total}
        selectedCount={catalog.selectedIds.size}
        onAddBook={handleAddBook}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onExportSelected={handleExportSelected}
        userRole={user?.role}
      />

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">
            Catalog Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catalog.viewMode === "table" ? (
            <CatalogTable
              books={catalog.books}
              isLoading={catalog.isLoading}
              selectedIds={catalog.selectedIds}
              onToggleSelect={catalog.toggleSelect}
              onSelectAllOnPage={catalog.selectAllOnPage}
              sortField={catalog.sortField}
              sortDirection={catalog.sortDirection}
              onSort={catalog.toggleSort}
              onViewBook={handleViewBook}
              onEditBook={handleEditBook}
              onDeleteBook={handleDeleteBook}
              userRole={user?.role}
            />
          ) : (
            <CatalogGrid
              books={catalog.books}
              isLoading={catalog.isLoading}
              selectedIds={catalog.selectedIds}
              onToggleSelect={catalog.toggleSelect}
              onViewBook={handleViewBook}
              userRole={user?.role}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <CatalogPagination
        page={catalog.page}
        pageSize={catalog.pageSize}
        total={catalog.total}
        onPageChange={catalog.setPage}
        onPageSizeChange={catalog.setPageSize}
      />

      {/* Book Detail Sheet */}
      <BookDetailSheet
        book={detailBook}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditBook}
        onDelete={handleDeleteBook}
        userRole={user?.role}
      />

      {/* Add/Edit Book Dialog */}
      <BookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        book={editBook}
        onSuccess={catalog.refreshBooks}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        bookToDelete={bookToDelete}
        onSuccess={catalog.refreshBooks}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        bulkDeleteIds={Array.from(catalog.selectedIds)}
        onSuccess={catalog.refreshBooks}
        onClearSelection={catalog.deselectAll}
      />
    </div>
  );
}
