"use client";

import { useState, useEffect, useRef } from "react";
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
  Calendar,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BackendUser | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BackendUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [members, setMembers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for the add-member form
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<string>("PATRON");

  // Refs for the edit-member form
  const editNameRef = useRef<HTMLInputElement>(null);
  const editEmailRef = useRef<HTMLInputElement>(null);
  const editPasswordRef = useRef<HTMLInputElement>(null);
  const editRoleRef = useRef<string>("");

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const users = await apiFetch<BackendUser[]>("/users");
      setMembers(users);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
      if (status === 403) {
        toast.error("Admin access required. Log in as admin@shelfsight.com to manage members.");
      } else {
        toast.error("Failed to load members");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-brand-navy/12 text-brand-navy border-0 text-[10px]">Admin</Badge>;
      case "STAFF":
        return <Badge className="bg-brand-sage/12 text-brand-sage border-0 text-[10px]">Staff</Badge>;
      case "PATRON":
      default:
        return <Badge className="bg-brand-copper/12 text-brand-copper border-0 text-[10px]">Patron</Badge>;
    }
  };

  const handleAddMember = async () => {
    const name = nameRef.current?.value?.trim();
    const email = emailRef.current?.value?.trim();
    const password = passwordRef.current?.value?.trim();
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required");
      return;
    }
    try {
      await apiFetch("/users", {
        method: "POST",
        body: { name, email, password, role: roleRef.current },
      });
      toast.success("New member added successfully");
      setIsAddDialogOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
      if (status === 403) {
        toast.error("Only admins can add members. Log in as admin@shelfsight.com.");
      } else {
        toast.error("Failed to add member" + (err instanceof Error ? `: ${err.message}` : ""));
      }
    }
  };

  const handleViewMember = (member: BackendUser) => {
    setSelectedMember(member);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (member: BackendUser) => {
    setEditingMember(member);
    editRoleRef.current = member.role;
    setIsEditDialogOpen(true);
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    const name = editNameRef.current?.value?.trim();
    const email = editEmailRef.current?.value?.trim();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    const body: Record<string, string> = { name, email, role: editRoleRef.current };
    const pw = editPasswordRef.current?.value?.trim();
    if (pw) body.password = pw;
    try {
      await apiFetch(`/users/${editingMember.id}`, { method: "PUT", body });
      toast.success("Member updated successfully");
      setIsEditDialogOpen(false);
      setEditingMember(null);
      fetchMembers();
    } catch {
      toast.error("Failed to update member");
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      toast.success("Member deleted successfully");
      fetchMembers();
    } catch {
      toast.error("Failed to delete member");
    }
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
                <Input id="name" ref={nameRef} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] text-muted-foreground">Email</Label>
                <Input id="email" ref={emailRef} type="email" placeholder="john.doe@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] text-muted-foreground">Password</Label>
                <Input id="password" ref={passwordRef} type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[11px] text-muted-foreground">Role</Label>
                <Select defaultValue="PATRON" onValueChange={(v) => { roleRef.current = v; }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATRON">Patron</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Members</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">{members.length}</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {members.filter((m) => m.role === "STAFF").length}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patrons</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {members.filter((m) => m.role === "PATRON").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-copper/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-copper" />
              </div>
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="PATRON">Patron</SelectItem>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
              <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Member</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Join Date</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Role</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-[13px] text-muted-foreground">
                        No members found matching your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-secondary/40">
                        <TableCell>
                          <p className="text-[13px] font-medium">{member.name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(member.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(member)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteMember(member.id)}
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
          )}
        </CardContent>
      </Card>

      {/* View Member Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Member Details</DialogTitle>
            <DialogDescription className="text-xs">Member information</DialogDescription>
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
                      <p className="text-[11px] text-muted-foreground">Email</p>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[13px]">{selectedMember.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Account Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Role</p>
                      {getRoleBadge(selectedMember.role)}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Joined</p>
                      <p className="text-[13px] font-medium">
                        {new Date(selectedMember.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingMember(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Member</DialogTitle>
            <DialogDescription className="text-xs">Update member account details</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-[11px] text-muted-foreground">Full Name</Label>
                <Input id="edit-name" ref={editNameRef} defaultValue={editingMember.name} key={`en-${editingMember.id}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-[11px] text-muted-foreground">Email</Label>
                <Input id="edit-email" ref={editEmailRef} type="email" defaultValue={editingMember.email} key={`ee-${editingMember.id}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-[11px] text-muted-foreground">New Password (leave blank to keep)</Label>
                <Input id="edit-password" ref={editPasswordRef} type="password" placeholder="••••••••" key={`ep-${editingMember.id}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-[11px] text-muted-foreground">Role</Label>
                <Select defaultValue={editingMember.role} onValueChange={(v) => { editRoleRef.current = v; }} key={`er-${editingMember.id}`}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATRON">Patron</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleEditMember} className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}