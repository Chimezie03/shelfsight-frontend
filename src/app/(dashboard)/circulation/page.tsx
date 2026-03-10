"use client";

import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

/* ---------- Types matching backend responses ---------- */

interface LoanUser {
  id: string;
  name: string;
  email: string;
}

interface LoanBookCopy {
  id: string;
  barcode: string;
  book: { id: string; title: string; author: string };
}

interface Loan {
  id: string;
  user: LoanUser;
  bookCopy: LoanBookCopy;
  checkedOutAt: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: number;
  isOverdue: boolean;
}

interface LoansResponse {
  data: Loan[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  deweyDecimal: string | null;
  availableCopies: number;
  totalCopies: number;
  availableCopyIds: string[];
}

interface BooksResponse {
  data: BackendBook[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

/* ---------- Helpers ---------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function daysOverdue(dueDate: string) {
  const diff = Date.now() - new Date(dueDate).getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

/* ---------- Component ---------- */

export default function CirculationPage() {
  // --- Member / Book selection for checkout ---
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [members, setMembers] = useState<BackendUser[]>([]);
  const [bookResults, setBookResults] = useState<BackendBook[]>([]);
  const [selectedMember, setSelectedMember] = useState<BackendUser | null>(null);
  const [selectedBookCopyId, setSelectedBookCopyId] = useState<string | null>(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState<string>("");

  // --- Loans ---
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Stats (derived) ---
  const totalOverdue = allLoans.filter((l) => l.isOverdue).length;
  const totalActive = allLoans.length - totalOverdue;
  const totalFines = allLoans.reduce((s, l) => s + l.fineAmount, 0);

  /* ----- Fetch active loans (includes overdue) ----- */
  const fetchLoans = useCallback(async () => {
    setIsLoadingLoans(true);
    try {
      const result = await apiFetch<LoansResponse>("/loans?status=active&limit=100");
      setAllLoans(result.data);
    } catch {
      toast.error("Failed to load loan data");
    } finally {
      setIsLoadingLoans(false);
    }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  /* ----- Fetch members (for checkout) ----- */
  useEffect(() => {
    async function load() {
      setIsLoadingMembers(true);
      try {
        const users = await apiFetch<BackendUser[]>("/users");
        setMembers(users);
      } catch {
        // Not admin — fall back to empty list; user can still type IDs
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    load();
  }, []);

  /* ----- Search books (for checkout) ----- */
  useEffect(() => {
    if (!bookSearch.trim()) { setBookResults([]); return; }
    const t = setTimeout(async () => {
      setIsLoadingBooks(true);
      try {
        const res = await apiFetch<BooksResponse>(`/books?title=${encodeURIComponent(bookSearch.trim())}&limit=10`);
        setBookResults(res.data);
      } catch {
        setBookResults([]);
      } finally {
        setIsLoadingBooks(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [bookSearch]);

  /* ----- Checkout ----- */
  const handleCheckOut = async () => {
    if (!selectedMember || !selectedBookCopyId) {
      toast.error("Please select both a member and a book");
      return;
    }
    setIsProcessing(true);
    try {
      await apiFetch("/loans/checkout", {
        method: "POST",
        body: { bookCopyId: selectedBookCopyId, userId: selectedMember.id },
      });
      toast.success(`Checked out "${selectedBookTitle}" to ${selectedMember.name}`);
      setSelectedMember(null);
      setSelectedBookCopyId(null);
      setSelectedBookTitle("");
      fetchLoans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ----- Check-in ----- */
  const handleCheckIn = async (loanId: string) => {
    setIsProcessing(true);
    try {
      const result = await apiFetch<Loan>("/loans/checkin", {
        method: "POST",
        body: { loanId },
      });
      const fine = (result as unknown as { fineAmount?: number }).fineAmount ?? 0;
      toast.success(fine > 0
        ? `Book returned — Fine: $${fine.toFixed(2)}`
        : "Book returned successfully"
      );
      fetchLoans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Check-in failed";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ----- Status badge ----- */
  const getStatusBadge = (loan: Loan) => {
    if (loan.returnedAt) return <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">Returned</Badge>;
    if (loan.isOverdue) return <Badge className="bg-brand-brick/12 text-brand-brick border-0 text-[10px]">Overdue</Badge>;
    return <Badge className="bg-brand-navy/10 text-brand-navy border-0 text-[10px]">Active</Badge>;
  };

  /* ----- Filtered members ----- */
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  /* ----- Today / due date for new checkout ----- */
  const today = new Date().toISOString().slice(0, 10);
  const dueDate14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  /* ----- All displayable loans ----- */
  const allActiveLoans = allLoans;

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
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{totalActive}</p>
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
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{totalOverdue}</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Loans</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{totalActive + totalOverdue}</p>
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
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">${totalFines.toFixed(2)}</p>
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
                <CardDescription className="text-xs">Search by name or email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search member..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-copper" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredMembers.map((member) => (
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
                            <p className="text-[11px] text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge className="text-[10px] border-0 bg-brand-sage/12 text-brand-sage">
                            {member.role}
                          </Badge>
                        </div>
                      </button>
                    ))}
                    {filteredMembers.length === 0 && (
                      <p className="text-[12px] text-muted-foreground text-center py-4">No members found</p>
                    )}
                  </div>
                )}

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
                  <Input
                    placeholder="Search book..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoadingBooks ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-copper" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bookResults.map((book) => {
                      const available = book.availableCopies > 0;
                      return (
                        <button
                          key={book.id}
                          onClick={() => {
                            if (available && book.availableCopyIds?.length > 0) {
                              setSelectedBookCopyId(book.availableCopyIds[0]);
                              setSelectedBookTitle(book.title);
                            }
                          }}
                          disabled={!available}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                            selectedBookCopyId === book.id
                              ? "border-brand-copper bg-brand-copper/5 shadow-sm"
                              : available
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
                              className={`text-[10px] border-0 ${available ? "bg-brand-sage/12 text-brand-sage" : "bg-muted text-muted-foreground"}`}
                            >
                              {available ? `${book.availableCopies} avail` : "Checked Out"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                    {bookSearch.trim() && bookResults.length === 0 && !isLoadingBooks && (
                      <p className="text-[12px] text-muted-foreground text-center py-4">No books found</p>
                    )}
                  </div>
                )}

                {selectedBookTitle && (
                  <div className="p-3 bg-brand-copper/5 rounded-xl border border-brand-copper/15">
                    <p className="text-[11px] font-medium text-brand-copper">Selected Book</p>
                    <p className="text-[15px] font-semibold mt-0.5">{selectedBookTitle}</p>
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
                  <Input type="date" value={today} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Due Date (14 days)</Label>
                  <Input type="date" value={dueDate14} readOnly className="mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCheckOut}
                  disabled={!selectedMember || !selectedBookCopyId || isProcessing}
                  className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                  Complete Check-Out
                </Button>
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setSelectedMember(null);
                    setSelectedBookCopyId(null);
                    setSelectedBookTitle("");
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
              {isLoadingLoans ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading loans...</span>
                </div>
              ) : (
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
                    {allActiveLoans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-[13px] text-muted-foreground">
                          No active loans
                        </TableCell>
                      </TableRow>
                    ) : (
                      allActiveLoans.map((loan) => {
                        const overdueDays = daysOverdue(loan.dueDate);
                        return (
                          <TableRow key={loan.id} className="hover:bg-secondary/40">
                            <TableCell>
                              <div>
                                <p className="text-[13px] font-medium">{loan.bookCopy.book.title}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{loan.bookCopy.barcode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-[13px] font-medium">{loan.user.name}</p>
                                <p className="text-[11px] text-muted-foreground">{loan.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-[12px]">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(loan.checkedOutAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-[12px]">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDate(loan.dueDate)}
                                {loan.isOverdue && overdueDays > 0 && (
                                  <span className="text-[10px] text-brand-brick ml-1">
                                    ({overdueDays}d overdue)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(loan)}</TableCell>
                            <TableCell>
                              <span className={`text-[13px] ${loan.fineAmount > 0 ? "text-brand-brick font-medium" : "text-muted-foreground"}`}>
                                ${loan.fineAmount.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCheckIn(loan.id)}
                                  disabled={isProcessing}
                                  className="bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] h-8"
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                  Check In
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
