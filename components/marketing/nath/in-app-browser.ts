export function isInstagramWebview(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Instagram/i.test(navigator.userAgent);
}
