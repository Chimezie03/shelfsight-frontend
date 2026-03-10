"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteBook, deleteBooks } from "@/lib/books";
import type { Book } from "@/types/book";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookToDelete?: Book | null;
  bulkDeleteIds?: string[];
  onSuccess: () => void;
  onClearSelection?: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  bookToDelete,
  bulkDeleteIds,
  onSuccess,
  onClearSelection,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isBulk = bulkDeleteIds && bulkDeleteIds.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isBulk) {
        await deleteBooks(bulkDeleteIds);
        toast.success(`${bulkDeleteIds.length} books deleted`);
        onClearSelection?.();
      } else if (bookToDelete) {
        await deleteBook(bookToDelete.id);
        toast.success(`"${bookToDelete.title}" deleted`);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            {isBulk
              ? `Delete ${bulkDeleteIds.length} books?`
              : `Delete "${bookToDelete?.title}"?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `This will permanently remove ${bulkDeleteIds.length} books from the catalog. This action cannot be undone.`
              : "This will permanently remove this book from the catalog. This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
