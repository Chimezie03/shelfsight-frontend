import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { apiFetch } from "@/lib/api";
import * as xlsx from "xlsx";
import Papa from "papaparse";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Default the ISBN-only toggle on when the dialog opens (e.g. linked from /ingest). */
  initialIsbnMode?: boolean;
}

const FULL_CHUNK_SIZE = 1000;
// 25 ISBNs at server concurrency 8 ≈ 3–5s — well under the Vercel /api proxy
// timeout. Larger chunks risk a 504 even though the server still creates books.
const ISBN_CHUNK_SIZE = 25;

/** Parsed spreadsheet row before / after column name normalization. */
type RawBookRow = Record<string, unknown>;

interface BulkBooksResponse {
  successful?: number;
  failed?: number;
}

interface BulkIsbnResponse {
  total: number;
  resolved: number;
  unresolved: Array<{ isbn: string; reason: string }>;
  created: number;
  failed: number;
  errors: Array<{ index: number; isbn: string; reason: string }>;
}

function readString(row: RawBookRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return undefined;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  initialIsbnMode = false,
}: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isbnOnlyMode, setIsbnOnlyMode] = useState(initialIsbnMode);

  // Sync the toggle when the dialog re-opens with a different default.
  useEffect(() => {
    if (open) setIsbnOnlyMode(initialIsbnMode);
  }, [open, initialIsbnMode]);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    successful: number;
    failed: number;
    unresolved?: Array<{ isbn: string; reason: string }>;
    /** Number of ISBNs whose batch timed out / errored — books may still have been created on the server. */
    uncertain?: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
      setResult(null);
      setProgressMsg("");
    }
  };

  const parseFileAndMap = async (file: File): Promise<RawBookRow[]> => {
    return new Promise((resolve, reject) => {
      const isCsv = file.name.toLowerCase().endsWith(".csv");

      const mapItem = (row: RawBookRow): RawBookRow => ({
        ...row,
        title: readString(row, "title", "Title") ?? row.title,
        author: readString(row, "author", "Author") ?? row.author,
        isbn: readString(row, "isbn", "ISBN", "ISBN-13") ?? row.isbn,
        genre: readString(row, "genre", "Genre", "Category", "category") ?? row.genre,
        deweyDecimal: readString(row, "deweyDecimal", "DeweyDecimal", "Dewey Decimal") ?? row.deweyDecimal,
        language: readString(row, "language", "Language") ?? row.language,
        publishYear:
          readString(
            row,
            "publishYear",
            "PublishYear",
            "PublicationYear",
            "Publication Year",
            "publishDate",
            "PublishDate",
            "Publication Date",
          ) ?? row.publishYear,
        pageCount: readString(row, "pageCount", "PageCount", "Page Count") ?? row.pageCount,
        copies: readString(row, "copies", "Copies", "Total Copies", "Available Copies") ?? row.copies ?? 1,
        status: readString(row, "status", "Status") ?? row.status,
      });

      if (isCsv) {
        Papa.parse<RawBookRow>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = Array.isArray(results.data) ? results.data : [];
            resolve(rows.map((row) => mapItem(row as RawBookRow)));
          },
          error: (err: Error) => reject(new Error(err.message)),
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = xlsx.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const rawItems = xlsx.utils.sheet_to_json<RawBookRow>(workbook.Sheets[sheetName]);
            resolve(rawItems.map(mapItem));
          } catch {
            reject(new Error("Failed to parse Excel file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      }
    });
  };

  /**
   * Parse a file as a list of ISBNs. Accepts:
   *   - .txt: one ISBN per line
   *   - .csv: any column named ISBN/isbn/ISBN-13, OR single-column with no header
   *   - .xlsx: column named ISBN/isbn/ISBN-13, OR first column
   */
  const parseFileAsIsbnList = async (file: File): Promise<string[]> => {
    const ext = file.name.toLowerCase().split(".").pop() ?? "";

    if (ext === "txt") {
      const text = await file.text();
      return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    const collectFromRows = (rows: RawBookRow[]): string[] => {
      if (rows.length === 0) return [];
      const isbnKey = Object.keys(rows[0]).find((k) =>
        /^isbn(-?13)?$/i.test(k.trim()),
      );
      if (isbnKey) {
        return rows
          .map((r) => String(r[isbnKey] ?? "").trim())
          .filter(Boolean);
      }
      // No ISBN header — treat first column as ISBNs.
      const firstKey = Object.keys(rows[0])[0];
      return rows.map((r) => String(r[firstKey] ?? "").trim()).filter(Boolean);
    };

    if (ext === "csv") {
      return new Promise<string[]>((resolve, reject) => {
        Papa.parse<RawBookRow>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = Array.isArray(results.data) ? (results.data as RawBookRow[]) : [];
            resolve(collectFromRows(rows));
          },
          error: (err: Error) => reject(new Error(err.message)),
        });
      });
    }

    return new Promise<string[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = xlsx.utils.sheet_to_json<RawBookRow>(sheet);
          resolve(collectFromRows(rows));
        } catch {
          reject(new Error("Failed to parse Excel file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (isbnOnlyMode) {
        setProgressMsg("Parsing ISBN list...");
        const isbns = await parseFileAsIsbnList(file);
        if (isbns.length === 0) {
          throw new Error("No ISBNs found in the file.");
        }

        const chunks: string[][] = [];
        for (let i = 0; i < isbns.length; i += ISBN_CHUNK_SIZE) {
          chunks.push(isbns.slice(i, i + ISBN_CHUNK_SIZE));
        }

        let totalCreated = 0;
        let totalFailed = 0;
        let totalUncertain = 0;
        const allUnresolved: Array<{ isbn: string; reason: string }> = [];

        for (let i = 0; i < chunks.length; i++) {
          setProgressMsg(
            `Looking up batch ${i + 1} of ${chunks.length} (${chunks[i].length} ISBNs)...`,
          );
          try {
            const response = await apiFetch<BulkIsbnResponse>("/books/bulk-isbn", {
              method: "POST",
              body: { isbns: chunks[i] },
            });
            totalCreated += response.created ?? 0;
            totalFailed += response.failed ?? 0;
            if (Array.isArray(response.unresolved)) {
              allUnresolved.push(...response.unresolved);
            }
          } catch (err: unknown) {
            // Likely a proxy timeout (Vercel /api rewrite). The server may have
            // created books anyway — report as "uncertain" rather than "failed".
            console.error(`ISBN batch ${i + 1} did not return cleanly:`, err);
            totalUncertain += chunks[i].length;
          }
        }

        setProgressMsg("");
        setResult({
          successful: totalCreated,
          failed: totalFailed,
          unresolved: allUnresolved,
          uncertain: totalUncertain,
        });
        onSuccess();
        return;
      }

      // Standard spreadsheet path
      setProgressMsg("Parsing file...");
      const items = await parseFileAndMap(file);

      if (items.length === 0) {
        throw new Error("The file is empty or could not be parsed.");
      }

      let totalSuccess = 0;
      let totalFailed = 0;
      const chunks: RawBookRow[][] = [];
      for (let i = 0; i < items.length; i += FULL_CHUNK_SIZE) {
        chunks.push(items.slice(i, i + FULL_CHUNK_SIZE));
      }

      for (let i = 0; i < chunks.length; i++) {
        setProgressMsg(`Uploading batch ${i + 1} of ${chunks.length}...`);
        const chunk = chunks[i];

        try {
          const response = await apiFetch<BulkBooksResponse>("/books/bulk", {
            method: "POST",
            body: chunk,
          });

          totalSuccess += response?.successful ?? 0;
          totalFailed += response?.failed ?? 0;
        } catch (err: unknown) {
          totalFailed += chunk.length;
          console.error(`Chunk ${i + 1} failed:`, err);
        }
      }

      setProgressMsg("");
      setResult({ successful: totalSuccess, failed: totalFailed });
      onSuccess();
    } catch (err: unknown) {
      setProgressMsg("");
      setError(err instanceof Error ? err.message : "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          setFile(null);
          setResult(null);
          setError("");
          setProgressMsg("");
          setIsbnOnlyMode(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Books</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="space-y-1">
              <Label htmlFor="isbn-only-mode" className="text-sm font-medium cursor-pointer">
                ISBN-only mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Upload just ISBNs and auto-fill title, author, cover, and publisher from Open Library.
              </p>
            </div>
            <Switch
              id="isbn-only-mode"
              checked={isbnOnlyMode}
              onCheckedChange={setIsbnOnlyMode}
              disabled={loading}
            />
          </div>

          {isbnOnlyMode ? (
            <>
              <p className="text-sm text-muted-foreground">
                Upload a <span className="font-mono">.txt</span> file with one ISBN per line, or a CSV/XLSX with an{" "}
                <span className="font-mono">ISBN</span> column.
              </p>
              <Alert className="border-brand-amber/30 bg-brand-amber/5">
                <Info className="h-4 w-4 text-brand-amber" />
                <AlertTitle className="text-sm">Before you upload a large list</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                  Each ISBN triggers a free Open Library + Google Books lookup. As a rule of thumb:
                  <br />• <span className="font-medium text-foreground">100 ISBNs</span> ≈ 1–2 min
                  <br />• <span className="font-medium text-foreground">1,000 ISBNs</span> ≈ 10–15 min
                  <br />• <span className="font-medium text-foreground">10,000 ISBNs</span> ≈ 2–3 hours and may exceed Open Library&apos;s courtesy rate limits.
                  <br />
                  Recommended: stay under <span className="font-medium text-foreground">500 per upload</span> for predictable results. The lookup APIs are free, but rare or out-of-print ISBNs will be skipped and reported back.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload an Excel (.xlsx) or CSV file containing book data. The file must include columns like &quot;title&quot;,
              &quot;author&quot;, and &quot;isbn&quot;.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept={
                isbnOnlyMode
                  ? ".csv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  : ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              }
              onChange={handleFileChange}
              className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20 cursor-pointer"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {progressMsg && (
            <Alert className="bg-blue-50 text-blue-900 border-blue-200">
              <AlertTitle className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Working...
              </AlertTitle>
              <AlertDescription>{progressMsg}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertTitle>Upload Complete</AlertTitle>
              <AlertDescription>
                Successfully imported {result.successful} books.
                {result.failed > 0 && ` Failed: ${result.failed}.`}
                {result.unresolved && result.unresolved.length > 0 && (
                  <>
                    {" "}
                    {result.unresolved.length} ISBN{result.unresolved.length === 1 ? "" : "s"} could not be resolved
                    (no metadata in Open Library or Google Books).
                  </>
                )}
                {result.uncertain && result.uncertain > 0 ? (
                  <>
                    {" "}
                    <strong>{result.uncertain}</strong> ISBN{result.uncertain === 1 ? "" : "s"} timed out at the proxy —
                    the server likely still created the books. Refresh the catalog to confirm.
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            disabled={!file || loading}
            onClick={handleUpload}
            className="bg-brand-navy hover:bg-brand-navy/90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isbnOnlyMode ? "Looking up..." : "Uploading..."}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {isbnOnlyMode ? "Look Up & Import" : "Upload Data"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
