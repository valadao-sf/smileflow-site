import { type NextRequest, NextResponse } from "next/server";

function allowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") ?? "";
  if (/^https:\/\/([a-z0-9-]+\.)?smileflow\.com\.br$/i.test(origin)) return origin;
  return "https://smileflow.com.br";
}

function corsHeaders(request: NextRequest): Record<string, string> {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin(request),
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function nathJson(request: NextRequest, body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { headers: corsHeaders(request), status });
}

export function nathOptions(request: NextRequest): NextResponse {
  return new NextResponse(null, { headers: corsHeaders(request), status: 204 });
}
