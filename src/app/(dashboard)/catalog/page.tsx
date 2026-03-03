"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, MapPin, Edit, Trash2 } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  dewey: string;
  category: string;
  location: string;
  status: "available" | "checked-out" | "maintenance";
  copies: number;
}

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const mockBooks: Book[] = [
    {
      id: "1",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "978-0-7432-7356-5",
      dewey: "813.52",
      category: "Fiction",
      location: "Section A-2, Shelf 3",
      status: "available",
      copies: 3,
    },
    {
      id: "2",
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "978-0-06-112008-4",
      dewey: "813.54",
      category: "Fiction",
      location: "Section B-1, Shelf 2",
      status: "checked-out",
      copies: 2,
    },
    {
      id: "3",
      title: "1984",
      author: "George Orwell",
      isbn: "978-0-452-28423-4",
      dewey: "823.912",
      category: "Fiction",
      location: "Section B-1, Shelf 5",
      status: "available",
      copies: 4,
    },
    {
      id: "4",
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      isbn: "978-0-06-231609-7",
      dewey: "909",
      category: "Non-Fiction",
      location: "Section C-1, Shelf 4",
      status: "available",
      copies: 2,
    },
    {
      id: "5",
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      isbn: "978-0-553-38016-3",
      dewey: "530.1",
      category: "Science",
      location: "Section C-1, Shelf 8",
      status: "maintenance",
      copies: 1,
    },
    {
      id: "6",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "978-0-14-143951-8",
      dewey: "823.7",
      category: "Fiction",
      location: "Section A-1, Shelf 1",
      status: "available",
      copies: 5,
    },
    {
      id: "7",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-0-547-92822-7",
      dewey: "823.912",
      category: "Fantasy",
      location: "Section B-2, Shelf 6",
      status: "checked-out",
      copies: 3,
    },
    {
      id: "8",
      title: "The Selfish Gene",
      author: "Richard Dawkins",
      isbn: "978-0-19-929114-4",
      dewey: "576.8",
      category: "Science",
      location: "Section C-2, Shelf 3",
      status: "available",
      copies: 2,
    },
  ];

  const filteredBooks = mockBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery) ||
      book.dewey.includes(searchQuery);

    const matchesCategory = categoryFilter === "all" || book.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || book.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: Book["status"]) => {
    switch (status) {
      case "available":
        return <Badge className="bg-brand-sage/15 text-brand-sage border-0 text-[10px]">Available</Badge>;
      case "checked-out":
        return <Badge className="bg-brand-amber/15 text-brand-amber border-0 text-[10px]">Checked Out</Badge>;
      case "maintenance":
        return <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Maintenance</Badge>;
    }
  };

  const categories = ["all", "Fiction", "Non-Fiction", "Science", "Fantasy"];
  const statuses = ["all", "available", "checked-out", "maintenance"];

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
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{mockBooks.length}</p>
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
                  {mockBooks.filter((b) => b.status === "available").length}
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
                  {mockBooks.filter((b) => b.status === "checked-out").length}
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
                  {mockBooks.reduce((acc, book) => acc + book.copies, 0)}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base font-display">
            <span>Catalog Results ({filteredBooks.length})</span>
            <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
              <BookOpen className="w-3.5 h-3.5 mr-2" />
              Add New Book
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Author</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ISBN</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Dewey</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Category</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Location</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Copies</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-[13px] text-muted-foreground">
                      No books found matching your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id} className="hover:bg-secondary/40">
                      <TableCell className="text-[13px] font-medium">{book.title}</TableCell>
                      <TableCell className="text-[13px]">{book.author}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground font-mono">{book.isbn}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">{book.dewey}</Badge>
                      </TableCell>
                      <TableCell className="text-[13px]">{book.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {book.location}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(book.status)}</TableCell>
                      <TableCell className="text-center text-[13px]">{book.copies}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        </CardContent>
      </Card>
    </div>
  );
}
