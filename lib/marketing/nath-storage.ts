import { createClient } from "@supabase/supabase-js";

import { readSubmissionToken } from "./nath-token";

/**
 * Adapted from:
 * valadao-sf/smileflow src/app/api/kiosk/upload-ticket/route.ts
 * commit: 8c8a9751f7b3bfc95e4edc0d30ed9595b7aa9df5
 */

export const NATH_AUDIO_BUCKET = process.env.NATH_AUDIO_BUCKET ?? "kiosk-audio";

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "NATH_UPLOAD_SECRET"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function createNathStorageAdmin() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export function requireSubmission(token: unknown): { id: string } | null {
  if (typeof token !== "string") return null;
  return readSubmissionToken(token, requiredEnv("NATH_UPLOAD_SECRET"));
}

export function nathUploadSecret(): string {
  return requiredEnv("NATH_UPLOAD_SECRET");
}
