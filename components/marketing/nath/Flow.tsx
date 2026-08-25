"use client";

/**
 * Adapted from valadao-sf/smileflow-mkt, original path src/components/funnel, commit 03b28b280fd398f75a9010c4378271db31471eac
 */

import { useEffect, useState } from "react";

import { persistAttribution } from "./attribution";
import type { ContactInfo, RecordedAnswer, Step } from "./types";

import { Contact } from "./Contact";
import { Landing } from "./Landing";
import { Question } from "./Question";
import { Success } from "./Success";
import { submitNathQuestion } from "./submit";

const EMPTY_CONTACT: ContactInfo = {
  name: "",
  instagram: "",
};

export function Flow() {
  // Public alpha review-by: 2026-09-07. Remove this mark when Ship 1 persists submissions.
  const [step, setStep] = useState<Step>("landing");
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<Array<RecordedAnswer | null>>([null, null, null]);
  const [consentGranted, setConsentGranted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    persistAttribution();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  function saveAnswer(index: number, answer: RecordedAnswer): void {
    setSubmitError(null);
    setAnswers((current) => {
      const previous = current[index];
      if (previous && previous.url !== answer.url) URL.revokeObjectURL(previous.url);
      const next = [...current];
      next[index] = answer;
      return next;
    });
  }

  async function submitAnswers(): Promise<void> {
    const completed = answers.filter((answer): answer is RecordedAnswer => answer !== null);
    if (completed.length !== 3 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitNathQuestion(contact, completed, consentGranted);
      setStep("success");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const questionStep = step === "q1" || step === "q2" || step === "q3";
  const centeredStep = step === "landing" || step === "success";
  const shellClassName = questionStep
    ? "nath-shell nath-shell--question"
    : step === "contact"
      ? "nath-shell nath-shell--contact"
      : centeredStep
        ? "nath-shell nath-shell--centered"
        : "nath-shell";

  return (
    <main className={shellClassName}>
      {step === "landing" ? <Landing onAsk={() => setStep("contact")} /> : null}
      {step === "contact" ? (
        <Contact
          contact={contact}
          consentGranted={consentGranted}
          onChange={setContact}
          onConsentChange={(next) => {
            setConsentGranted(next);
            try {
              sessionStorage.setItem("nath-p0:consent", String(next));
            } catch {
              /* ignore quota / private mode */
            }
          }}
          onBack={() => setStep("landing")}
          onSubmit={(next) => {
            setContact(next);
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
          onBack={() => setStep("contact")}
          onContinue={() => setStep("q2")}
        />
      ) : null}
      {step === "q2" ? (
        <Question
          index={1}
          answers={answers}
          onRecorded={saveAnswer}
          onBack={() => setStep("q1")}
          onContinue={() => setStep("q3")}
        />
      ) : null}
      {step === "q3" ? (
        <Question
          index={2}
          answers={answers}
          onRecorded={saveAnswer}
          onBack={() => setStep("q2")}
          onContinue={submitAnswers}
          continueLabel="Enviar"
          submitting={submitting}
          submitError={submitError}
        />
      ) : null}
      {step === "success" ? <Success /> : null}
    </main>
  );
}
