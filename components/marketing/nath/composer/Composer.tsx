"use client";

/**
 * Copied from:
 * valadao-sf/smileflow src/app/dashboard/_olana/Composer.tsx
 * commit: 02b052e
 *
 * Olana composer dock: textarea with auto-resize, file picker, clipboard paste,
 * voice recording (MediaRecorder) and the attachment preview strip.
 *
 * Host adaptations for Nath (nothing else):
 * - Olana-agent tools (analyze recordings, voice-note capture) removed
 * - pending-assistant stop control removed
 * - field name/autocomplete metadata for Instagram autofill
 */

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ArrowUp, FileAudio, FileText, Image as ImageIcon, LoaderCircle, Mic, Paperclip, Plus, Square, X } from "lucide-react";

import { useMicBars } from "./use-mic-bars";

import { ATTACH_ACCEPT, formatDuration } from "./attachments";
import { t } from "./i18n";
import type { ChatAttachment } from "./types";
import styles from "./Composer.module.css";

const MAX_RECORD_MS = 5 * 60 * 1000; // safety cap so a forgotten recording cannot run forever

const VOICE_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

type RecorderPhase = "idle" | "requesting" | "recording" | "stopping" | "processing";
type RecorderCompletion = "transcribe" | "send";

function pickVoiceMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return VOICE_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export interface ComposerProps {
  text: string;
  onTextChange: (value: string) => void;
  attachments: ChatAttachment[];
  pending: boolean;
  placeholder: string;
  attachError: string | null;
  onSend: () => void;
  onAddFiles: (files: File[]) => void;
  onVoiceTranscribe: (blob: Blob, durationMs: number) => Promise<void>;
  onVoiceSend: (blob: Blob, durationMs: number) => Promise<void>;
  onRemoveAttachment: (id: string) => void;
  onMicError: (message: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fieldName?: string;
  fieldAutoComplete?: string;
  fieldAutoCapitalize?: "none" | "sentences" | "words";
  fieldSpellCheck?: boolean;
  textareaAriaLabel?: string;
  allowAttachments?: boolean;
  allowVoiceSend?: boolean;
}

export function Composer({
  text,
  onTextChange,
  attachments,
  pending,
  placeholder,
  attachError,
  onSend,
  onAddFiles,
  onVoiceTranscribe,
  onVoiceSend,
  onRemoveAttachment,
  onMicError,
  textareaRef,
  fieldName,
  fieldAutoComplete,
  fieldAutoCapitalize,
  fieldSpellCheck,
  textareaAriaLabel = "Resposta",
  allowAttachments = true,
  allowVoiceSend = true,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const recordTimerRef = useRef<number | null>(null);
  const recordRequestIdRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const completionRef = useRef<RecorderCompletion | null>(null);
  const toolsWrapRef = useRef<HTMLDivElement>(null);
  const recordCancelRef = useRef<HTMLButtonElement>(null);
  const restoreComposerFocusRef = useRef(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [recorderPhase, setRecorderPhase] = useState<RecorderPhase>("idle");
  const [composerExpanded, setComposerExpanded] = useState(false);
  const micBars = useMicBars({ barCount: 120, mode: "history", historySampleMs: 50 });
  // Detected after mount: MediaRecorder is undefined during SSR and a state initializer
  // would produce a hydration mismatch.
  const [micSupported, setMicSupported] = useState(false);
  useEffect(() => {
    setMicSupported(pickVoiceMime() !== "");
  }, []);

  // Keep layout in sync with both typing and programmatic text changes.
  // Once expanded, a short hysteresis band prevents the wider two-row layout
  // from collapsing and expanding on every keystroke.
  useLayoutEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    if (!text) {
      area.style.height = "";
      setComposerExpanded(false);
      return;
    }

    area.style.height = "auto";
    const nextHeight = Math.min(area.scrollHeight, 152);
    area.style.height = `${nextHeight}px`;
    setComposerExpanded((wasExpanded) => {
      if (nextHeight > 52) return true;
      if (!wasExpanded) return false;
      return nextHeight > 48 || text.length >= 48;
    });
  }, [recorderPhase, text, textareaRef]);

  // Tools popover: close on outside pointerdown and on Esc.
  useEffect(() => {
    if (!toolsOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (toolsWrapRef.current && !toolsWrapRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setToolsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  function clearRecordTimer() {
    if (recordTimerRef.current != null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }

  function releaseRecorder(preserveWaveform = false) {
    clearRecordTimer();
    micBars.stop({ reset: !preserveWaveform });
    recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    recorderStreamRef.current = null;
    recorderRef.current = null;
  }

  // Unmount: stop an active recording without attaching anything (onstop detached first).
  useEffect(() => () => {
    recordRequestIdRef.current += 1;
    discardRecordingRef.current = true;
    if (recorderRef.current) {
      recorderRef.current.onstop = null;
      if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
    }
    completionRef.current = null;
    releaseRecorder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recorderPhase !== "requesting" && recorderPhase !== "recording" && recorderPhase !== "stopping") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelRecording();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // cancelRecording intentionally follows the active recorder refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderPhase]);

  // Recorder takeover removes the control that launched it. Preserve a useful
  // keyboard position across each DOM swap without stealing focus after the
  // user has already moved elsewhere.
  useEffect(() => {
    const focusWasLost = document.activeElement === document.body || !document.activeElement?.isConnected;
    if ((recorderPhase === "requesting" || recorderPhase === "recording") && focusWasLost) {
      recordCancelRef.current?.focus();
      return;
    }
    if (recorderPhase === "idle" && restoreComposerFocusRef.current) {
      restoreComposerFocusRef.current = false;
      textareaRef.current?.focus();
    }
  }, [recorderPhase, textareaRef]);

  async function startRecording() {
    if (recorderRef.current || recorderPhase !== "idle" || pending) return;
    const mimeType = pickVoiceMime();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      onMicError(t("micUnavailable"));
      return;
    }
    const requestId = recordRequestIdRef.current + 1;
    recordRequestIdRef.current = requestId;
    discardRecordingRef.current = false;
    completionRef.current = null;
    restoreComposerFocusRef.current = true;
    setRecorderPhase("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      if (requestId !== recordRequestIdRef.current) return;
      setRecorderPhase("idle");
      onMicError(t("micUnavailable"));
      return;
    }
    if (requestId !== recordRequestIdRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (requestId === recordRequestIdRef.current && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const durationMs = Date.now() - recordStartRef.current;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
      chunksRef.current = [];
      const discarded = discardRecordingRef.current || requestId !== recordRequestIdRef.current;
      const completion = completionRef.current ?? "transcribe";
      releaseRecorder();
      if (discarded) {
        setRecorderPhase("idle");
        return;
      }
      if (blob.size === 0 || durationMs <= 400) {
        completionRef.current = null;
        setRecorderPhase("idle");
        onMicError("O áudio ficou curto demais. Tente gravar novamente.");
        return;
      }
      setRecorderPhase("processing");
      try {
        if (completion === "transcribe") {
          await onVoiceTranscribe(blob, durationMs);
        } else {
          await onVoiceSend(blob, durationMs);
        }
      } catch {
        onMicError(completion === "send"
          ? "Não consegui enviar o áudio. Tente novamente."
          : "Não consegui transcrever o áudio. Tente novamente.");
      } finally {
        completionRef.current = null;
        if (requestId === recordRequestIdRef.current) setRecorderPhase("idle");
      }
    };
    recorder.onerror = () => {
      if (requestId !== recordRequestIdRef.current) return;
      discardRecordingRef.current = true;
      completionRef.current = null;
      recordRequestIdRef.current += 1;
      releaseRecorder();
      setRecorderPhase("idle");
      onMicError("A gravação foi interrompida. Tente novamente.");
    };
    recorderRef.current = recorder;
    recorderStreamRef.current = stream;
    recordStartRef.current = Date.now();
    recorder.start(250);
    micBars.start(stream);
    setRecorderPhase("recording");
    recordTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - recordStartRef.current;
      if (elapsed >= MAX_RECORD_MS) completeRecording();
    }, 1_000);
  }

  function completeRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    completionRef.current = "transcribe";
    setRecorderPhase("stopping");
    recorder.stop();
  }

  function sendRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    completionRef.current = "send";
    setRecorderPhase("processing");
    recorder.stop();
  }

  function cancelRecording() {
    discardRecordingRef.current = true;
    completionRef.current = null;
    recordRequestIdRef.current += 1;
    const recorder = recorderRef.current;
    setRecorderPhase("idle");
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else releaseRecorder();
  }

  useEffect(() => {
    if (!micSupported || recorderPhase !== "idle") return;
    function onDictateShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "d" || !event.shiftKey || !event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement
        && target !== textareaRef.current
        && (target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
      ) return;
      event.preventDefault();
      void startRecording();
    }
    document.addEventListener("keydown", onDictateShortcut);
    return () => document.removeEventListener("keydown", onDictateShortcut);
    // startRecording reads the current recorder refs and callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micSupported, pending, recorderPhase]);

  const hasContent = text.trim().length > 0 || (allowAttachments && attachments.length > 0);
  const recorderBusy = recorderPhase !== "idle";
  const voiceControl = micSupported ? (
    <span className={styles.voiceTriggerWrap}>
      <button
        type="button"
        className={styles.composerGhost}
        onClick={() => void startRecording()}
        disabled={pending}
        aria-label={t("voiceStart")}
        aria-describedby="nath-dictate-tooltip"
      >
        <Mic size={18} />
      </button>
      <span id="nath-dictate-tooltip" className={styles.voiceTooltip} role="tooltip">
        Ditar <kbd>⌃⇧D</kbd>
      </span>
    </span>
  ) : null;

  return (
    <div className={styles.composerDock}>
      {allowAttachments && attachments.length > 0 && (
        <div className={styles.attachStrip} aria-live="polite">
          {attachments.map((attachment) => (
            <div key={attachment.id} className={styles.attachChip}>
              {attachment.kind === "image" && attachment.previewUrl ? (
                <img className={styles.attachThumb} src={attachment.previewUrl} alt={attachment.name} />
              ) : (
                <span className={styles.attachIcon} aria-hidden="true">
                  {attachment.kind === "image" ? <ImageIcon size={15} /> : attachment.kind === "audio" ? <FileAudio size={15} /> : <FileText size={15} />}
                </span>
              )}
              <span className={styles.attachName}>{attachment.name}</span>
              {attachment.kind === "audio" && attachment.durationMs != null && (
                <span className={styles.attachMeta}>{formatDuration(attachment.durationMs)}</span>
              )}
              {attachment.transcriptStatus === "pending" && (
                <span className={styles.attachNote} role="status">{t("transcribingNote")}</span>
              )}
              {attachment.transcriptStatus === "failed" && (
                <span className={styles.attachNote} role="status">{t("transcriptFailedNote")}</span>
              )}
              <button
                type="button"
                className={styles.attachRemove}
                onClick={() => onRemoveAttachment(attachment.id)}
                aria-label={`${t("removeAttachment")}: ${attachment.name}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={styles.composer}
        data-expanded={(!recorderBusy && composerExpanded && text.length > 0) || undefined}
        data-recorder-phase={recorderBusy ? recorderPhase : undefined}
        data-pending={pending || undefined}
        data-has-tools={allowAttachments || undefined}
      >
        {allowAttachments ? (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACH_ACCEPT}
            className={styles.fileInput}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) onAddFiles(files);
              event.target.value = "";
            }}
          />
        ) : null}
        {recorderBusy ? (
          <div className={styles.recordingStage} role="group" aria-label="Gravação de áudio">
            <div className={styles.recordingStatus}>
              {recorderPhase === "recording" || recorderPhase === "stopping" ? (
                <>
                  <span className={styles.recordingBars} aria-hidden="true">
                    {micBars.levels.map((level, index) => (
                      <span
                        key={index}
                        className={styles.recordingBar}
                        ref={(element) => micBars.setBarElement(index, element)}
                        style={{ transform: `scaleY(${Math.max(0.075, level)})` }}
                      />
                    ))}
                  </span>
                  <span className={styles.recordingA11y} role="status" aria-live="polite" aria-atomic="true">
                    {recorderPhase === "stopping" ? "Finalizando áudio para transcrever…" : t("recordingNow")}
                  </span>
                </>
              ) : (
                <>
                  <LoaderCircle className={styles.processingSpinner} size={18} aria-hidden="true" />
                  <span role="status" aria-live="polite" aria-atomic="true">
                    {recorderPhase === "requesting"
                      ? "Liberando microfone…"
                      : completionRef.current === "send" ? "Transcrevendo e enviando…" : "Transcrevendo…"}
                  </span>
                </>
              )}
            </div>
            <div className={styles.recordingFooter}>
              <button
                ref={recordCancelRef}
                type="button"
                className={`${styles.composerGhost} ${styles.recordCancel}`}
                onClick={cancelRecording}
                disabled={recorderPhase === "processing"}
                aria-label="Cancelar gravação"
              >
                <X size={18} />
              </button>
              <span className={styles.recordingActions}>
                {recorderPhase === "recording" && allowVoiceSend ? (
                  <button
                    type="button"
                    className={styles.recordStop}
                    onClick={completeRecording}
                    aria-label="Parar e transcrever"
                  >
                    <Square size={10} fill="currentColor" />
                  </button>
                ) : null}
                {recorderPhase === "recording" ? (
                  <button
                    type="button"
                    className={styles.voiceCommit}
                    onClick={sendRecording}
                    aria-label="Enviar áudio agora"
                  >
                    <ArrowUp size={18} />
                  </button>
                ) : null}
              </span>
            </div>
          </div>
        ) : (
          <>
            {allowAttachments ? (
              <div className={styles.toolsWrap} ref={toolsWrapRef}>
                {toolsOpen && (
                <div className={styles.toolsMenu} role="menu" aria-label={t("toolsMenu")}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.toolsMenuItem}
                    onClick={() => {
                      setToolsOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Paperclip size={17} />
                    <span className={styles.toolsMenuCopy}>
                      <strong>{t("toolAttach")}</strong>
                      <small>{t("toolAttachHint")}</small>
                    </span>
                  </button>
                </div>
                )}
                <button
                  type="button"
                  className={styles.composerGhost}
                  onClick={() => setToolsOpen((open) => !open)}
                  disabled={pending}
                  aria-label={t("toolsMenu")}
                  aria-haspopup="menu"
                  aria-expanded={toolsOpen}
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : null}
            <textarea
              ref={textareaRef}
              value={text}
              rows={1}
              maxLength={50_000}
              name={fieldName}
              autoComplete={fieldAutoComplete}
              autoCapitalize={fieldAutoCapitalize}
              spellCheck={fieldSpellCheck}
              onChange={(event) => {
                onTextChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  onSend();
                }
              }}
              onPaste={allowAttachments ? (event) => {
                const files = Array.from(event.clipboardData?.files ?? []);
                if (files.length > 0) {
                  event.preventDefault();
                  onAddFiles(files);
                }
              } : undefined}
              placeholder={placeholder}
              aria-label={textareaAriaLabel}
              readOnly={pending}
            />
            <span className={styles.composerTerminal}>
              {hasContent ? (
                <>
                  {composerExpanded && voiceControl}
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={pending}
                    aria-label="Enviar mensagem"
                  >
                    <ArrowUp size={18} />
                  </button>
                </>
              ) : voiceControl ?? <span className={styles.composerActionSpacer} aria-hidden="true" />}
            </span>
          </>
        )}
      </div>
      <div className={styles.composerMeta} aria-live="polite">
        {attachError && <span role="alert">{attachError}</span>}
        {text.length >= 45_000 && <span>{text.length.toLocaleString("pt-BR")} / 50.000 caracteres</span>}
      </div>
    </div>
  );
}
