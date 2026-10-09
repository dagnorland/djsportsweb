"use client";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

/** Dark AlertDialog like Flutter's dialogs on the stage theme. */
export function ConfirmDialog({
  options, onResult,
}: { options: ConfirmOptions | null; onResult: (ok: boolean) => void }) {
  return (
    <AlertDialog open={!!options} onOpenChange={open => { if (!open) onResult(false); }}>
      <AlertDialogContent className="bg-stage-surface text-stage-text border-stage-divider">
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-stage-muted whitespace-pre-line">
            {options?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-transparent border-stage-divider text-stage-text hover:bg-stage-high hover:text-stage-text"
            onClick={() => onResult(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              options?.danger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-stage-text text-stage-bg hover:bg-stage-muted",
            )}
            onClick={() => onResult(true)}
          >
            {options?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
