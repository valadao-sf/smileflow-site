import { createClient } from "@supabase/supabase-js";

/**
 * Adapted from:
 * valadao-sf/smileflow src/app/api/kiosk/upload-ticket/route.ts
 * commit: 8c8a9751f7b3bfc95e4edc0d30ed9595b7aa9df5
 */

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
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
