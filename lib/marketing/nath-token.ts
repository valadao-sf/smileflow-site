import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 2 * 60 * 60;

interface SubmissionTokenPayload {
  id: string;
  issuedAt: number;
  version: 1;
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function createSubmissionToken(
  id: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const payload = Buffer.from(
    JSON.stringify({ id, issuedAt: nowSeconds, version: 1 } satisfies SubmissionTokenPayload),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function readSubmissionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SubmissionTokenPayload | null {
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return null;

  const expected = signature(payload, secret);
  let provided: Buffer;
  try {
    provided = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SubmissionTokenPayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(parsed.id) ||
      typeof parsed.issuedAt !== "number" ||
      parsed.issuedAt > nowSeconds + 60 ||
      nowSeconds - parsed.issuedAt > TOKEN_TTL_SECONDS
    ) {
      return null;
    }
    return parsed as SubmissionTokenPayload;
  } catch {
    return null;
  }
}
