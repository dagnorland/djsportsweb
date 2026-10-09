/** Leaves Let's Play: ✕ in a ring with "EXIT" below (`_ExitButton`). */
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExitButton({ onClick, compact }: { onClick?: () => void; compact?: boolean }) {
  const ring = compact ? 24 : 32;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Exit Let's Play"
      aria-label="Exit Let's Play"
      className="inline-flex flex-col items-center rounded-full px-2 py-1 text-stage-text hover:bg-stage-high"
    >
      <span
        className="flex items-center justify-center rounded-full border-2 border-current"
        style={{ width: ring, height: ring }}
      >
        <X style={{ width: ring * 0.65, height: ring * 0.65 }} strokeWidth={2.5} />
      </span>
      <span className={cn("mt-0.5 font-extrabold tracking-wider", compact ? "text-[9px]" : "text-[10px]")}>EXIT</span>
    </button>
  );
}
