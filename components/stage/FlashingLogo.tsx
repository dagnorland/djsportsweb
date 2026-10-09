"use client";

/**
 * The djSports logo with a stage-light flash on click: two quick blinks, a
 * small pulse and — when `version` is given — the version glows amber.
 * `onClick` runs after `delayMs` so the flash is seen first.
 * Port of djsports/lib/core/widgets/flashing_logo.dart.
 */
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FlashingLogo({
  size = 70, version, onClick, delayMs = 300, title, className, versionClassName,
}: {
  size?: number;
  version?: string;
  onClick?: () => void;
  delayMs?: number;
  title?: string;
  className?: string;
  versionClassName?: string;
}) {
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handle = () => {
    setRun(r => r + 1);
    if (onClick) {
      clearTimeout(timer.current);
      timer.current = setTimeout(onClick, delayMs);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={title}
      aria-label={title ?? "djSports"}
      className={cn("inline-flex flex-col items-center select-none", className)}
    >
      <span
        key={`l${run}`}
        className={cn("relative block", run > 0 && "animate-logo-pulse")}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-512x512.png" alt="" width={size} height={size} className="rounded-full" />
        <span
          key={`f${run}`}
          className={cn("pointer-events-none absolute inset-0 rounded-full opacity-0", run > 0 && "animate-logo-flash")}
          style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)" }}
        />
      </span>
      {version && (
        <span
          key={`v${run}`}
          className={cn("text-xs text-stage-text/70", run > 0 && "animate-version-glow", versionClassName)}
        >
          {version}
        </span>
      )}
    </button>
  );
}
