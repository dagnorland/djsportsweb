/**
 * Round button in the playlist type colour with an elevated look — the
 * edit button on playlist cards and the play button in Let's Play.
 */
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeBg, typeOn } from "@/lib/theme/playlistTypes";

export function RoundTypeButton({
  type, icon: Icon, size = 44, onClick, label, className,
}: {
  type: string;
  icon: LucideIcon;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full shadow-lg shadow-black/40",
        "transition-transform hover:scale-105 active:scale-95",
        typeBg(type), typeOn(type), className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon style={{ width: size * 0.55, height: size * 0.55 }} fill="currentColor" strokeWidth={1.5} />
    </button>
  );
}
