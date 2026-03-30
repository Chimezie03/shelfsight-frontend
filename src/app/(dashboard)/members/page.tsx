"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Mail, Search, UserRound, BookOpen, AlertTriangle } from "lucide-react";

type UserRole = "ADMIN" | "STAFF" | "PATRON";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface LoanBook {
  title: string;
  author: string;
}

interface LoanItem {
  id: string;
  dueDate: string;
  checkedOutAt: string;
  returnedAt: string | null;
  fineAmount: number;
  isOverdue: boolean;
  bookCopy: {
    id: string;
    barcode: string;
    book: LoanBook;
  };
}

interface UserRef {
  id: string;
  name: string;
  email: string;
}

interface LoanApiItem extends LoanItem {
  user: UserRef;
}

interface PaginatedLoans {
  data: LoanApiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function roleLabel(role: UserRole) {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  return "Patron";
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return <Badge className="bg-brand-navy/12 text-brand-navy border-0 text-[10px]">Admin</Badge>;
  }

  if (role === "STAFF") {
    return <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">Staff</Badge>;
  }

  return <Badge className="bg-brand-copper/12 text-brand-copper border-0 text-[10px]">Patron</Badge>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function fetchAllLoansForUser(userId: string) {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const allLoans: LoanApiItem[] = [];

  while (page <= totalPages) {
    const res = await apiFetch<PaginatedLoans>(
      `/loans?userId=${encodeURIComponent(userId)}&page=${page}&limit=${pageSize}`,
    );
    allLoans.push(...res.data);
    totalPages = res.pagination.totalPages;
    page += 1;
  }

  return allLoans;
}

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = user?.role === "ADMIN";

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");

  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [selectedUserLoans, setSelectedUserLoans] = useState<LoanApiItem[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      setIsUsersLoading(true);
      try {
        const data = await apiFetch<UserSummary[]>("/users");
        setUsers(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          toast.error("Admin access required to view members.");
        } else {
          toast.error("Failed to load members.");
        }
      } finally {
        setIsUsersLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const activeLoans = useMemo(
    () => selectedUserLoans.filter((loan) => loan.returnedAt === null),
    [selectedUserLoans],
  );

  const fineSummary = useMemo(() => {
    const totalAccrued = selectedUserLoans.reduce((sum, loan) => sum + (loan.fineAmount || 0), 0);
    const activeRecorded = activeLoans.reduce((sum, loan) => sum + (loan.fineAmount || 0), 0);
    const overdueActiveCount = activeLoans.filter((loan) => loan.isOverdue).length;

    return {
      totalAccrued,
      activeRecorded,
      overdueActiveCount,
    };
  }, [selectedUserLoans, activeLoans]);

  const handleOpenProfile = async (user: UserSummary) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
    setIsProfileLoading(true);

    try {
      const loans = await fetchAllLoansForUser(user.id);
      setSelectedUserLoans(loans);
    } catch {
      toast.error("Failed to load user profile details.");
      setSelectedUserLoans([]);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const staffCount = users.filter((user) => user.role === "STAFF").length;
  const patronCount = users.filter((user) => user.role === "PATRON").length;

  if (user && !canAccess) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">
          Members
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse library members and open profile details with active loans and fine summary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Members</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">{users.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">{staffCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patrons</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">{patronCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Search className="w-4 h-4 text-brand-copper" />
            Search Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={roleFilter === "ALL" ? "default" : "outline"}
                className="text-xs"
                onClick={() => setRoleFilter("ALL")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={roleFilter === "ADMIN" ? "default" : "outline"}
                className="text-xs"
                onClick={() => setRoleFilter("ADMIN")}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant={roleFilter === "STAFF" ? "default" : "outline"}
                className="text-xs"
                onClick={() => setRoleFilter("STAFF")}
              >
                Staff
              </Button>
              <Button
                type="button"
                variant={roleFilter === "PATRON" ? "default" : "outline"}
                className="text-xs"
                onClick={() => setRoleFilter("PATRON")}
              >
                Patron
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Members List ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-brand-copper mr-2" />
              Loading members...
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No members matched this search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Joined
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-secondary/40"
                      onClick={() => void handleOpenProfile(user)}
                    >
                      <TableCell>
                        <p className="text-[13px] font-medium">{user.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isProfileOpen}
        onOpenChange={(nextOpen) => {
          setIsProfileOpen(nextOpen);
          if (!nextOpen) {
            setSelectedUserLoans([]);
            setSelectedUser(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-xl p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="font-display text-lg">Member Profile</SheetTitle>
            <SheetDescription>
              {selectedUser ? `${selectedUser.name} - ${roleLabel(selectedUser.role)}` : "Member details"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {isProfileLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-brand-copper mr-2" />
                Loading profile details...
              </div>
            ) : !selectedUser ? (
              <p className="text-sm text-muted-foreground">No member selected.</p>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserRound className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="pt-1">
                      <RoleBadge role={selectedUser.role} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display">Fine Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Accrued</p>
                      <p className="text-lg font-semibold">${fineSummary.totalAccrued.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active Loan Fines</p>
                      <p className="text-lg font-semibold">${fineSummary.activeRecorded.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Overdue Active Loans</p>
                      <p className="text-lg font-semibold">{fineSummary.overdueActiveCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display">Active Loans ({activeLoans.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeLoans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active loans.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeLoans.map((loan) => (
                          <div key={loan.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{loan.bookCopy.book.title}</p>
                                <p className="text-xs text-muted-foreground">{loan.bookCopy.book.author}</p>
                              </div>
                              <Badge
                                className={
                                  loan.isOverdue
                                    ? "bg-destructive/10 text-destructive border-0 text-[10px]"
                                    : "bg-brand-sage/15 text-brand-sage border-0 text-[10px]"
                                }
                              >
                                {loan.isOverdue ? "Overdue" : "Checked Out"}
                              </Badge>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5" />
                              Copy: {loan.bookCopy.barcode}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Due: {formatDate(loan.dueDate)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
