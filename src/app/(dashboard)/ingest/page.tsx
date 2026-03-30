"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

interface LookupResponse {
  success: boolean;
  data: {
    isbn: string;
    found: boolean;
    metadata: {
      isbn: string | null;
      title: string | null;
      author: string | null;
      publisher: string | null;
      publishDate: string | null;
      coverImageUrl: string | null;
      subjects: string[];
      source: string | null;
    };
  };
}

type ReviewState = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  genre: string;
  dewey: string;
  coverImageUrl: string;
  source: string;
  found: boolean;
  subjects: string[];
};

const emptyReviewState: ReviewState = {
  isbn: "",
  title: "",
  author: "",
  publisher: "",
  publishDate: "",
  genre: "",
  dewey: "",
  coverImageUrl: "",
  source: "",
  found: false,
  subjects: [],
};

export default function BookIngestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  const [isbnInput, setIsbnInput] = useState("");
  const [reviewData, setReviewData] = useState<ReviewState | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateField =
    (field: keyof ReviewState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setReviewData((current) => (current ? { ...current, [field]: value } : current));
    };

  const resetReview = () => {
    setIsbnInput("");
    setReviewData(null);
  };

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedIsbn = isbnInput.trim();
    if (!trimmedIsbn) {
      toast.error("Enter an ISBN to look up book metadata.");
      return;
    }

    setIsLookingUp(true);

    try {
      const result = await apiFetch<LookupResponse>(
        `/ingest/lookup?${new URLSearchParams({ isbn: trimmedIsbn }).toString()}`
      ).then((response) => response.data);
      const metadata = result.metadata;

      setReviewData({
        isbn: result.isbn,
        title: metadata.title ?? "",
        author: metadata.author ?? "",
        publisher: metadata.publisher ?? "",
        publishDate: metadata.publishDate ?? "",
        genre: metadata.subjects[0] ?? "",
        dewey: "",
        coverImageUrl: metadata.coverImageUrl ?? "",
        source: metadata.source ?? "",
        found: result.found,
        subjects: metadata.subjects,
      });

      if (result.found) {
        toast.success("Metadata loaded. Review the fields before saving.");
      } else {
        toast.warning("No metadata was found for that ISBN. You can fill in the fields manually.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ISBN lookup failed";
      toast.error(message);
      setReviewData({
        ...emptyReviewState,
        isbn: trimmedIsbn,
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!reviewData) {
      return;
    }

    if (!reviewData.isbn || !reviewData.title || !reviewData.author) {
      toast.error("ISBN, title, and author are required before adding a book.");
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch("/books", {
        method: "POST",
        body: {
          title: reviewData.title,
          author: reviewData.author,
          isbn: reviewData.isbn,
          genre: reviewData.genre || undefined,
          deweyDecimal: reviewData.dewey || undefined,
          coverImageUrl: reviewData.coverImageUrl || undefined,
          publishDate: reviewData.publishDate || undefined,
        },
      });

      toast.success("Book added to catalog successfully.");
      resetReview();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add book to catalog";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (user && !canAccess) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-foreground">
          AI-Assisted Book Ingestion
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter an ISBN, review the returned metadata, and add the book to the catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">ISBN Lookup</CardTitle>
            <CardDescription className="text-xs">
              Search Open Library and fallback sources using a 10-digit or 13-digit ISBN.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLookup}>
              <div>
                <Label htmlFor="isbn-lookup" className="text-[11px] text-muted-foreground">
                  ISBN
                </Label>
                <Input
                  id="isbn-lookup"
                  value={isbnInput}
                  onChange={(event) => setIsbnInput(event.target.value)}
                  placeholder="9780141439518"
                  className="mt-1"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Example: <span className="font-mono">9780141439518</span> or <span className="font-mono">0-14-143951-3</span>
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLookingUp}
                className="w-full bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
              >
                {isLookingUp ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-3.5 w-3.5" />
                )}
                Look Up ISBN
              </Button>
            </form>

            {reviewData?.coverImageUrl ? (
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reviewData.coverImageUrl}
                  alt={reviewData.title || "Book cover"}
                  className="h-72 w-full bg-secondary/40 object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/25 p-8 text-center">
                <BookOpen className="mb-4 h-8 w-8 text-muted-foreground" />
                <p className="text-[13px] font-medium">No cover image loaded</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  A cover preview appears here when the metadata source provides one.
                </p>
              </div>
            )}

            {reviewData && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {reviewData.found ? "Metadata found" : "Manual review needed"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {reviewData.source
                        ? `Source: ${reviewData.source}`
                        : "No external metadata source returned a match."}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      reviewData.found
                        ? "border-brand-sage/20 bg-brand-sage/10 text-brand-sage"
                        : "border-brand-amber/20 bg-brand-amber/10 text-brand-amber"
                    }
                  >
                    {reviewData.found ? "Ready for review" : "Fill manually"}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Sparkles className="h-4 w-4 text-brand-copper" />
              Metadata Review
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm or edit the fields below before committing the record to the catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!reviewData && !isLookingUp && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Look up an ISBN to load metadata for review.
                </p>
              </div>
            )}

            {isLookingUp && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-copper" />
                <p className="text-[13px] text-muted-foreground">Fetching metadata...</p>
              </div>
            )}

            {reviewData && (
              <div className="space-y-4">
                <div
                  className={`flex items-center gap-2 rounded-xl border p-3 ${
                    reviewData.found
                      ? "border-brand-sage/15 bg-brand-sage/8"
                      : "border-brand-amber/15 bg-brand-amber/8"
                  }`}
                >
                  {reviewData.found ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-sage" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-brand-amber" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-[13px] font-medium ${
                        reviewData.found ? "text-brand-sage" : "text-brand-amber"
                      }`}
                    >
                      {reviewData.found ? "External metadata loaded" : "Metadata not found"}
                    </p>
                    <p
                      className={`text-[11px] ${
                        reviewData.found ? "text-brand-sage/70" : "text-brand-amber/70"
                      }`}
                    >
                      Title, author, and ISBN are required to save the book.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">ISBN</Label>
                    <Input value={reviewData.isbn} onChange={updateField("isbn")} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Title</Label>
                    <Input value={reviewData.title} onChange={updateField("title")} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Author</Label>
                    <Input value={reviewData.author} onChange={updateField("author")} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Publisher</Label>
                      <Input value={reviewData.publisher} onChange={updateField("publisher")} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Publish Date</Label>
                      <Input value={reviewData.publishDate} onChange={updateField("publishDate")} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Genre</Label>
                      <Input value={reviewData.genre} onChange={updateField("genre")} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                      <Input value={reviewData.dewey} onChange={updateField("dewey")} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Cover Image URL</Label>
                    <Input
                      value={reviewData.coverImageUrl}
                      onChange={updateField("coverImageUrl")}
                      className="mt-1"
                    />
                  </div>
                </div>

                {reviewData.subjects.length > 0 && (
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Subjects</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reviewData.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-[10px]">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    Accept & Add to Catalog
                  </Button>
                  <Button variant="outline" onClick={resetReview} className="text-xs">
                    <AlertCircle className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
