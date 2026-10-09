const two = (n: number) => String(n).padStart(2, "0");

/** mm:ss (hh:mm:ss over an hour) — Flutter `printDuration`. */
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

/** mm:ss.mmm — StartTimeSlider.formatMs. */
export function formatMs(ms: number): string {
  const v = Math.max(0, Math.round(ms));
  return `${two(Math.floor(v / 60000))}:${two(Math.floor((v % 60000) / 1000))}.${String(v % 1000).padStart(3, "0")}`;
}
