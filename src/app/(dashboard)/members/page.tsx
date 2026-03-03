"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberNumber: string;
  address: string;
  joinDate: string;
  status: "active" | "suspended" | "expired";
  booksCheckedOut: number;
  totalBorrowed: number;
  fines: number;
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const mockMembers: Member[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      memberNumber: "M001234",
      address: "123 Main St, Springfield, IL 62701",
      joinDate: "2024-01-15",
      status: "active",
      booksCheckedOut: 2,
      totalBorrowed: 47,
      fines: 0,
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.c@email.com",
      phone: "(555) 234-5678",
      memberNumber: "M001235",
      address: "456 Oak Ave, Springfield, IL 62702",
      joinDate: "2024-03-22",
      status: "active",
      booksCheckedOut: 1,
      totalBorrowed: 23,
      fines: 2.50,
    },
    {
      id: "3",
      name: "Emily Davis",
      email: "emily.d@email.com",
      phone: "(555) 345-6789",
      memberNumber: "M001236",
      address: "789 Elm St, Springfield, IL 62703",
      joinDate: "2023-11-10",
      status: "suspended",
      booksCheckedOut: 0,
      totalBorrowed: 65,
      fines: 15.00,
    },
    {
      id: "4",
      name: "James Wilson",
      email: "james.w@email.com",
      phone: "(555) 456-7890",
      memberNumber: "M001237",
      address: "321 Pine Rd, Springfield, IL 62704",
      joinDate: "2025-06-05",
      status: "active",
      booksCheckedOut: 3,
      totalBorrowed: 12,
      fines: 0,
    },
    {
      id: "5",
      name: "Linda Martinez",
      email: "linda.m@email.com",
      phone: "(555) 567-8901",
      memberNumber: "M001238",
      address: "654 Maple Dr, Springfield, IL 62705",
      joinDate: "2023-02-18",
      status: "expired",
      booksCheckedOut: 0,
      totalBorrowed: 89,
      fines: 0,
    },
  ];

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberNumber.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Member["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">Active</Badge>;
      case "suspended":
        return <Badge className="bg-brand-brick/12 text-brand-brick border-0 text-[10px]">Suspended</Badge>;
      case "expired":
        return <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Expired</Badge>;
    }
  };

  const handleAddMember = () => {
    toast.success("New member added successfully");
    setIsAddDialogOpen(false);
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setIsViewDialogOpen(true);
  };

  const handleDeleteMember = () => {
    toast.success("Member deleted successfully");
  };

  return (
    <div className="p-8 ">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">Member Management</h1>
          <p className="text-sm text-muted-foreground">Manage library members and their accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-2" />
              Add New Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Member</DialogTitle>
              <DialogDescription className="text-xs">Create a new library member account</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] text-muted-foreground">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] text-muted-foreground">Email</Label>
                <Input id="email" type="email" placeholder="john.doe@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[11px] text-muted-foreground">Phone</Label>
                <Input id="phone" placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberNumber" className="text-[11px] text-muted-foreground">Member Number</Label>
                <Input id="memberNumber" placeholder="M001239" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address" className="text-[11px] text-muted-foreground">Address</Label>
                <Input id="address" placeholder="123 Main St, City, State, ZIP" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleAddMember} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Add Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Members</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{mockMembers.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-navy/8 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-navy" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Members</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {mockMembers.filter((m) => m.status === "active").length}
                </p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suspended</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {mockMembers.filter((m) => m.status === "suspended").length}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Fines Due</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  ${mockMembers.reduce((acc, m) => acc + m.fines, 0).toFixed(2)}
                </p>
              </div>
              <span className="text-[11px] font-medium text-brand-amber">Outstanding</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Search className="w-4 h-4 text-brand-copper" />
            Search Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or member number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Members List ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Member</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Member Number</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Join Date</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Books Out</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fines</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-[13px] text-muted-foreground">
                      No members found matching your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-secondary/40">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium">{member.name}</p>
                          <p className="text-[11px] text-muted-foreground">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">{member.memberNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(member.joinDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={member.booksCheckedOut > 0 ? "default" : "secondary"} className="text-[10px]">
                          {member.booksCheckedOut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[13px] ${member.fines > 0 ? "text-brand-brick font-medium" : "text-muted-foreground"}`}>
                          ${member.fines.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewMember(member)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteMember()}
                          >
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

      {/* View Member Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Member Details</DialogTitle>
            <DialogDescription className="text-xs">Complete member information and borrowing history</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Full Name</p>
                      <p className="text-[13px] font-medium">{selectedMember.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Member Number</p>
                      <p className="text-[13px] font-medium font-mono">{selectedMember.memberNumber}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Email</p>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[13px]">{selectedMember.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[13px]">{selectedMember.phone}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Address</p>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                        <p className="text-[13px]">{selectedMember.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Account Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Status</p>
                      {getStatusBadge(selectedMember.status)}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Join Date</p>
                      <p className="text-[13px] font-medium">
                        {new Date(selectedMember.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Books Checked Out</p>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-brand-copper" />
                        <p className="text-[13px] font-medium">{selectedMember.booksCheckedOut}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Total Books Borrowed</p>
                      <p className="text-[13px] font-medium">{selectedMember.totalBorrowed}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Outstanding Fines</p>
                      <p className={`text-[13px] font-medium ${selectedMember.fines > 0 ? "text-brand-brick" : "text-brand-sage"}`}>
                        ${selectedMember.fines.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">View Borrowing History</Button>
                  <Button size="sm" variant="outline" className="text-xs">Send Email</Button>
                  <Button size="sm" variant="outline" className="text-xs">Edit Member</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
