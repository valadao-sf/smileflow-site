"use client";

import { useState } from "react";

import { QUESTIONS } from "./copy";
import type { RecordedAnswer } from "./types";

import { VoiceRecorder } from "./VoiceRecorder";

interface QuestionProps {
  index: number;
  answers: Array<RecordedAnswer | null>;
  onRecorded: (index: number, answer: RecordedAnswer) => void;
  onBack: () => void;
  onContinue: () => void | Promise<void>;
  continueLabel?: string;
  submitting?: boolean;
  submitError?: string | null;
}

export function Question({
  index,
  answers,
  onRecorded,
  onBack,
  onContinue,
  continueLabel = "Continuar",
  submitting = false,
  submitError = null,
}: QuestionProps) {
  const question = QUESTIONS[index];
  const answer = answers[index];
  const [mode, setMode] = useState<"record" | "playback">(answer ? "playback" : "record");

  return (
    <section className="nath-question">
      <header className="nath-question__header">
        <button type="button" className="sf-btn sf-btn--ghost" onClick={onBack}>
          Voltar
        </button>
        <p className="sf-meta">Pergunta {index + 1} de 3</p>
      </header>
      <div className="nath-question__body">
        <div className="nath-question__content">
          <div className="nath-question__copy">
            <h1 className="sf-page-title">{question.title}</h1>
            <p className="nath-help">{question.help}</p>
          </div>
          <div className="nath-question__dock">
            {mode === "record" ? (
              <VoiceRecorder
                onRecorded={(next) => {
                  onRecorded(index, next);
                  setMode("playback");
                }}
              />
            ) : (
              <>
                {answer ? (
                  <audio
                    key={answer.url}
                    className="nath-audio"
                    controls
                    preload="metadata"
                    src={answer.url}
                  />
                ) : null}
                <button
                  type="button"
                  className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block"
                  onClick={() => void onContinue()}
                  disabled={!answer || submitting}
                >
                  <span className="sf-btn__label">
                    {submitting ? "Enviando…" : continueLabel}
                  </span>
                </button>
                <button
                  type="button"
                  className="sf-btn sf-btn--text"
                  onClick={() => setMode("record")}
                  disabled={submitting}
                >
                  Gravar de novo
                </button>
                {submitError ? (
                  <div className="sf-notice sf-notice--danger" role="alert">
                    <div className="sf-notice__body">{submitError}</div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
