"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { persistAttribution } from "./attribution";
import { Composer } from "./composer/Composer";
import {
  FINAL_CONSENT_COPY,
  FINAL_CONSENT_TITLE,
  NAME_CONSENT,
  PROFILE_PROMPT,
  PROFILE_TITLE,
  SUCCESS_BODY,
  SUCCESS_COPY,
  SUCCESS_CTA,
  SUCCESS_HREF,
  TAG_CONSENT,
} from "./copy";
import { submitNathConversation, transcribeNathAudio } from "./submit";
import type { LocalAnswer } from "./types";
import type { NathInputMode, PublishedNathForm } from "@/lib/marketing/nath-form";
import { cleanInstagram } from "@/lib/marketing/nath-submission";

interface FlowProps {
  form: PublishedNathForm;
}

type Screen = "profile" | "question" | "consent" | "success";

const QUESTION_COUNT = 3;

function createSubmissionId(): string {
  return globalThis.crypto.randomUUID();
}

export function Flow({ form }: FlowProps) {
  const [submissionId] = useState(createSubmissionId);
  const [screen, setScreen] = useState<Screen>("profile");
  const [fullName, setFullName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [canMentionName, setCanMentionName] = useState(true);
  const [canTagInstagram, setCanTagInstagram] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<LocalAnswer | undefined>>([]);
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState<NathInputMode>("text");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const question = form.questions[questionIndex];

  useEffect(() => persistAttribution(), []);

  useEffect(() => {
    if (screen === "profile") nameRef.current?.focus();
    if (screen === "question") textareaRef.current?.focus();
  }, [questionIndex, screen]);

  function makeAnswer(rawText: string, mode: NathInputMode): LocalAnswer {
    return {
      questionId: question?.questionId ?? "",
      text: rawText.trim(),
      draftText: rawText,
      inputMode: mode,
      attachments: [],
    };
  }

  function restoreQuestion(index: number, sourceAnswers: Array<LocalAnswer | undefined>): void {
    const saved = sourceAnswers[index];
    setQuestionIndex(index);
    setText(saved?.draftText ?? saved?.text ?? "");
    setInputMode(saved?.inputMode ?? "text");
    setError(null);
    setScreen("question");
  }

  function saveCurrentAnswer(): Array<LocalAnswer | undefined> {
    const nextAnswers = [...answers];
    if (question) nextAnswers[questionIndex] = makeAnswer(text, inputMode);
    setAnswers(nextAnswers);
    return nextAnswers;
  }

  function continueFromProfile(): void {
    if (!fullName.trim()) {
      setError("Digite seu nome completo.");
      return;
    }
    if (!cleanInstagram(instagram)) {
      setError("Digite seu Instagram.");
      return;
    }
    restoreQuestion(0, answers);
  }

  function goBack(): void {
    if (pending || screen === "profile" || screen === "success") return;
    if (screen === "consent") {
      restoreQuestion(QUESTION_COUNT - 1, answers);
      return;
    }
    const nextAnswers = saveCurrentAnswer();
    if (questionIndex === 0) {
      setScreen("profile");
      setError(null);
      return;
    }
    restoreQuestion(questionIndex - 1, nextAnswers);
  }

  function commitAnswer(): void {
    if (!question || pending || screen !== "question") return;
    if (!text.trim()) {
      setError("Escreva ou grave sua resposta.");
      return;
    }
    const nextAnswers = saveCurrentAnswer();
    setError(null);
    if (questionIndex < QUESTION_COUNT - 1) {
      restoreQuestion(questionIndex + 1, nextAnswers);
      return;
    }
    setScreen("consent");
  }

  async function transcribeVoice(blob: Blob): Promise<void> {
    const transcript = await transcribeNathAudio(blob);
    setText((current) => `${current.trimEnd()}${current.trim() ? " " : ""}${transcript}`);
    setInputMode("voice");
    setError(null);
  }

  async function submitConversation(): Promise<void> {
    if (pending) return;
    const narrativeAnswers = form.questions
      .slice(0, QUESTION_COUNT)
      .map((_, index) => answers[index])
      .filter((item): item is LocalAnswer => item !== undefined && item.text.trim().length > 0);
    const instagramQuestion = form.questions[QUESTION_COUNT];
    const normalizedInstagram = cleanInstagram(instagram);
    if (narrativeAnswers.length !== QUESTION_COUNT || !instagramQuestion || !normalizedInstagram) {
      setError("Volte e responda todas as perguntas.");
      return;
    }

    const completeAnswers: LocalAnswer[] = [
      ...narrativeAnswers,
      {
        questionId: instagramQuestion.questionId,
        text: normalizedInstagram,
        draftText: instagram,
        inputMode: "text",
        attachments: [],
      },
    ];

    setPending(true);
    setError(null);
    try {
      await submitNathConversation({
        submissionId,
        formVersion: form.version,
        answers: completeAnswers,
        contact: {
          fullName,
          instagram: normalizedInstagram,
          canMentionName,
          canTagInstagram,
        },
      });
      setScreen("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não consegui enviar agora.");
    } finally {
      setPending(false);
    }
  }

  if (screen === "success") {
    return (
      <main className="nath-screen">
        <section className="nath-conversation-box nath-success" aria-live="polite">
          <div className="nath-content">
            <h1>{SUCCESS_COPY}</h1>
            <p>{SUCCESS_BODY}</p>
            <a className="nath-primary-action" href={SUCCESS_HREF}>{SUCCESS_CTA}</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="nath-screen">
      <section className="nath-conversation-box">
        {screen !== "profile" ? (
          <button
            className="nath-back"
            type="button"
            onClick={goBack}
            disabled={pending}
            aria-label="Voltar"
          >
            <ChevronLeft size={24} strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : null}

        {screen === "profile" ? (
          <form
            className="nath-content"
            onSubmit={(event) => {
              event.preventDefault();
              continueFromProfile();
            }}
          >
            <div className="nath-copy">
              <h1>{PROFILE_TITLE}</h1>
              <p>{PROFILE_PROMPT}</p>
            </div>
            <div className="nath-fields">
              <label className="nath-field">
                <span>Nome completo</span>
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  autoComplete="name"
                  enterKeyHint="next"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setError(null);
                  }}
                />
              </label>
              <label className="nath-field">
                <span>Instagram</span>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  placeholder="@seuinstagram"
                  value={instagram}
                  onChange={(event) => {
                    setInstagram(event.target.value);
                    setError(null);
                  }}
                />
              </label>
            </div>
            <SwitchRow checked={canMentionName} onChange={setCanMentionName}>
              {NAME_CONSENT}
            </SwitchRow>
            {error ? <p className="nath-error" role="alert">{error}</p> : null}
            <button className="nath-primary-action" type="submit">Continuar</button>
          </form>
        ) : null}

        {screen === "question" && question ? (
          <div className="nath-content">
            <div className="nath-copy" aria-live="polite">
              <h1>{question.title}</h1>
              {question.help ? <p>{question.help}</p> : null}
            </div>
            <Composer
              text={text}
              onTextChange={(value) => {
                setText(value);
                setError(null);
              }}
              attachments={[]}
              pending={pending}
              placeholder="Fale ou escreva…"
              attachError={error}
              onSend={commitAnswer}
              onAddFiles={() => undefined}
              onVoiceTranscribe={async (blob) => transcribeVoice(blob)}
              onVoiceSend={async (blob) => transcribeVoice(blob)}
              onRemoveAttachment={() => undefined}
              onMicError={setError}
              textareaRef={textareaRef}
              fieldName={`answer-${questionIndex + 1}`}
              fieldAutoComplete="off"
              fieldAutoCapitalize="sentences"
              fieldSpellCheck
              textareaAriaLabel={question.title}
              allowAttachments={false}
              allowVoiceSend={false}
            />
          </div>
        ) : null}

        {screen === "consent" ? (
          <div className="nath-content">
            <div className="nath-copy">
              <h1>{FINAL_CONSENT_TITLE}</h1>
              <p>{FINAL_CONSENT_COPY}</p>
            </div>
            <SwitchRow checked={canTagInstagram} onChange={setCanTagInstagram}>
              {TAG_CONSENT}
            </SwitchRow>
            {error ? <p className="nath-error" role="alert">{error}</p> : null}
            <button
              className="nath-primary-action"
              type="button"
              onClick={() => void submitConversation()}
              disabled={pending}
            >
              {pending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SwitchRow({
  checked,
  children,
  onChange,
}: {
  checked: boolean;
  children: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="nath-switch-row">
      <span>{children}</span>
      <span className="nath-switch">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}
