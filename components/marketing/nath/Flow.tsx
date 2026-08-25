"use client";

/**
 * Adapted from valadao-sf/smileflow-mkt, original path src/components/funnel, commit 03b28b280fd398f75a9010c4378271db31471eac
 */

import { useEffect, useState } from "react";

import { persistAttribution } from "./attribution";
import type { RecordedAnswer, Step } from "./types";

import { Consent } from "./Consent";
import { Contact } from "./Contact";
import { Landing } from "./Landing";
import { Question } from "./Question";
import { Success } from "./Success";

export function Flow() {
  // Public alpha review-by: 2026-09-07. Remove this mark when Ship 1 persists submissions.
  const [step, setStep] = useState<Step>("landing");
  const [answers, setAnswers] = useState<Array<RecordedAnswer | null>>([null, null, null]);

  useEffect(() => {
    persistAttribution();
  }, []);

  function saveAnswer(index: number, answer: RecordedAnswer): void {
    setAnswers((current) => {
      const previous = current[index];
      if (previous && previous.url !== answer.url) URL.revokeObjectURL(previous.url);
      const next = [...current];
      next[index] = answer;
      return next;
    });
  }

  return (
    <main className="shell">
      <span className="alpha-mark">alpha</span>
      {step === "landing" ? <Landing onAsk={() => setStep("contact")} /> : null}
      {step === "contact" ? (
        <Contact
          onSubmit={(next) => {
            try {
              sessionStorage.setItem("nath-p0:contact", JSON.stringify(next));
            } catch {
              /* ignore quota / private mode */
            }
            setStep("q1");
          }}
        />
      ) : null}
      {step === "q1" ? (
        <Question
          index={0}
          answers={answers}
          onRecorded={saveAnswer}
          onContinue={() => setStep("q2")}
        />
      ) : null}
      {step === "q2" ? (
        <Question
          index={1}
          answers={answers}
          onRecorded={saveAnswer}
          onContinue={() => setStep("q3")}
        />
      ) : null}
      {step === "q3" ? (
        <Question
          index={2}
          answers={answers}
          onRecorded={saveAnswer}
          onContinue={() => setStep("consent")}
        />
      ) : null}
      {step === "consent" ? <Consent onConfirm={() => setStep("success")} /> : null}
      {step === "success" ? <Success /> : null}
    </main>
  );
}
