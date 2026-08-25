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

export function readAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const result: Record<string, string> = {};
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const storageKey = sessionStorage.key(index);
      if (!storageKey?.startsWith(STORAGE_PREFIX)) continue;
      const key = storageKey.slice(STORAGE_PREFIX.length);
      if (key === "source" || key.startsWith("utm_")) {
        const value = sessionStorage.getItem(storageKey);
        if (value) result[key] = value;
      }
    }
  } catch {
    /* Storage can be unavailable in private or embedded browsing contexts. */
  }
  return result;
}
