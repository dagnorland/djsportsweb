/** Coloured dot + type name (+ optional description) — `_TypeBadge`. */
import { cn } from "@/lib/utils";
import { typeBg, typeLabel, typeText } from "@/lib/theme/playlistTypes";

export function TypeDot({ type, className }: { type: string; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", typeBg(type), className)} />;
}

export function TypeBadge({ type, description }: { type: string; description?: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <TypeDot type={type} className="mt-1.5" />
      <p className="text-stage-muted">
        <span className={cn("font-bold", typeText(type))}>{typeLabel(type)}</span>
        {description && <>  {description}</>}
      </p>
    </div>
  );
}
