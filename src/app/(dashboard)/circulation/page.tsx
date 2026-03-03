"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen,
  UserCircle,
  Search,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  status: "active" | "suspended";
}

interface Transaction {
  id: string;
  bookTitle: string;
  bookISBN: string;
  memberName: string;
  memberNumber: string;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  status: "active" | "overdue" | "returned";
  fine: number;
}

export default function CirculationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<{ id: string; title: string; isbn: string; available: boolean } | null>(null);

  const mockMembers: Member[] = [
    { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", memberNumber: "M001234", status: "active" },
    { id: "2", name: "Michael Chen", email: "michael.c@email.com", memberNumber: "M001235", status: "active" },
    { id: "3", name: "Emily Davis", email: "emily.d@email.com", memberNumber: "M001236", status: "suspended" },
  ];

  const mockBooks = [
    { id: "1", title: "The Great Gatsby", isbn: "978-0-7432-7356-5", available: true },
    { id: "2", title: "To Kill a Mockingbird", isbn: "978-0-06-112008-4", available: false },
    { id: "3", title: "1984", isbn: "978-0-452-28423-4", available: true },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: "1",
      bookTitle: "The Great Gatsby",
      bookISBN: "978-0-7432-7356-5",
      memberName: "Sarah Johnson",
      memberNumber: "M001234",
      checkoutDate: "2026-02-10",
      dueDate: "2026-02-24",
      status: "active",
      fine: 0,
    },
    {
      id: "2",
      bookTitle: "Sapiens",
      bookISBN: "978-0-06-231609-7",
      memberName: "Michael Chen",
      memberNumber: "M001235",
      checkoutDate: "2026-02-01",
      dueDate: "2026-02-15",
      status: "overdue",
      fine: 2.50,
    },
    {
      id: "3",
      bookTitle: "Pride and Prejudice",
      bookISBN: "978-0-14-143951-8",
      memberName: "Emily Davis",
      memberNumber: "M001236",
      checkoutDate: "2026-01-20",
      dueDate: "2026-02-03",
      returnDate: "2026-02-10",
      status: "returned",
      fine: 3.50,
    },
  ];

  const handleCheckOut = () => {
    if (!selectedMember || !selectedBook) {
      toast.error("Please select both a member and a book");
      return;
    }
    toast.success(`Checked out "${selectedBook.title}" to ${selectedMember.name}`);
    setSelectedMember(null);
    setSelectedBook(null);
  };

  const handleCheckIn = () => {
    toast.success("Book checked in successfully");
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-brand-navy/10 text-brand-navy border-0 text-[10px]">Active</Badge>;
      case "overdue":
        return <Badge className="bg-brand-brick/12 text-brand-brick border-0 text-[10px]">Overdue</Badge>;
      case "returned":
        return <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">Returned</Badge>;
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date("2026-02-17");
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="p-8 ">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">Circulation Management</h1>
        <p className="text-sm text-muted-foreground">Handle check-ins, check-outs, and manage transactions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Loans</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {mockTransactions.filter((t) => t.status === "active").length}
                </p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue Items</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {mockTransactions.filter((t) => t.status === "overdue").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-brick/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-brand-brick" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Returns Today</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">5</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-sage" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding Fines</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">$28.50</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-amber/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-amber" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checkout" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="checkout">Check-Out / Check-In</TabsTrigger>
          <TabsTrigger value="transactions">Active Transactions</TabsTrigger>
        </TabsList>

        {/* Check-Out Tab */}
        <TabsContent value="checkout" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <UserCircle className="w-4 h-4 text-brand-copper" />
                  Select Member
                </CardTitle>
                <CardDescription className="text-xs">Search by name or member number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockMembers
                    .filter(
                      (m) =>
                        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.memberNumber.includes(searchQuery)
                    )
                    .map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                          selectedMember?.id === member.id
                            ? "border-brand-copper bg-brand-copper/5 shadow-sm"
                            : "border-border hover:border-brand-copper/30 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-medium">{member.name}</p>
                            <p className="text-[11px] text-muted-foreground">{member.memberNumber}</p>
                          </div>
                          <Badge
                            className={`text-[10px] border-0 ${member.status === "active" ? "bg-brand-sage/12 text-brand-sage" : "bg-brand-brick/12 text-brand-brick"}`}
                          >
                            {member.status}
                          </Badge>
                        </div>
                      </button>
                    ))}
                </div>

                {selectedMember && (
                  <div className="p-3 bg-brand-copper/5 rounded-xl border border-brand-copper/15">
                    <p className="text-[11px] font-medium text-brand-copper">Selected Member</p>
                    <p className="text-[15px] font-semibold mt-0.5">{selectedMember.name}</p>
                    <p className="text-[12px] text-muted-foreground">{selectedMember.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Book Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <BookOpen className="w-4 h-4 text-brand-copper" />
                  Select Book
                </CardTitle>
                <CardDescription className="text-xs">Search by title or ISBN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search book..." className="pl-10" />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => book.available && setSelectedBook(book)}
                      disabled={!book.available}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        selectedBook?.id === book.id
                          ? "border-brand-copper bg-brand-copper/5 shadow-sm"
                          : book.available
                          ? "border-border hover:border-brand-copper/30 bg-card"
                          : "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium">{book.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{book.isbn}</p>
                        </div>
                        <Badge
                          className={`text-[10px] border-0 ${book.available ? "bg-brand-sage/12 text-brand-sage" : "bg-muted text-muted-foreground"}`}
                        >
                          {book.available ? "Available" : "Checked Out"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedBook && (
                  <div className="p-3 bg-brand-copper/5 rounded-xl border border-brand-copper/15">
                    <p className="text-[11px] font-medium text-brand-copper">Selected Book</p>
                    <p className="text-[15px] font-semibold mt-0.5">{selectedBook.title}</p>
                    <p className="text-[12px] text-muted-foreground font-mono">{selectedBook.isbn}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Complete Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Checkout Date</Label>
                  <Input type="date" value="2026-02-17" readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Due Date (14 days)</Label>
                  <Input type="date" value="2026-03-03" readOnly className="mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCheckOut}
                  disabled={!selectedMember || !selectedBook}
                  className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  Complete Check-Out
                </Button>
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setSelectedMember(null);
                    setSelectedBook(null);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Active Loans & Overdue Items</CardTitle>
              <CardDescription className="text-xs">Manage current circulation and process returns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Book Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Member</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Checkout Date</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fine</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions
                    .filter((t) => t.status !== "returned")
                    .map((transaction) => {
                      const daysOverdue = calculateDaysOverdue(transaction.dueDate);
                      return (
                        <TableRow key={transaction.id} className="hover:bg-secondary/40">
                          <TableCell>
                            <div>
                              <p className="text-[13px] font-medium">{transaction.bookTitle}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{transaction.bookISBN}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-[13px] font-medium">{transaction.memberName}</p>
                              <p className="text-[11px] text-muted-foreground">{transaction.memberNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px]">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.checkoutDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px]">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(transaction.dueDate).toLocaleDateString()}
                              {daysOverdue > 0 && (
                                <span className="text-[10px] text-brand-brick ml-1">
                                  ({daysOverdue}d overdue)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>
                            <span className={`text-[13px] ${transaction.fine > 0 ? "text-brand-brick font-medium" : "text-muted-foreground"}`}>
                              ${transaction.fine.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn()}
                                className="bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] h-8"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Check In
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
