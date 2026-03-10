"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface IngestResult {
  isbn: string | null;
  title: string | null;
  author: string | null;
  publisher: string | null;
  publishDate: string | null;
  deweyClass: string | null;
  confidence: number;
  reasoning: string | null;
}

export default function BookIngestionPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<IngestResult | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Editable refs for reviewed metadata
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const isbnRef = useRef<HTMLInputElement>(null);
  const publisherRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const deweyRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setExtractedData(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE_URL}/ingest/analyze`, {
        method: "POST",
        credentials: "include",
        body: formData,
        // Do NOT set Content-Type — browser sets multipart boundary automatically
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Analysis failed");
      }

      const json = await res.json();
      const d = json.data;

      setExtractedData({
        isbn: d.isbn?.detected ?? null,
        title: d.isbn?.metadata?.title ?? null,
        author: d.isbn?.metadata?.author ?? null,
        publisher: d.isbn?.metadata?.publisher ?? null,
        publishDate: d.isbn?.metadata?.publishDate ?? null,
        deweyClass: d.classification?.dewey_class ?? null,
        confidence: d.classification?.confidence_score ?? 0,
        reasoning: d.classification?.reasoning ?? null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image analysis failed";
      const lower = message.toLowerCase();
      if (
        lower.includes("textract") || lower.includes("openai") ||
        lower.includes("credential") || lower.includes("aws") ||
        lower.includes("access denied") || lower.includes("api key") ||
        lower.includes("region") || lower.includes("socket") ||
        lower.includes("enotfound") || lower.includes("network")
      ) {
        toast.error("AI analysis requires AWS (Textract) and OpenAI credentials configured in the backend .env file.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await apiFetch("/books", {
        method: "POST",
        body: {
          title: titleRef.current?.value || extractedData?.title || "Untitled",
          author: authorRef.current?.value || extractedData?.author || "Unknown",
          isbn: isbnRef.current?.value || extractedData?.isbn || undefined,
          deweyDecimal: deweyRef.current?.value || extractedData?.deweyClass || undefined,
        },
      });
      toast.success("Book added to catalog successfully!");
      setUploadedImage(null);
      setSelectedFile(null);
      setExtractedData(null);
    } catch {
      toast.error("Failed to add book to catalog");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    setUploadedImage(null);
    setSelectedFile(null);
    setExtractedData(null);
  };

  const confidenceLabel = (score: number) => {
    if (score >= 80) return { text: "High", color: "bg-brand-sage/12 text-brand-sage" };
    if (score >= 50) return { text: "Medium", color: "bg-brand-amber/12 text-brand-amber" };
    return { text: "Low", color: "bg-brand-brick/12 text-brand-brick" };
  };

  return (
    <div className="p-8 ">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">
          AI-Assisted Book Ingestion
        </h1>
        <p className="text-sm text-muted-foreground">Upload book cover or spine images for automatic cataloging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Upload Book Image</CardTitle>
            <CardDescription className="text-xs">
              Take a clear photo of the book cover or spine showing the ISBN if visible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!uploadedImage ? (
                <label className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-brand-copper/50 hover:bg-brand-copper/3 transition-all duration-200 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-brand-copper/10 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-brand-copper transition-colors" />
                  </div>
                  <p className="text-[13px] font-medium mb-1">Click to upload book image</p>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, TIFF up to 10MB</p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="Uploaded book" className="w-full h-64 object-contain bg-secondary/40" />
                  </div>
                  {isProcessing && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-copper" />
                        <span className="text-[13px] text-muted-foreground">AI processing image...</span>
                      </div>
                      <Progress value={65} className="h-1.5" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadedImage(null);
                      setSelectedFile(null);
                      setExtractedData(null);
                    }}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-2" />
                    Upload Different Image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Extracted Data Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Sparkles className="w-4 h-4 text-brand-copper" />
              Extracted Metadata
            </CardTitle>
            <CardDescription className="text-xs">
              AI-generated data ready for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!extractedData && !isProcessing && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-[13px] text-muted-foreground">Upload an image to see extracted data</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-brand-copper mb-4" />
                <p className="text-[13px] text-muted-foreground">Analyzing image with AI...</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                {extractedData.isbn ? (
                  <div className="flex items-center gap-2 p-3 bg-brand-sage/8 rounded-xl border border-brand-sage/15">
                    <CheckCircle2 className="w-4 h-4 text-brand-sage" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-brand-sage">ISBN Detected</p>
                      <p className="text-[11px] text-brand-sage/70">
                        Confidence: {Math.round(extractedData.confidence * 100)}%
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${confidenceLabel(extractedData.confidence * 100).color}`}>
                      {confidenceLabel(extractedData.confidence * 100).text}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-brand-amber/8 rounded-xl border border-brand-amber/15">
                    <AlertCircle className="w-4 h-4 text-brand-amber" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-brand-amber">No ISBN Detected</p>
                      <p className="text-[11px] text-brand-amber/70">You can enter metadata manually below</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">ISBN</Label>
                    <Input ref={isbnRef} defaultValue={extractedData.isbn ?? ""} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Title</Label>
                    <Input ref={titleRef} defaultValue={extractedData.title ?? ""} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Author</Label>
                    <Input ref={authorRef} defaultValue={extractedData.author ?? ""} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Publisher</Label>
                      <Input ref={publisherRef} defaultValue={extractedData.publisher ?? ""} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Year</Label>
                      <Input ref={yearRef} defaultValue={extractedData.publishDate ?? ""} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                    <Input ref={deweyRef} defaultValue={extractedData.deweyClass ?? ""} className="mt-1" />
                  </div>
                  {extractedData.reasoning && (
                    <div>
                      <Label className="text-[11px] text-muted-foreground">AI Reasoning</Label>
                      <p className="mt-1 text-[12px] text-muted-foreground bg-secondary/50 rounded-lg p-3">{extractedData.reasoning}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
                  >
                    {isAccepting ? (
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                    )}
                    Accept & Add to Catalog
                  </Button>
                  <Button variant="outline" onClick={handleReject} className="text-xs">
                    <AlertCircle className="w-3.5 h-3.5 mr-2" />
                    Reject
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
