"use client";

/**
 * Conversation shell adapted from:
 * valadao-sf/smileflow src/app/dashboard/_home/HomeConversacional.tsx
 * commit: 8c8a9751f7b3bfc95e4edc0d30ed9595b7aa9df5
 */

import { useEffect, useRef, useState } from "react";

import { persistAttribution } from "./attribution";
import { Composer } from "./Composer";
import { IDENTITY_PROMPTS, QUESTIONS, SUCCESS_CTA, SUCCESS_HREF } from "./copy";
import { submitNathConversation, transcribeNathAudio } from "./submit";
import type { ContactInfo, ConversationMessage } from "./types";

const EMPTY_CONTACT: ContactInfo = { instagram: "", name: "" };

function assistantMessage(step: number): ConversationMessage {
  if (step < QUESTIONS.length) {
    const question = QUESTIONS[step];
    return { id: `assistant-${step}`, role: "assistant", text: question.help, title: question.title };
  }
  return {
    id: `assistant-${step}`,
    role: "assistant",
    text: IDENTITY_PROMPTS[step - QUESTIONS.length],
  };
}

function sanitizeInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/\/$/, "");
}

export function Flow() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [messages, setMessages] = useState<ConversationMessage[]>([assistantMessage(0)]);
  const [phase, setPhase] = useState<"talking" | "submitting" | "error" | "done">("talking");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  useEffect(() => persistAttribution(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, phase]);

  function addUserMessage(text: string): void {
    messageIdRef.current += 1;
    setMessages((current) => [
      ...current,
      { id: `user-${messageIdRef.current}`, role: "user", text },
    ]);
  }

  async function finish(nextContact: ContactInfo, nextAnswers: string[]): Promise<void> {
    setPhase("submitting");
    setError(null);
    try {
      await submitNathConversation(nextContact, nextAnswers);
      setMessages((current) => [
        ...current,
        {
          id: "assistant-done",
          role: "assistant",
          text: `Recebi sua pergunta, ${nextContact.name}.`,
        },
      ]);
      setPhase("done");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não consegui enviar agora. Tente novamente.",
      );
      setPhase("error");
    }
  }

  async function send(): Promise<void> {
    if (phase !== "talking") return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");

    if (step < QUESTIONS.length) {
      const nextAnswers = [...answers, text];
      setAnswers(nextAnswers);
      addUserMessage(text);
      const nextStep = step + 1;
      setStep(nextStep);
      setMessages((current) => [...current, assistantMessage(nextStep)]);
      return;
    }

    if (step === QUESTIONS.length) {
      const nextContact = { ...contact, name: text };
      setContact(nextContact);
      addUserMessage(text);
      const nextStep = step + 1;
      setStep(nextStep);
      setMessages((current) => [...current, assistantMessage(nextStep)]);
      return;
    }

    const instagram = sanitizeInstagram(text);
    if (!instagram) return;
    const nextContact = { ...contact, instagram };
    setContact(nextContact);
    addUserMessage(`@${instagram}`);
    await finish(nextContact, answers);
  }

  const identityStep = step >= QUESTIONS.length;
  const instagramStep = step === QUESTIONS.length + 1;

  return (
    <main className="nath-chat">
      <div className="nath-chat__content">
        <header className="nath-chat__header">
          <p className="nath-chat__brand">Nathálya</p>
          <h1>Fala comigo 🎙️</h1>
        </header>

        <section className="nath-thread" aria-live="polite" aria-label="Conversa com a Nath">
          {messages.map((message) => (
            <article
              className={`nath-message nath-message--${message.role}`}
              key={message.id}
            >
              {message.title ? <h2>{message.title}</h2> : null}
              <p>{message.text}</p>
              {message.id === "assistant-done" ? (
                <a className="nath-message__link" href={SUCCESS_HREF}>
                  {SUCCESS_CTA}
                </a>
              ) : null}
            </article>
          ))}

          {phase === "submitting" ? (
            <p className="nath-status" role="status">Enviando…</p>
          ) : null}
          {phase === "error" ? (
            <div className="nath-retry" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void finish(contact, answers)}>
                Tentar novamente
              </button>
            </div>
          ) : null}
          <div ref={endRef} />
        </section>
      </div>

      {phase === "talking" ? (
        <div className="nath-composer-dock">
          <div className="nath-composer-wrap">
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send()}
              onTranscribe={transcribeNathAudio}
              name={instagramStep ? "username" : identityStep ? "name" : `answer-${step + 1}`}
              autoComplete={instagramStep ? "username" : identityStep ? "name" : "off"}
              autoCapitalize={instagramStep ? "none" : "sentences"}
              spellCheck={!instagramStep}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
