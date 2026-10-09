"use client"

import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/lib/theme/theme"

type ToasterProps = React.ComponentProps<typeof Sonner>

/** Toasts at the top centre like the Flutter app (toastification). */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-center"
      richColors
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-stage-surface group-[.toaster]:text-stage-text group-[.toaster]:border-stage-divider group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-stage-muted",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
