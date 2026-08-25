"use client";

/**
 * Adapted from:
 * valadao-sf/smileflow src/components/design-system/ai-native/SfComposer.tsx
 * valadao-sf/smileflow src/components/design-system/ai-native/ComposerActions.tsx
 * commit: b02dfda6d85b8392e81b217c208503815c25c9a3
 */

import { type KeyboardEvent, useEffect, useRef } from "react";
import { ArrowUp, AudioLines, LoaderCircle, Mic } from "lucide-react";

import { useSpeechInput } from "./use-speech-input";

interface ComposerProps {
  autoCapitalize: "none" | "sentences";
  autoComplete: string;
  name: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTranscribe: (audio: Blob, fileName: string) => Promise<string>;
  spellCheck: boolean;
  value: string;
}

export function Composer({
  autoCapitalize,
  autoComplete,
  name,
  onChange,
  onSend,
  onTranscribe,
  spellCheck,
  value,
}: ComposerProps) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechInput({
    onTranscript: (text) => {
      onChange(text);
      requestAnimationFrame(() => fieldRef.current?.focus());
    },
    transcribe: onTranscribe,
  });
  const hasText = value.trim().length > 0;

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 144)}px`;
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (hasText) onSend();
  }

  return (
    <div className="nath-composer" data-phase={speech.phase}>
      {speech.label ? (
        <p className="nath-composer__stage" role="status">{speech.label}</p>
      ) : null}
      <div className="nath-composer__row">
        <textarea
          ref={fieldRef}
          className="nath-composer__field"
          name={name}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={spellCheck ? "on" : "off"}
          spellCheck={spellCheck}
          enterKeyHint="send"
          rows={1}
          placeholder="Fale ou escreva…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        {hasText && speech.phase !== "recording" ? (
          <button
            type="button"
            className="nath-composer__button nath-composer__button--send"
            onClick={onSend}
            aria-label="Enviar mensagem"
          >
            <ArrowUp size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="nath-composer__button nath-composer__button--mic"
            data-active={speech.phase === "recording" || undefined}
            onClick={() => void speech.toggle()}
            disabled={speech.busy}
            aria-label={speech.phase === "recording" ? "Parar gravação" : "Falar"}
          >
            {speech.phase === "recording" ? (
              <AudioLines size={18} />
            ) : speech.busy ? (
              <LoaderCircle className="nath-spin" size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
