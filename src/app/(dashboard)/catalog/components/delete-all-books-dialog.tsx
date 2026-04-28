"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteAllBooks } from "@/lib/books";

const CONFIRM_PHRASE = "DELETE ALL BOOKS";

interface DeleteAllBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalBooks: number;
  totalCopies: number;
  onSuccess: () => void;
}

export function DeleteAllBooksDialog({
  open,
  onOpenChange,
  totalBooks,
  totalCopies,
  onSuccess,
}: DeleteAllBooksDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  const canConfirm = confirmText.trim() === CONFIRM_PHRASE && totalBooks > 0;

  const handleDelete = async () => {
    if (!canConfirm) return;
    setIsDeleting(true);
    try {
      const result = await deleteAllBooks();
      toast.success(
        `Deleted ${result.booksDeleted} books and ${result.copiesDeleted} copies`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete catalog");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-destructive">
            Delete entire catalog?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <strong>{totalBooks}</strong> books and{" "}
            <strong>{totalCopies}</strong> copies from your organization, along
            with their loan history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-text" className="text-xs">
            Type{" "}
            <span className="font-mono font-semibold text-destructive">
              {CONFIRM_PHRASE}
            </span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            disabled={isDeleting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!canConfirm || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
