"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";

interface FieldErrors {
  orgName?: string;
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!orgName.trim()) {
      next.orgName = "Library name is required";
    }
    if (!name.trim()) {
      next.name = "Your name is required";
    }
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }
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

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup({ orgName, name, email, password });
      toast.success(`Welcome to ${orgName.trim()}!`);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        const errorEnvelope = err.data?.error as
          | { fieldErrors?: Record<string, string> }
          | undefined;
        if (errorEnvelope?.fieldErrors) {
          setErrors(errorEnvelope.fieldErrors as FieldErrors);
        } else if (err.status === 409) {
          setErrors({ email: err.message });
        } else if (err.status === 0) {
          setErrors({ general: "Unable to reach the server. Please try again later." });
        } else {
          setErrors({ general: err.message || "Signup failed. Please try again." });
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B2A4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-copper/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-navy/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-navy rounded-2xl flex items-center justify-center shadow-lg shadow-brand-navy/20 mb-4">
            <BookOpen className="w-7 h-7 text-brand-copper" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-brand-navy tracking-tight">
            ShelfSight
          </h1>
          <p className="text-sm text-brand-warm-gray mt-1">
            AI-Assisted Library Management
          </p>
        </div>

        <Card className="shadow-xl shadow-brand-navy/5 border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create your library</CardTitle>
            <CardDescription>
              Sign up to spin up a fresh library. You&rsquo;ll be the first administrator.
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
                <Label htmlFor="orgName">Library name</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Hatch Memorial Library"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (errors.orgName) setErrors((p) => ({ ...p, orgName: undefined }));
                  }}
                  aria-invalid={!!errors.orgName}
                  disabled={isSubmitting}
                />
                {errors.orgName && (
                  <p className="text-xs text-destructive">{errors.orgName}</p>
                )}
              </div>

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@library.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
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
                    Creating...
                  </>
                ) : (
                  "Create library"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/" className="font-medium text-brand-navy hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
