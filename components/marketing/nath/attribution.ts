const STORAGE_PREFIX = "nath-p0:";

export function persistAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  try {
    for (const [key, value] of params.entries()) {
      if ((key === "source" || key.startsWith("utm_")) && value) {
        sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
      }
    }
  } catch {
    /* Storage can be unavailable in private or embedded browsing contexts. */
  }
}
