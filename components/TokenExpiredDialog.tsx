"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { signIn } from "next-auth/react";

interface TokenExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenExpiredDialog({ open, onOpenChange }: TokenExpiredDialogProps) {
  const handleRenew = () => {
    signIn("spotify", { callbackUrl: window.location.pathname });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tilgangstokenet har utløpt</AlertDialogTitle>
          <AlertDialogDescription>
            Din Spotify-tilgang har utløpt. Vennligst logg inn på nytt for å fortsette.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleRenew}>
            Logg inn på nytt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
