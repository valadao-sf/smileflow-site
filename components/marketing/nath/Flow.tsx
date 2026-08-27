"use client";

import { useEffect, useRef, useState } from "react";

import { persistAttribution } from "./attribution";
import { validateFiles } from "./composer/attachments";
import { Composer } from "./composer/Composer";
import type { ChatAttachment } from "./composer/types";
import { SUCCESS_COPY, SUCCESS_CTA, SUCCESS_HREF } from "./copy";
import { submitNathConversation, transcribeNathAudio } from "./submit";
import type { LocalAnswer } from "./types";
import type { NathInputMode, PublishedNathForm } from "@/lib/marketing/nath-form";

interface FlowProps {
  form: PublishedNathForm;
}

function createSubmissionId(): string {
  return globalThis.crypto.randomUUID();
}

function attachmentAnswerText(attachments: ChatAttachment[]): string {
  return attachments.map((attachment) => `[Anexo: ${attachment.name}]`).join("\n");
}

export function Flow({ form }: FlowProps) {
  const [submissionId] = useState(createSubmissionId);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<LocalAnswer[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [inputMode, setInputMode] = useState<NathInputMode>("text");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [done, setDone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const objectUrlsRef = useRef(new Set<string>());

  const question = form.questions[questionIndex];
  const instagramStep = questionIndex === form.questions.length - 1;

  useEffect(() => persistAttribution(), []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [questionIndex]);

  useEffect(() => () => {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
  }, []);

  function clearCurrentAttachments(): ChatAttachment[] {
    const ready = attachments.map((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
        objectUrlsRef.current.delete(attachment.previewUrl);
      }
      const { previewUrl: _previewUrl, dataUrl: _dataUrl, ...persistable } = attachment;
      return persistable;
    });
    setAttachments([]);
    return ready;
  }

  function addFiles(files: File[]): void {
    if (files.length === 0 || pending) return;
    const validation = validateFiles(files);
    const accepted = validation.accepted.map(({ file, attachment }) => {
      const previewUrl = attachment.kind === "image" || attachment.kind === "audio"
        ? URL.createObjectURL(file)
        : undefined;
      if (previewUrl) objectUrlsRef.current.add(previewUrl);
      return { ...attachment, file, previewUrl };
    });
    if (accepted.length > 0) setAttachments((current) => [...current, ...accepted]);
    setError(validation.errors.length > 0 ? validation.errors.join(" ") : null);
  }

  function removeAttachment(id: string): void {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        objectUrlsRef.current.delete(target.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== id);
    });
  }

  async function commitAnswer(rawText: string, mode: NathInputMode): Promise<void> {
    if (!question || pending || done) return;
    const trimmed = rawText.trim();
    if (!trimmed && attachments.length === 0) {
      setError("Escreva, grave ou anexe sua resposta.");
      return;
    }
    if (instagramStep && !trimmed) {
      setError("Digite seu Instagram.");
      return;
    }

    const answer: LocalAnswer = {
      questionId: question.questionId,
      text: trimmed || attachmentAnswerText(attachments),
      inputMode: trimmed ? mode : "attachment",
      attachments: clearCurrentAttachments(),
    };
    const nextAnswers = [...answers, answer];
    setError(null);

    if (!instagramStep) {
      setAnswers(nextAnswers);
      setText("");
      setInputMode("text");
      setQuestionIndex((current) => current + 1);
      return;
    }

    setPending(true);
    try {
      await submitNathConversation({
        submissionId,
        formVersion: form.version,
        answers: nextAnswers,
      });
      setAnswers(nextAnswers);
      setText("");
      setDone(true);
    } catch (submitError) {
      setAttachments(answer.attachments);
      setText(rawText);
      setError(submitError instanceof Error ? submitError.message : "Não consegui enviar agora.");
      throw submitError;
    } finally {
      setPending(false);
    }
  }

  async function transcribeVoice(blob: Blob): Promise<void> {
    const transcript = await transcribeNathAudio(blob);
    setText((current) => `${current.trimEnd()}${current.trim() ? " " : ""}${transcript}`);
    setInputMode("voice");
    setError(null);
  }

  if (done) {
    return (
      <main className="nath-screen">
        <section className="nath-conversation-box nath-success" aria-live="polite">
          <p className="nath-chat__brand">Nathálya</p>
          <h1>{SUCCESS_COPY}</h1>
          <a className="nath-success__link" href={SUCCESS_HREF}>{SUCCESS_CTA}</a>
        </section>
      </main>
    );
  }

  if (!question) return null;

  return (
    <main className="nath-screen">
      <section
        className="nath-conversation-box"
        data-drag-active={dragActive || undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        {dragActive ? <div className="nath-drop-overlay">Solte os arquivos aqui</div> : null}
        <header className="nath-chat__header">
          <p className="nath-chat__brand">Nathálya</p>
          <h1>Fala comigo 🎙️</h1>
          <p className="nath-progress">Etapa {questionIndex + 1} de {form.questions.length}</p>
        </header>

        <div className="nath-question" aria-live="polite">
          <h2>{question.title}</h2>
          {question.help ? <p>{question.help}</p> : null}
        </div>

        <Composer
          text={text}
          onTextChange={(value) => {
            setText(value);
            setError(null);
          }}
          attachments={attachments}
          pending={pending}
          placeholder="Fale ou escreva…"
          attachError={error}
          onSend={() => { void commitAnswer(text, inputMode); }}
          onAddFiles={addFiles}
          onVoiceTranscribe={async (blob) => transcribeVoice(blob)}
          onRemoveAttachment={removeAttachment}
          onMicError={setError}
          textareaRef={textareaRef}
          fieldName={instagramStep ? "username" : `answer-${questionIndex + 1}`}
          fieldAutoComplete={instagramStep ? "username" : "off"}
          fieldAutoCapitalize={instagramStep ? "none" : "sentences"}
          fieldSpellCheck={!instagramStep}
          textareaAriaLabel={question.title}
        />
      </section>
    </main>
  );
}
