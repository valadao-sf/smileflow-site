"use client";

/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/SfComposer.tsx
 * commit: dae68ac38d9e721dc3c96674616fa437045c47f5
 *
 * The field metadata props are the only host-specific addition: they let the
 * Instagram in-app browser offer its native name/username autofill.
 */

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Ref } from "react";

import {
  composerReducer,
  composerSlot,
  hasComposerContent,
  initialComposer,
  type Attachment,
} from "./composer-state";
import { ComposerActions } from "./ComposerActions";
import { ComposerAttachments } from "./ComposerAttachments";
import { ComposerStage } from "./ComposerStage";
import { useComposerInputs } from "./use-composer-inputs";
import { useComposerRecording } from "./use-composer-recording";
import {
  defaultCreateMicAnalyser,
  defaultCreateMicRecorder,
  defaultGetMicStream,
  useMicBars,
  type MicAudioLevelAnalyser,
  type MicMediaRecorderLike,
  type MicMediaStreamLike,
} from "./use-mic-bars";

const MAX_FIELD_HEIGHT_PX = 152;

export interface SfComposerHandle {
  startRecording: () => void;
}

export interface SfComposerProps {
  ref?: Ref<SfComposerHandle>;
  placeholder?: string;
  onSubmit: (payload: { text: string; attachments: Attachment[] }) => Promise<void>;
  onTranscribe?: (audio: Blob) => Promise<string>;
  getUserMedia?: () => Promise<MicMediaStreamLike>;
  createRecorder?: (stream: MicMediaStreamLike) => MicMediaRecorderLike;
  createAnalyser?: (stream: MicMediaStreamLike) => MicAudioLevelAnalyser | null;
  variant?: "default" | "slim";
  skin?: "default" | "cockpit";
  fieldName?: string;
  fieldAutoComplete?: string;
  fieldAutoCapitalize?: "none" | "sentences" | "words";
  fieldSpellCheck?: boolean;
}

export function SfComposer({
  ref,
  placeholder = "Escreva, cole, arraste ou grave…",
  onSubmit,
  onTranscribe,
  getUserMedia = defaultGetMicStream,
  createRecorder = defaultCreateMicRecorder,
  createAnalyser = defaultCreateMicAnalyser,
  variant = "default",
  skin = "default",
  fieldName,
  fieldAutoComplete,
  fieldAutoCapitalize,
  fieldSpellCheck,
}: SfComposerProps) {
  const [state, dispatch] = useReducer(composerReducer, initialComposer);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const {
    dropActive,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  } = useComposerInputs(dispatch);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bars = useMicBars({ createAnalyser });
  const { handleMicClick, startRecording } = useComposerRecording({
    phase: state.phase,
    dispatch,
    bars,
    getUserMedia,
    createRecorder,
    onTranscribe,
  });

  useImperativeHandle(
    ref,
    () => ({
      startRecording: () => {
        if (state.phase === "idle" || state.phase === "erro") void startRecording();
      },
    }),
    [state.phase, startRecording],
  );

  const visibleAttachments = state.attachments.filter(
    (attachment) => !removedIds.has(attachment.id),
  );

  useEffect(() => {
    const element = fieldRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_FIELD_HEIGHT_PX)}px`;
  }, [state.text]);

  const removeAttachment = useCallback((id: string) => {
    setRemovedIds((previous) => new Set(previous).add(id));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (state.phase !== "idle" && state.phase !== "erro") return;
    if (!hasComposerContent(state.text, visibleAttachments)) return;
    if (state.error) dispatch({ type: "RESET" });
    dispatch({ type: "THINK_START" });
    try {
      await onSubmit({ text: state.text, attachments: visibleAttachments });
      dispatch({ type: "DONE" });
    } catch (error) {
      dispatch({
        type: "FAIL",
        error: error instanceof Error ? error.message : "Falha ao enviar.",
      });
    }
  }, [state.phase, state.text, state.error, visibleAttachments, onSubmit]);

  const canSubmitPhase = state.phase === "idle" || state.phase === "erro";
  const hasContent = hasComposerContent(state.text, visibleAttachments);
  const sendDisabled = !canSubmitPhase || !hasContent;
  const busy = state.phase === "pensando";
  const showSend = composerSlot(state.phase, hasContent) === "send";

  return (
    <div
      className={`sf-composer${variant === "slim" ? " sf-composer--slim" : ""}${skin === "cockpit" ? " sf-composer--cockpit" : ""}${dropActive ? " sf-composer--drop-active" : ""}`}
      data-phase={state.phase !== "idle" ? state.phase : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ComposerAttachments attachments={visibleAttachments} onRemove={removeAttachment} />
      <ComposerStage
        phase={state.phase}
        error={state.error}
        barLevels={bars.levels}
        onBarMount={bars.setBarElement}
      />

      <ComposerActions
        onAttach={() => fileInputRef.current?.click()}
        onMic={handleMicClick}
        onSend={() => void handleSubmit()}
        showSend={showSend}
        micActive={state.phase === "gravando"}
        micDisabled={busy || state.phase === "transcrevendo"}
        sendDisabled={sendDisabled}
        busy={busy}
      >
        <textarea
          ref={fieldRef}
          className="sf-composer__field"
          value={state.text}
          onChange={(event) => dispatch({ type: "TYPE", text: event.target.value })}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={busy}
          rows={1}
          name={fieldName}
          autoComplete={fieldAutoComplete}
          autoCapitalize={fieldAutoCapitalize}
          spellCheck={fieldSpellCheck}
        />
      </ComposerActions>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
