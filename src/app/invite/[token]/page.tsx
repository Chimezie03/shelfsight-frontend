"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";
import { fetchInvitePreview, type InvitePreview } from "@/lib/auth";
import { toast } from "sonner";

interface FieldErrors {
  name?: string;
  password?: string;
  general?: string;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const { acceptInvite } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!token) {
      setPreviewError("Invite link is missing a token.");
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    fetchInvitePreview(token)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setPreviewError("This invite is invalid or has expired. Ask your administrator to send a new one.");
        } else {
          setPreviewError(
            err instanceof Error ? err.message : "Could not load this invite",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Your name is required";
    if (!password) next.password = "Password is required";
    else if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await acceptInvite({ token, name, password });
      toast.success(`Welcome to ${preview?.organizationName ?? "your library"}!`);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        const envelope = err.data?.error as
          | { fieldErrors?: Record<string, string> }
          | undefined;
        if (envelope?.fieldErrors) {
          setErrors(envelope.fieldErrors as FieldErrors);
        } else if (err.status === 404) {
          setErrors({ general: "This invite has expired. Ask your administrator to send a new one." });
        } else {
          setErrors({ general: err.message || "Could not accept invite." });
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B2A4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-navy rounded-2xl flex items-center justify-center shadow-lg shadow-brand-navy/20 mb-4">
            <BookOpen className="w-7 h-7 text-brand-copper" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-brand-navy tracking-tight">
            ShelfSight
          </h1>
        </div>

        <Card className="shadow-xl shadow-brand-navy/5 border-border/60">
          {previewLoading ? (
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
            </CardContent>
          ) : previewError ? (
            <CardContent className="py-12 space-y-4 text-center">
              <p className="text-sm text-destructive">{previewError}</p>
              <Link href="/" className="text-sm font-medium text-brand-navy hover:underline">
                Go to sign-in
              </Link>
            </CardContent>
          ) : (
            preview && (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Join {preview.organizationName}</CardTitle>
                  <CardDescription>
                    You&rsquo;ve been invited as <span className="font-medium">{preview.role.toLowerCase()}</span>
                    {preview.email ? <> for <span className="font-medium">{preview.email}</span></> : null}.
                    Set a password to accept.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {errors.general && (
                      <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        {errors.general}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                        }}
                        aria-invalid={!!errors.name}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                          }}
                          aria-invalid={!!errors.password}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Accept invite"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )
          )}
        </Card>
      </div>
    </div>
  );
}
