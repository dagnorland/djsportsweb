/** Fired when local DJ data changes in bulk (restore, sync). */
export const DATA_CHANGED_EVENT = 'djsports:data-changed';

export function notifyDataChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}
