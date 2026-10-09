/**
 * The one way live screens show a toast (Flutter `showAppToast`): info
 * toasts are hidden unless "Show info messages" is on; warnings and errors
 * always show.
 */
import { toast } from "sonner";
import { SettingKeys, getSetting } from "@/lib/db/settings-repo";

export type ToastLevel = "info" | "warning" | "error";

let showInfo = false; // Flutter default: info toasts off
if (typeof window !== "undefined") {
  getSetting<boolean>(SettingKeys.showInfoToasts, false).then(v => { showInfo = v; }).catch(() => {});
}

/** Call after changing the setting. */
export function setShowInfoToasts(v: boolean): void {
  showInfo = v;
}

export function showAppToast(title: string, opts: { description?: string; level?: ToastLevel; durationMs?: number } = {}): void {
  const level = opts.level ?? "info";
  if (level === "info" && !showInfo) return;
  const duration = opts.durationMs ?? (level === "info" ? 3000 : 5000);
  const fn = level === "error" ? toast.error : level === "warning" ? toast.warning : toast.info;
  fn(title, { description: opts.description, duration });
}
