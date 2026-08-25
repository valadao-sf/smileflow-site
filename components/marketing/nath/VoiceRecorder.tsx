"use client";

/**
 * Adapted from valadao-sf/smileflow
 * src/components/kiosk/olana/TouchRecorder.tsx
 * commit 8124741fe972acc87f4200598cc9d76223732f2d
 *
 * Kept: getUserMedia, MediaRecorder, chunk accumulation, track/recorder cleanup.
 * Dropped: kiosk pause/resume, far-field constraints, duration cap, analyser DI.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { formatElapsed } from "./format";
import { isInstagramWebview } from "./in-app-browser";
import { pickRecorderMime } from "./mime";
import type { RecordedAnswer } from "./types";

type RecorderState = "idle" | "requesting" | "recording" | "error" | "unsupported";

interface VoiceRecorderProps {
  onRecorded: (answer: RecordedAnswer) => void;
}

function micErrorMessage(error: unknown): string {
  if (isInstagramWebview()) {
    return "O microfone não abre no Instagram. Toque em ··· e abra no Safari ou no Chrome.";
  }
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") {
    return "Permita o microfone para gravar. Toque para tentar de novo.";
  }
  return "Não foi possível acessar o microfone. Toque para tentar de novo.";
}

export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedS, setElapsedS] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRequestedRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const stopClock = useCallback(() => {
    if (clockRef.current !== null) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (sessionActiveRef.current) return;
    const mime = pickRecorderMime();
    if (!mime) {
      setErrorMessage(
        "Este navegador não consegue gravar áudio. Abra no Safari ou no Chrome.",
      );
      setState("unsupported");
      return;
    }
    sessionActiveRef.current = true;
    setErrorMessage(null);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mimeRef.current = mime;
      stopRequestedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopClock();
        const durationS = startedAtRef.current === null
          ? elapsedRef.current
          : Math.max(0, (Date.now() - startedAtRef.current) / 1000);
        startedAtRef.current = null;
        elapsedRef.current = durationS;
        const type = mimeRef.current ?? mime;
        const blob = new Blob(chunksRef.current, { type });
        recorderRef.current = null;
        sessionActiveRef.current = false;
        cleanupStream();
        const url = URL.createObjectURL(blob);
        setState("idle");
        setElapsedS(durationS);
        onRecorded({ blob, url, durationS, mimeType: type });
      };
      recorder.onerror = () => {
        sessionActiveRef.current = false;
        stopClock();
        cleanupStream();
        recorderRef.current = null;
        startedAtRef.current = null;
        setErrorMessage("Falha ao gravar. Toque para tentar de novo.");
        setState("error");
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      elapsedRef.current = 0;
      setElapsedS(0);
      recorder.start();
      setState("recording");
      clockRef.current = setInterval(() => {
        const next = Math.max(0, (Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
        elapsedRef.current = next;
        setElapsedS(next);
      }, 250);
    } catch (error) {
      sessionActiveRef.current = false;
      cleanupStream();
      setErrorMessage(micErrorMessage(error));
      setState("error");
    }
  }, [cleanupStream, onRecorded, stopClock]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive" || stopRequestedRef.current) return;
    stopRequestedRef.current = true;
    stopClock();
    if (startedAtRef.current !== null) {
      elapsedRef.current = Math.max(0, (Date.now() - startedAtRef.current) / 1000);
      setElapsedS(elapsedRef.current);
    }
    recorder.stop();
  }, [stopClock]);

  useEffect(() => () => {
    stopClock();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    cleanupStream();
  }, [cleanupStream, stopClock]);

  const recording = state === "recording";
  const longTake = recording && elapsedS >= 120;
  const blocked = state === "unsupported";
  const actionLabel = recording ? "Parar" : "Gravar";
  const noticeTone = errorMessage?.includes("Instagram") ? "warning" : "danger";

  return (
    <div className="nath-recorder">
      <button
        type="button"
        className={`sf-practice-primary-action${recording ? " sf-practice-primary-action--recording" : ""}`}
        onClick={() => {
          if (blocked) return;
          if (recording) stopRecording();
          else void startRecording();
        }}
        disabled={state === "requesting" || blocked}
        aria-pressed={recording}
        aria-labelledby="nath-record-label"
      >
        <span className="nath-record__glyph" aria-hidden="true" />
      </button>
      <p className="nath-recorder__label" id="nath-record-label">
        {actionLabel}
      </p>
      <p className={`nath-timer${longTake ? " nath-timer--long" : ""}`} aria-live="polite">
        {state === "requesting" ? "Pedindo o microfone…" : formatElapsed(elapsedS)}
      </p>
      {errorMessage ? (
        <div className={`sf-notice sf-notice--${noticeTone}`} role="alert">
          <div className="sf-notice__body">{errorMessage}</div>
        </div>
      ) : null}
    </div>
  );
}
