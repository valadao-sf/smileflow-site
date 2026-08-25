import { NextRequest, NextResponse } from "next/server";

import { contactFields, questions, TALLY_FORM_ID } from "@/lib/marketing/diagnostico-fechamento";

const allowedAnswers = new Map(
  questions.map((question) => [question.fieldId, new Set(question.options.map((option) => option.id))]),
);

export async function POST(request: NextRequest) {
  try {
    const { responses } = await request.json() as { responses?: Record<string, string> };
    if (!responses || typeof responses !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const hasAllAnswers = questions.every((question) => allowedAnswers.get(question.fieldId)?.has(responses[question.fieldId]));
    const name = responses[contactFields.name]?.trim();
    const phone = responses[contactFields.phone]?.replace(/\D/g, "");
    if (!hasAllAnswers || !name || name.length > 120 || !phone || phone.length < 12 || phone.length > 13) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (["localhost", "127.0.0.1"].some((host) => request.nextUrl.hostname.includes(host))) {
      return NextResponse.json({ ok: true, simulated: true });
    }

    const tallyResponses = Object.fromEntries(
      Object.entries(responses).map(([fieldId, value]) => [
        fieldId,
        allowedAnswers.has(fieldId) ? [value] : value,
      ]),
    );
    const tallyResponse = await fetch(`https://api.tally.so/forms/${TALLY_FORM_ID}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "tally-version": "2025-01-15" },
      body: JSON.stringify({
        sessionUuid: crypto.randomUUID(),
        respondentUuid: crypto.randomUUID(),
        responses: tallyResponses,
        captchas: {},
        isCompleted: true,
        password: null,
      }),
    });
    if (!tallyResponse.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
