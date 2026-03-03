"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BookIngestionPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, string | number> | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        processImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedData({
        isbn: "978-0-7432-7356-5",
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        year: "2004",
        deweyClass: "813.52",
        deweyCategory: "American fiction",
        confidence: 94,
        suggestedLocation: "Section B, Shelf 3",
      });
      setIsProcessing(false);
    }, 2500);
  };

  const handleAccept = () => {
    alert("Book added to catalog successfully!");
    setUploadedImage(null);
    setExtractedData(null);
  };

  const handleReject = () => {
    setUploadedImage(null);
    setExtractedData(null);
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
                  <p className="text-[11px] text-muted-foreground">PNG, JPG up to 10MB</p>
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
                <div className="flex items-center gap-2 p-3 bg-brand-sage/8 rounded-xl border border-brand-sage/15">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-brand-sage">ISBN Detected</p>
                    <p className="text-[11px] text-brand-sage/70">Confidence: {extractedData.confidence}%</p>
                  </div>
                  <Badge variant="outline" className="bg-white text-[10px]">
                    High
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">ISBN</Label>
                    <Input value={extractedData.isbn as string} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Title</Label>
                    <Input value={extractedData.title as string} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Author</Label>
                    <Input value={extractedData.author as string} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Publisher</Label>
                      <Input value={extractedData.publisher as string} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Year</Label>
                      <Input value={extractedData.year as string} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Dewey Decimal</Label>
                      <Input value={extractedData.deweyClass as string} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Category</Label>
                      <Input value={extractedData.deweyCategory as string} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Suggested Location</Label>
                    <Input value={extractedData.suggestedLocation as string} readOnly className="mt-1 bg-brand-copper/5 border-brand-copper/20" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAccept} className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
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

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Books ingested today</p>
                <p className="text-2xl font-display font-semibold tracking-tight">24</p>
              </div>
              <span className="text-xs font-medium text-brand-sage">+12%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Average confidence</p>
                <p className="text-2xl font-display font-semibold tracking-tight">92%</p>
              </div>
              <Badge variant="outline" className="text-[10px]">High</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Time saved</p>
                <p className="text-2xl font-display font-semibold tracking-tight">3.2hrs</p>
              </div>
              <span className="text-xs font-medium text-brand-copper">vs manual</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
