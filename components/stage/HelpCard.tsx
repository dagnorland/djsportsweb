/** Card + chip used by the help pages (playlist_help_screen.dart / letsplay_help_screen.dart). */
import type { LucideIcon } from "lucide-react";

export function HelpCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-stage-surface p-[18px]">
      <h2 className="mb-2 flex items-center gap-2 text-base font-bold"><Icon className="h-5 w-5" /> {title}</h2>
      <div className="space-y-2 text-sm text-stage-muted">{children}</div>
    </section>
  );
}

export function HelpChip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-stage-high px-3 py-1 text-xs font-semibold text-stage-text">{children}</span>;
}
