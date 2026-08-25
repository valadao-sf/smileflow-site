"use client";

/**
 * Conversation shell adapted from:
 * valadao-sf/smileflow src/app/dashboard/_home/HomeConversacional.tsx
 * commit: 8c8a9751f7b3bfc95e4edc0d30ed9595b7aa9df5
 */

import { useEffect, useRef, useState } from "react";

import { persistAttribution } from "./attribution";
import { SfComposer } from "./composer/SfComposer";
import type { Attachment } from "./composer/composer-state";
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
  const [answers, setAnswers] = useState<string[]>([]);
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [messages, setMessages] = useState<ConversationMessage[]>([assistantMessage(0)]);
  const [done, setDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  useEffect(() => persistAttribution(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, done]);

  function addUserMessage(text: string): void {
    messageIdRef.current += 1;
    setMessages((current) => [
      ...current,
      { id: `user-${messageIdRef.current}`, role: "user", text },
    ]);
  }

  function answerText(text: string, attachments: Attachment[]): string {
    const attachmentLines = attachments.map((attachment) => `📎 ${attachment.name}`);
    return [text.trim(), ...attachmentLines].filter(Boolean).join("\n");
  }

  async function send(payload: { text: string; attachments: Attachment[] }): Promise<void> {
    if (done) return;
    const text = answerText(payload.text, payload.attachments);

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
      const name = payload.text.trim();
      if (!name) throw new Error("Digite seu nome.");
      const nextContact = { ...contact, name };
      setContact(nextContact);
      addUserMessage(name);
      const nextStep = step + 1;
      setStep(nextStep);
      setMessages((current) => [...current, assistantMessage(nextStep)]);
      return;
    }

    const instagram = sanitizeInstagram(payload.text);
    if (!instagram) throw new Error("Digite seu Instagram.");
    const nextContact = { ...contact, instagram };
    await submitNathConversation(nextContact, answers);
    setContact(nextContact);
    addUserMessage(`@${instagram}`);
    setMessages((current) => [
      ...current,
      {
        id: "assistant-done",
        role: "assistant",
        text: `Recebi sua pergunta, ${nextContact.name}.`,
      },
    ]);
    setDone(true);
  }

  const identityStep = step >= QUESTIONS.length;
  const instagramStep = step === QUESTIONS.length + 1;

  return (
    <main className="nath-screen">
      <section className="nath-conversation-box">
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
          <div ref={endRef} />
        </section>

        {!done ? (
          <div className="nath-composer-wrap">
            <SfComposer
              variant="slim"
              skin="cockpit"
              placeholder="Fale ou escreva…"
              onSubmit={send}
              onTranscribe={transcribeNathAudio}
              fieldName={
                instagramStep ? "username" : identityStep ? "name" : `answer-${step + 1}`
              }
              fieldAutoComplete={instagramStep ? "username" : identityStep ? "name" : "off"}
              fieldAutoCapitalize={instagramStep ? "none" : identityStep ? "words" : "sentences"}
              fieldSpellCheck={!instagramStep}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
