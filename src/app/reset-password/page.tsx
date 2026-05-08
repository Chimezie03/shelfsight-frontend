"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetPasswordApi } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; general?: string }>({});

  useEffect(() => {
    if (!token) {
      setErrors({ general: "Missing reset token. Open the link from your email again." });
    }
  }, [token]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!token) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { message } = await resetPasswordApi(token, password);
      toast.success(message);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setErrors({ general: err.message || "Reset link is invalid or expired." });
        } else {
          setErrors({ general: err.message || "Could not reset password." });
        }
      } else {
        setErrors({ general: "An unexpected error occurred." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-brand-navy rounded-2xl flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">Choose a new password</CardTitle>
            <CardDescription className="text-sm">Use at least 8 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errors.general && (
                <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {errors.general}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    disabled={isSubmitting || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="font-medium text-brand-navy hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
