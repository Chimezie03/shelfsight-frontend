"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Globe,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";

interface IngestionJob {
  id: string;
  imageUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "APPROVED" | "REJECTED";
  ocrText: string | null;
  detectedIsbn: string | null;
  suggestedDewey: string | null;
  confidenceScore: number | null;
  suggestedTitle: string | null;
  suggestedAuthor: string | null;
  suggestedPublisher: string | null;
  suggestedPublishDate: string | null;
  suggestedGenre: string | null;
  coverImageUrl: string | null;
  metadataSource: string | null;
  deweyReasoning: string | null;
  language: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdBookId: string | null;
  createdAt: string;
}

interface JobReviewDialogProps {
  job: IngestionJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => Promise<void> | void;
}

interface FormFields {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  deweyDecimal: string;
  coverImageUrl: string;
  publishYear: string;
  copies: number;
}

function confidenceBadgeClass(score: number | null): string {
  if (score === null) return "border-muted bg-muted/50 text-muted-foreground";
  if (score > 75) return "border-brand-sage/20 bg-brand-sage/10 text-brand-sage";
  if (score >= 50) return "border-brand-amber/20 bg-brand-amber/10 text-brand-amber";
  return "border-red-500/20 bg-red-500/10 text-red-600";
}

export default function JobReviewDialog({
  job,
  open,
  onOpenChange,
  onActionComplete,
}: JobReviewDialogProps) {
  const [form, setForm] = useState<FormFields>({
    title: "",
    author: "",
    isbn: "",
    genre: "",
    deweyDecimal: "",
    coverImageUrl: "",
    publishYear: "",
    copies: 1,
  });
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setForm({
        title: job.suggestedTitle ?? "",
        author: job.suggestedAuthor ?? "",
        isbn: job.detectedIsbn ?? "",
        genre: job.suggestedGenre ?? "",
        deweyDecimal: job.suggestedDewey ?? "",
        coverImageUrl: job.coverImageUrl ?? "",
        publishYear: job.suggestedPublishDate ?? "",
        copies: 1,
      });
      setOcrOpen(false);
      setActionError(null);
    }
  }, [job]);

  useEffect(() => {
    if (!open) {
      setActionError(null);
    }
  }, [open]);

  const updateField =
    (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const canAct = job?.status === "COMPLETED";
  const isSubmitting = isApproving || isRejecting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleApprove = async () => {
    if (!job || !canAct) return;

    if (!form.title || !form.author) {
      setActionError("Title and author are required to approve.");
      toast.error("Title and author are required to approve.");
      return;
    }

    setActionError(null);
    setIsApproving(true);
    try {
      await apiFetch(`/ingest/jobs/${job.id}/approve`, {
        method: "POST",
        body: {
          title: form.title,
          author: form.author,
          isbn: form.isbn || undefined,
          genre: form.genre || undefined,
          deweyDecimal: form.deweyDecimal || undefined,
          language: job.language || undefined,
          coverImageUrl: form.coverImageUrl || undefined,
          publishYear: form.publishYear || undefined,
          copies: form.copies,
        },
      });
      await onActionComplete();
      toast.success("Job approved and book added to catalog.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve job";
      setActionError(message);
      toast.error(message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!job || !canAct) return;

    setActionError(null);
    setIsRejecting(true);
    try {
      await apiFetch(`/ingest/jobs/${job.id}/reject`, {
        method: "POST",
      });
      await onActionComplete();
      toast.success("Job rejected.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject job";
      setActionError(message);
      toast.error(message);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Review Ingestion Job
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review the AI-extracted metadata and approve or reject this ingestion job.
          </DialogDescription>
        </DialogHeader>

        {job && (
          <div className="flex gap-6">
            {/* Left column - Image & OCR */}
            <div className="w-1/3 space-y-3">
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.imageUrl}
                  alt="Uploaded book image"
                  className="h-48 w-full bg-secondary/40 object-contain"
                />
              </div>

              {job.ocrText && (
                <Collapsible open={ocrOpen} onOpenChange={setOcrOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-[11px]"
                      size="sm"
                    >
                      OCR Text
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          ocrOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ScrollArea className="mt-2 h-40 rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {job.ocrText}
                      </p>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            {/* Right column - Editable form */}
            <div className="w-2/3 space-y-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Title</Label>
                <Input
                  value={form.title}
                  onChange={updateField("title")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Author</Label>
                <Input
                  value={form.author}
                  onChange={updateField("author")}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] text-muted-foreground">ISBN</Label>
                  {!form.isbn && (
                    <Badge
                      variant="outline"
                      className="border-brand-amber/20 bg-brand-amber/10 text-brand-amber text-[9px] px-1.5 py-0"
                    >
                      <AlertCircle className="mr-1 h-2.5 w-2.5" />
                      No ISBN detected
                    </Badge>
                  )}
                </div>
                <Input
                  value={form.isbn}
                  onChange={updateField("isbn")}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Genre</Label>
                  <Input
                    value={form.genre}
                    onChange={updateField("genre")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] text-muted-foreground">
                      Dewey Decimal
                    </Label>
                    {job.confidenceScore !== null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 cursor-help ${confidenceBadgeClass(job.confidenceScore)}`}
                          >
                            {job.confidenceScore}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            AI confidence: {job.confidenceScore}%
                          </p>
                          {job.deweyReasoning && (
                            <p className="mt-1 text-xs opacity-80">
                              {job.deweyReasoning}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Input
                    value={form.deweyDecimal}
                    onChange={updateField("deweyDecimal")}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    Cover Image URL
                  </Label>
                  <Input
                    value={form.coverImageUrl}
                    onChange={updateField("coverImageUrl")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    Publish Year
                  </Label>
                  <Input
                    value={form.publishYear}
                    onChange={updateField("publishYear")}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">
                  Number of Copies
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.copies}
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    setForm((prev) => ({
                      ...prev,
                      copies: Number.isFinite(next) ? Math.max(1, next) : 1,
                    }));
                  }}
                  className="mt-1"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  How many physical copies of this book are you adding?
                </p>
              </div>

              {/* Language badge */}
              {job.language && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px]">
                    {job.language}
                  </Badge>
                </div>
              )}

              {/* Dewey reasoning */}
              {job.deweyReasoning && (
                <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                  {job.deweyReasoning}
                </p>
              )}

              {!canAct && (
                <p className="text-[11px] text-muted-foreground">
                  This job has already been reviewed and can only be viewed.
                </p>
              )}
            </div>
          </div>
        )}

        {actionError && (
          <p className="text-[12px] text-destructive">{actionError}</p>
        )}

        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canAct || isSubmitting}
            onClick={handleReject}
            className="text-xs"
          >
            {isRejecting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-3.5 w-3.5" />
            )}
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            size="sm"
            disabled={!canAct || isSubmitting}
            onClick={handleApprove}
            className="bg-brand-navy text-xs text-white hover:bg-brand-navy/90"
          >
            {isApproving ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
            )}
            {isApproving ? "Approving..." : "Approve & Add to Catalog"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
