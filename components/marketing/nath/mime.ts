const MIME_CANDIDATES: readonly string[] = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm",
];

export function pickRecorderMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (typeof MediaRecorder.isTypeSupported !== "function") return null;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}
