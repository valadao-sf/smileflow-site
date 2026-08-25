"use client";

import { useState } from "react";

import { QUESTIONS } from "./copy";
import type { RecordedAnswer } from "./types";

import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceThread } from "./VoiceThread";

interface QuestionProps {
  index: number;
  answers: Array<RecordedAnswer | null>;
  onRecorded: (index: number, answer: RecordedAnswer) => void;
  onContinue: () => void;
}

export function Question({ index, answers, onRecorded, onContinue }: QuestionProps) {
  const question = QUESTIONS[index];
  const answer = answers[index];
  const [mode, setMode] = useState<"record" | "playback">(answer ? "playback" : "record");

  return (
    <section className="stack">
      <p className="brand">Nathálya</p>
      <h1>{question.title}</h1>
      <p className="help">{question.help}</p>
      <VoiceThread answers={answers} current={index} />
      {mode === "record" ? (
        <VoiceRecorder
          onRecorded={(next) => {
            onRecorded(index, next);
            setMode("playback");
          }}
        />
      ) : (
        <div className="stack">
          <button type="button" className="cta--ghost" onClick={() => setMode("record")}>
            Gravar de novo
          </button>
          <button type="button" className="cta" onClick={onContinue} disabled={!answer}>
            Continuar
          </button>
        </div>
      )}
    </section>
  );
}
