import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { apiFetch } from "@/lib/api";
import * as xlsx from "xlsx";
import Papa from "papaparse";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CHUNK_SIZE = 1000;

/** Parsed spreadsheet row before / after column name normalization. */
type RawBookRow = Record<string, unknown>;

interface BulkBooksResponse {
  successful?: number;
  failed?: number;
}

function readString(row: RawBookRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return undefined;
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ successful: number; failed: number } | null>(null);

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
      const isCsv = file.name.toLowerCase().endsWith('.csv');

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
            const workbook = xlsx.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const rawItems = xlsx.utils.sheet_to_json<RawBookRow>(workbook.Sheets[sheetName]);
            resolve(rawItems.map(mapItem));
          } catch {
            reject(new Error('Failed to parse Excel file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      }
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
    setProgressMsg("Parsing file...");

    try {
      const items = await parseFileAndMap(file);
      
      if (items.length === 0) {
        throw new Error("The file is empty or could not be parsed.");
      }

      let totalSuccess = 0;
      let totalFailed = 0;
      const chunks = [];
      
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        chunks.push(items.slice(i, i + CHUNK_SIZE));
      }

      for (let i = 0; i < chunks.length; i++) {
        setProgressMsg(`Uploading batch ${i + 1} of ${chunks.length}...`);
        const chunk = chunks[i];
        
        try {
          const response = await apiFetch<BulkBooksResponse>("/books/bulk", {
            method: 'POST',
            body: chunk,
          });

          totalSuccess += response?.successful ?? 0;
          totalFailed += response?.failed ?? 0;
        } catch (err: unknown) {
          // If a chunk fails entirely (e.g. 500 error), tally the whole chunk as failed
          totalFailed += chunk.length;
          console.error(`Chunk ${i + 1} failed:`, err);
        }
      }

      setProgressMsg("");
      setResult({
        successful: totalSuccess,
        failed: totalFailed,
      });
      onSuccess();
    } catch (err: unknown) {
      setProgressMsg("");
      setError(err instanceof Error ? err.message : "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setFile(null);
        setResult(null);
        setError("");
        setProgressMsg("");
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Books</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel (.xlsx) or CSV file containing book data. The file must include columns like &quot;title&quot;, &quot;author&quot;, and &quot;isbn&quot;.
          </p>

          <div className="flex flex-col gap-2">
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
                {result.failed > 0 && ` Failed to import ${result.failed} books.`}
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
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
