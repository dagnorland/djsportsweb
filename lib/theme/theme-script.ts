// Server-safe (no "use client"): used in app/layout.tsx <head>.

/** Inline script: apply the saved theme (localStorage "theme") before first paint. */
export const themeInitScript =
  "(function(){try{var t=localStorage.getItem('theme')==='light'?'light':'dark';" +
  "document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();";
