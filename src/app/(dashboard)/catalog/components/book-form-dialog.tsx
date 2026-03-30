"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createBook, updateBook } from "@/lib/books";
import { getDeweyCategory, LANGUAGES, STATUS_OPTIONS } from "../constants";
import type { Book, BookFormData } from "@/types/book";

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  onSuccess: (updatedBook?: Book) => void;
}

interface FormValues {
  title: string;
  author: string;
  isbn: string;
  dewey: string;
  category: string;
  publisher: string;
  publishYear: string;
  edition: string;
  language: string;
  pageCount: string;
  location: string;
  copies: string;
  status: string;
  description: string;
  subjects: string;
  coverImageUrl: string;
}

const defaultValues: FormValues = {
  title: "",
  author: "",
  isbn: "",
  dewey: "",
  category: "",
  publisher: "",
  publishYear: "",
  edition: "",
  language: "English",
  pageCount: "",
  location: "",
  copies: "1",
  status: "available",
  description: "",
  subjects: "",
  coverImageUrl: "",
};

export function BookFormDialog({
  open,
  onOpenChange,
  book,
  onSuccess,
}: BookFormDialogProps) {
  const isEdit = !!book;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  // Reset form when dialog opens/closes or book changes
  useEffect(() => {
    if (open) {
      if (book) {
        reset({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          dewey: book.dewey,
          category: book.category,
          publisher: book.publisher,
          publishYear: String(book.publishYear),
          edition: book.edition,
          language: book.language,
          pageCount: String(book.pageCount),
          location: book.location,
          copies: String(book.copies),
          status: book.status,
          description: book.description,
          subjects: book.subjects.join(", "),
          coverImageUrl: book.coverImageUrl,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, book, reset]);

  // Auto-fill category from Dewey
  const deweyValue = watch("dewey");
  useEffect(() => {
    if (deweyValue) {
      const category = getDeweyCategory(deweyValue);
      setValue("category", category);
    }
  }, [deweyValue, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const formData: BookFormData = {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        dewey: data.dewey,
        category: data.category,
        publisher: data.publisher,
        publishYear: parseInt(data.publishYear) || 0,
        edition: data.edition,
        language: data.language,
        pageCount: parseInt(data.pageCount) || 0,
        location: data.location,
        copies: parseInt(data.copies) || 1,
        status: data.status as BookFormData["status"],
        description: data.description,
        subjects: data.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        coverImageUrl: data.coverImageUrl,
      };

      if (isEdit && book) {
        const updated = await updateBook(book.id, formData);
        toast.success("Book updated successfully");
        onOpenChange(false);
        onSuccess(updated);
      } else {
        const created = await createBook(formData);
        toast.success("Book added to catalog");
        onOpenChange(false);
        onSuccess(created);
      }
    } catch {
      toast.error(isEdit ? "Failed to update book" : "Failed to add book");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit Book" : "Add New Book"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <form
            id="book-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 pb-6"
          >
            {/* Section 1: Core Information */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Core Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title" className="text-xs">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register("title", { required: "Title is required" })}
                    className="mt-1"
                    placeholder="Book title"
                  />
                  {errors.title && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="author" className="text-xs">
                    Author <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="author"
                    {...register("author", { required: "Author is required" })}
                    className="mt-1"
                    placeholder="Author name"
                  />
                  {errors.author && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.author.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="isbn" className="text-xs">
                    ISBN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="isbn"
                    {...register("isbn", {
                      required: "ISBN is required",
                      pattern: {
                        value: /^(\d{13}|\d{10}|978-\d{1,5}-\d{1,7}-\d{1,7}-\d)$/,
                        message: "Use 10 or 13 digits, or 978-X-XX-XXXXXX-X",
                      },
                    })}
                    className="mt-1 font-mono"
                    placeholder="978-0-00-000000-0"
                  />
                  {errors.isbn && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.isbn.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dewey" className="text-xs">
                    Dewey Decimal <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dewey"
                    {...register("dewey", {
                      required: "Dewey number is required",
                    })}
                    className="mt-1 font-mono"
                    placeholder="813.52"
                  />
                  {errors.dewey && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.dewey.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category" className="text-xs">
                    Category (auto-filled)
                  </Label>
                  <Input
                    id="category"
                    {...register("category")}
                    className="mt-1 bg-muted"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2: Publishing Details */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Publishing Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publisher" className="text-xs">
                    Publisher
                  </Label>
                  <Input
                    id="publisher"
                    {...register("publisher")}
                    className="mt-1"
                    placeholder="Publisher name"
                  />
                </div>
                <div>
                  <Label htmlFor="publishYear" className="text-xs">
                    Year
                  </Label>
                  <Input
                    id="publishYear"
                    type="number"
                    {...register("publishYear", {
                      validate: (v) => {
                        if (!v) return true;
                        const num = parseInt(v);
                        if (num > new Date().getFullYear()) return "Year cannot be in the future";
                        return true;
                      },
                    })}
                    className="mt-1"
                    placeholder="2024"
                  />
                  {errors.publishYear && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.publishYear.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edition" className="text-xs">
                    Edition
                  </Label>
                  <Input
                    id="edition"
                    {...register("edition")}
                    className="mt-1"
                    placeholder="1st"
                  />
                </div>
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select
                    value={watch("language")}
                    onValueChange={(v) => setValue("language", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pageCount" className="text-xs">
                    Page Count
                  </Label>
                  <Input
                    id="pageCount"
                    type="number"
                    {...register("pageCount", { min: 1 })}
                    className="mt-1"
                    placeholder="300"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3: Library Details */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Library Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-xs">
                    Location
                  </Label>
                  <Input
                    id="location"
                    {...register("location")}
                    className="mt-1"
                    placeholder="Section A-1, Shelf 1"
                  />
                </div>
                <div>
                  <Label htmlFor="copies" className="text-xs">
                    Copies
                  </Label>
                  <Input
                    id="copies"
                    type="number"
                    {...register("copies", { min: 1 })}
                    className="mt-1"
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(v) => setValue("status", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 4: Content */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Content
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className="mt-1"
                    rows={3}
                    placeholder="A brief description of the book..."
                  />
                </div>
                <div>
                  <Label htmlFor="subjects" className="text-xs">
                    Subjects (comma-separated)
                  </Label>
                  <Input
                    id="subjects"
                    {...register("subjects")}
                    className="mt-1"
                    placeholder="Fiction, Classic Literature, American"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="px-0 pt-2 pb-1 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="book-form"
                className="bg-brand-navy hover:bg-brand-navy/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Add Book"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
