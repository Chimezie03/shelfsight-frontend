"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Building2,
  Users,
  Palette,
  CreditCard,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import {
  getOrgApi,
  renameOrgApi,
  deleteOrgApi,
  updateMyProfileApi,
  type OrgDetails,
} from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, organization, and workspace preferences.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="organization" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Organization
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Members
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="billing" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="danger" className="gap-1.5 text-red-600 data-[state=active]:text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab onSaved={refresh} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="organization">
            <OrganizationTab onSaved={refresh} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="members">
            <MembersShortcutTab />
          </TabsContent>
        )}

        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="danger">
            <DangerZoneTab
              onDeleted={async () => {
                await logout();
                router.push("/");
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ProfileTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const dirty = name.trim() !== user?.name || email.trim() !== user?.email;

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateMyProfileApi(user.userId, {
        name: name.trim(),
        email: email.trim(),
      });
      await onSaved();
      toast.success("Profile updated.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("That email is already in use in this organization.");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not update profile.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      // The PUT /users/:id endpoint accepts an optional password; the backend
      // hashes it. There's no separate "current password" check today.
      await updateMyProfileApi(user.userId, { password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be unique within your organization.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={!dirty || isSavingProfile}
              className="bg-brand-navy text-white hover:bg-brand-navy/90"
            >
              {isSavingProfile && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Optional — required for sensitive ops in the future"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || isSavingPassword}
              className="bg-brand-navy text-white hover:bg-brand-navy/90"
            >
              {isSavingPassword && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getOrgApi(user.organizationId);
      setOrg(data);
      setName(data.name);
    } catch {
      toast.error("Could not load organization details.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Organization name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await renameOrgApi(user.organizationId, name.trim());
      setOrg((prev) => (prev ? { ...prev, name: updated.name, slug: updated.slug } : prev));
      await onSaved();
      toast.success("Organization renamed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not rename organization.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !org ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand-copper" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="mt-0.5 font-mono">{org.slug}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-0.5">{new Date(org.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="mt-0.5">{org.counts.users}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Books in catalog</p>
                <p className="mt-0.5">
                  {org.counts.books} ({org.counts.bookCopies} copies)
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving || name.trim() === org.name}
                className="bg-brand-navy text-white hover:bg-brand-navy/90"
              >
                {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MembersShortcutTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Invite, edit, and remove members of your organization. Manage roles and view loan history
          from the Members page.
        </p>
        <Button asChild variant="outline">
          <Link href="/members">
            Manage members <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  // next-themes returns undefined on the server so we delay reading `theme`
  // until after hydration via useSyncExternalStore — avoids a mismatched
  // active highlight without using setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how ShelfSight looks to you. System matches your device setting.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isActive = mounted && theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  isActive
                    ? "border-brand-copper bg-brand-copper/10 text-brand-copper"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-medium">Billing coming soon</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We&apos;re working on plans, invoices, and payment methods. Your workspace is on the
            free tier in the meantime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DangerZoneTab({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [orgNameInput, setOrgNameInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const orgName = user?.organizationName ?? "";
  const canConfirm = orgNameInput === orgName && confirmInput === "DELETE";

  const handleDelete = async (e: React.MouseEvent) => {
    if (!user || !canConfirm) {
      e.preventDefault();
      return;
    }
    e.preventDefault(); // keep dialog open while we work
    setIsDeleting(true);
    try {
      await deleteOrgApi(user.organizationId);
      toast.success("Organization deleted.");
      await onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete organization.");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="font-medium text-red-900 dark:text-red-100">Delete this organization</p>
          <p className="mt-1 text-red-800/80 dark:text-red-200/80">
            Permanently delete <strong>{orgName}</strong> along with all members, books, copies,
            loans, fines, and shelves. This cannot be undone.
          </p>
        </div>

        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setOrgNameInput("");
              setConfirmInput("");
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete organization</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {orgName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the organization and every record inside it: members,
                books, copies, loans, fines, shelves, and ingestion jobs. There is no recovery.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-2">
              <div className="grid gap-2">
                <Label htmlFor="confirm-org-name">
                  Type <span className="font-mono">{orgName}</span> to confirm
                </Label>
                <Input
                  id="confirm-org-name"
                  value={orgNameInput}
                  onChange={(e) => setOrgNameInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-delete">
                  Then type <span className="font-mono">DELETE</span>
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!canConfirm || isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Permanently delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
