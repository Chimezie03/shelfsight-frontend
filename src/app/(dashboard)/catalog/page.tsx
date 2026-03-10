"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, Edit, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  deweyDecimal: string | null;
  coverImageUrl: string | null;
  availableCopies: number;
  totalCopies: number;
  createdAt: string;
}

interface BooksResponse {
  data: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const addTitleRef = useRef<HTMLInputElement>(null);
  const addAuthorRef = useRef<HTMLInputElement>(null);
  const addIsbnRef = useRef<HTMLInputElement>(null);
  const addGenreRef = useRef<HTMLInputElement>(null);
  const addDeweyRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);
  const editAuthorRef = useRef<HTMLInputElement>(null);
  const editIsbnRef = useRef<HTMLInputElement>(null);
  const editGenreRef = useRef<HTMLInputElement>(null);
  const editDeweyRef = useRef<HTMLInputElement>(null);

  const fetchBooks = useCallback(async (search?: string, genre?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const q = search ?? searchQuery;
      const g = genre ?? genreFilter;
      if (q.trim()) {
        params.set("title", q.trim());
      }
      if (g !== "all") {
        params.set("genre", g);
      }
      params.set("page", "1");
      params.set("limit", "50");

      const qs = params.toString();
      const res = await apiFetch<BooksResponse>(`/books${qs ? `?${qs}` : ""}`);
      setBooks(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error("Failed to load catalog data");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, genreFilter]);

  // Initial load — also fetch all genres
  useEffect(() => {
    async function init() {
      try {
        const res = await apiFetch<BooksResponse>("/books?limit=200");
        setBooks(res.data);
        setPagination(res.pagination);
        const genres = Array.from(new Set(res.data.map((b) => b.genre).filter(Boolean) as string[]));
        setAllGenres(genres);
      } catch {
        toast.error("Failed to load catalog data");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Debounce search — refetch when search/filter changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBooks();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, genreFilter]);

  const handleAddBook = async () => {
    const title = addTitleRef.current?.value?.trim();
    const author = addAuthorRef.current?.value?.trim();
    const isbn = addIsbnRef.current?.value?.trim();
    if (!title || !author || !isbn) {
      toast.error("Title, author, and ISBN are required");
      return;
    }
    try {
      await apiFetch("/books", {
        method: "POST",
        body: {
          title,
          author,
          isbn,
          genre: addGenreRef.current?.value?.trim() || undefined,
          deweyDecimal: addDeweyRef.current?.value?.trim() || undefined,
        },
      });
      toast.success("Book added to catalog");
      setIsAddDialogOpen(false);
      fetchBooks();
    } catch {
      toast.error("Failed to add book");
    }
  };

  const handleEditBook = async () => {
    if (!editingBook) return;
    const title = editTitleRef.current?.value?.trim();
    const author = editAuthorRef.current?.value?.trim();
    const isbn = editIsbnRef.current?.value?.trim();
    if (!title || !author || !isbn) {
      toast.error("Title, author, and ISBN are required");
      return;
    }
    try {
      await apiFetch(`/books/${editingBook.id}`, {
        method: "PUT",
        body: {
          title,
          author,
          isbn,
          genre: editGenreRef.current?.value?.trim() || null,
          deweyDecimal: editDeweyRef.current?.value?.trim() || null,
        },
      });
      toast.success("Book updated");
      setIsEditDialogOpen(false);
      setEditingBook(null);
      fetchBooks();
    } catch {
      toast.error("Failed to update book");
    }
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/books/${id}`, { method: "DELETE" });
      toast.success("Book deleted");
      fetchBooks();
    } catch {
      toast.error("Failed to delete book");
    }
  };

  const getStatusLabel = (book: Book) => {
    if (book.totalCopies === 0) {
      return <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">No Copies</Badge>;
    }
    if (book.availableCopies === 0) {
      return <Badge className="bg-brand-amber/15 text-brand-amber border-0 text-[10px]">All Checked Out</Badge>;
    }
    return <Badge className="bg-brand-sage/15 text-brand-sage border-0 text-[10px]">Available</Badge>;
  };

  const genres = ["all", ...allGenres];

  return (
    <div className="p-8 ">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">Library Catalog</h1>
        <p className="text-sm text-muted-foreground">Search and manage your book collection</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Books</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{pagination.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-navy/8 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-navy" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {books.filter((b) => b.availableCopies > 0).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center">
                <div className="w-3 h-3 bg-brand-sage rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checked Out</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {books.filter((b) => b.availableCopies === 0 && b.totalCopies > 0).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-amber/10 flex items-center justify-center">
                <div className="w-3 h-3 bg-brand-amber rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Copies</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {books.reduce((acc, book) => acc + book.totalCopies, 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-copper/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand-copper" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Filter className="w-4 h-4 text-brand-copper" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, ISBN, or Dewey number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g === "all" ? "All Genres" : g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="text-xs" onClick={() => { setSearchQuery(""); setGenreFilter("all"); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base font-display">
            <span>Catalog Results ({books.length})</span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
                  <BookOpen className="w-3.5 h-3.5 mr-2" />
                  Add New Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">Add New Book</DialogTitle>
                  <DialogDescription className="text-xs">Add a book to the library catalog</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-title" className="text-[11px] text-muted-foreground">Title *</Label>
                    <Input id="add-title" ref={addTitleRef} placeholder="Book title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-author" className="text-[11px] text-muted-foreground">Author *</Label>
                    <Input id="add-author" ref={addAuthorRef} placeholder="Author name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-isbn" className="text-[11px] text-muted-foreground">ISBN *</Label>
                    <Input id="add-isbn" ref={addIsbnRef} placeholder="9780743273565" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="add-genre" className="text-[11px] text-muted-foreground">Genre</Label>
                      <Input id="add-genre" ref={addGenreRef} placeholder="Fiction, Science..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-dewey" className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                      <Input id="add-dewey" ref={addDeweyRef} placeholder="813.52" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-xs">Cancel</Button>
                  <Button onClick={handleAddBook} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Add Book</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
              <span className="ml-2 text-sm text-muted-foreground">Loading catalog...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Author</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ISBN</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Dewey</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Genre</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Copies</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-[13px] text-muted-foreground">
                        No books found matching your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    books.map((book) => (
                      <TableRow key={book.id} className="hover:bg-secondary/40">
                        <TableCell className="text-[13px] font-medium">{book.title}</TableCell>
                        <TableCell className="text-[13px]">{book.author}</TableCell>
                        <TableCell className="text-[12px] text-muted-foreground font-mono">{book.isbn}</TableCell>
                        <TableCell>
                          {book.deweyDecimal ? (
                            <Badge variant="outline" className="text-[10px] font-mono">{book.deweyDecimal}</Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px]">{book.genre || "—"}</TableCell>
                        <TableCell>{getStatusLabel(book)}</TableCell>
                        <TableCell className="text-center text-[13px]">
                          {book.availableCopies}/{book.totalCopies}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(book)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(book.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Book Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingBook(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Book</DialogTitle>
            <DialogDescription className="text-xs">Update book details</DialogDescription>
          </DialogHeader>
          {editingBook && (
            <div className="space-y-3 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-[11px] text-muted-foreground">Title *</Label>
                <Input id="edit-title" ref={editTitleRef} defaultValue={editingBook.title} key={`t-${editingBook.id}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author" className="text-[11px] text-muted-foreground">Author *</Label>
                <Input id="edit-author" ref={editAuthorRef} defaultValue={editingBook.author} key={`a-${editingBook.id}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-isbn" className="text-[11px] text-muted-foreground">ISBN *</Label>
                <Input id="edit-isbn" ref={editIsbnRef} defaultValue={editingBook.isbn} key={`i-${editingBook.id}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-genre" className="text-[11px] text-muted-foreground">Genre</Label>
                  <Input id="edit-genre" ref={editGenreRef} defaultValue={editingBook.genre ?? ""} key={`g-${editingBook.id}`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dewey" className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                  <Input id="edit-dewey" ref={editDeweyRef} defaultValue={editingBook.deweyDecimal ?? ""} key={`d-${editingBook.id}`} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleEditBook} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
