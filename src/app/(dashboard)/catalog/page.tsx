"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { exportBooksCsv, getBook } from "@/lib/books";
import { useCatalogState } from "./hooks/use-catalog-state";
import { CatalogStats } from "./components/catalog-stats";
import { CatalogToolbar } from "./components/catalog-toolbar";
import { CatalogTable } from "./components/catalog-table";
import { CatalogGrid } from "./components/catalog-grid";
import { CatalogPagination } from "./components/catalog-pagination";
import { BookDetailSheet } from "./components/book-detail-sheet";
import { BookFormDialog } from "./components/book-form-dialog";
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog";
import { DeleteAllBooksDialog } from "./components/delete-all-books-dialog";
import { BulkUploadDialog } from "./components/bulk-upload-dialog";
import type { Book } from "@/types/book";

function buildPathWithoutParams(
  pathname: string,
  searchParams: URLSearchParams,
  keysToRemove: string[],
) {
  const sp = new URLSearchParams(searchParams.toString());
  keysToRemove.forEach((k) => sp.delete(k));
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function CatalogPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookIdFromUrl = searchParams.get("bookId");
  const bulkParam = searchParams.get("bulk");
  const catalog = useCatalogState();
  const { clearAllFilters, unshelvedOnly } = catalog;

  const handleClearUnshelvedFilter = useCallback(() => {
    router.replace(
      buildPathWithoutParams(pathname, searchParams, ["unshelved"]),
      { scroll: false },
    );
  }, [router, pathname, searchParams]);

  const handleClearAllFilters = useCallback(() => {
    clearAllFilters();
    router.replace(
      buildPathWithoutParams(pathname, searchParams, ["unshelved"]),
      { scroll: false },
    );
  }, [clearAllFilters, router, pathname, searchParams]);

  // Dialog / sheet state
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkInitialIsbnMode, setBulkInitialIsbnMode] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  // Deep link: /catalog?bookId=… opens the detail sheet
  useEffect(() => {
    if (!bookIdFromUrl) return;
    let cancelled = false;
    void getBook(bookIdFromUrl)
      .then((b) => {
        if (!cancelled) {
          setDetailBook(b);
          setIsDetailOpen(true);
        }
      })
      .catch(() => {
        /* invalid id */
      });
    return () => {
      cancelled = true;
    };
  }, [bookIdFromUrl]);

  // Deep link: /catalog?bulk=1 (or ?bulk=isbn) opens the bulk upload dialog.
  // Defer the dialog-open via a microtask so the lint rule
  // `react-hooks/set-state-in-effect` doesn't flag it (and to avoid the
  // synchronous cascading render it warns about).
  useEffect(() => {
    if (!bulkParam) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setBulkInitialIsbnMode(bulkParam === "isbn");
      setIsBulkUploadOpen(true);
      router.replace(buildPathWithoutParams(pathname, searchParams, ["bulk"]), {
        scroll: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [bulkParam, pathname, router, searchParams]);

  // Handlers
  const handleViewBook = (book: Book) => {
    setDetailBook(book);
    setIsDetailOpen(true);
  };

  const handleAddBook = () => {
    setEditBook(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = () => {
    setIsBulkUploadOpen(true);
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

  const handleDeleteAll = () => {
    setIsDeleteAllOpen(true);
  };

  const handleExport = async () => {
    const books = await catalog.exportAllBooks();
    exportBooksCsv(books);
  };

  const handleExportSelected = () => {
    const selected = catalog.books.filter((b) =>
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
      <CatalogStats
        isLoading={catalog.isLoading}
        total={catalog.total}
        copyStats={catalog.stats}
      />

      {/* Toolbar */}
      <CatalogToolbar
        searchQuery={catalog.searchQuery}
        onSearchChange={catalog.setSearchQuery}
        filters={catalog.filters}
        onFilterChange={catalog.setFilter}
        activeFilterCount={catalog.activeFilterCount}
        isSearchPending={catalog.isSearchPending}
        isSearching={catalog.isSearching}
        onClearFilters={handleClearAllFilters}
        viewMode={catalog.viewMode}
        onViewModeChange={catalog.setViewMode}
        totalResults={catalog.total}
        selectedCount={catalog.selectedIds.size}
        onAddBook={handleAddBook}
        onBulkUpload={handleBulkUpload}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onExportSelected={handleExportSelected}
        onDeleteAll={handleDeleteAll}
        userRole={user?.role}
        unshelvedOnly={unshelvedOnly}
        onClearUnshelvedFilter={handleClearUnshelvedFilter}
      />

      {catalog.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to load catalog</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{catalog.error}</span>
            <Button variant="outline" size="sm" onClick={catalog.refreshBooks}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
        isLoading={catalog.isLoading}
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
        onUpdated={(updatedBook) => {
          catalog.refreshBooks();
          if (detailBook?.id === updatedBook.id) {
            setDetailBook(updatedBook);
          }
        }}
        userRole={user?.role}
      />

      {/* Add/Edit Book Dialog */}
      <BookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        book={editBook}
        onSuccess={(updatedBook) => {
          catalog.refreshBooks();
          if (updatedBook && detailBook?.id === updatedBook.id) {
            setDetailBook(updatedBook);
          }
        }}
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

      {/* Delete All Confirmation */}
      <DeleteAllBooksDialog
        open={isDeleteAllOpen}
        onOpenChange={setIsDeleteAllOpen}
        totalBooks={catalog.total}
        totalCopies={catalog.stats?.totalCopies ?? 0}
        onSuccess={() => {
          catalog.deselectAll();
          catalog.refreshBooks();
        }}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={(val) => {
          setIsBulkUploadOpen(val);
          if (!val) setBulkInitialIsbnMode(false);
        }}
        onSuccess={catalog.refreshBooks}
        initialIsbnMode={bulkInitialIsbnMode}
      />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
