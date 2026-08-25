"use client";

/**
 * Recording lifecycle adapted from:
 * valadao-sf/smileflow src/components/design-system/ai-native/use-composer-recording.ts
 * commit: b02dfda6d85b8392e81b217c208503815c25c9a3
 */

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechPhase = "idle" | "requesting" | "recording" | "transcribing" | "error";

interface UseSpeechInputOptions {
  onTranscript: (text: string) => void;
  transcribe: (audio: Blob, fileName: string) => Promise<string>;
}

function audioFileName(mimeType: string): string {
  if (mimeType.includes("mp4")) return "resposta.m4a";
  if (mimeType.includes("ogg")) return "resposta.ogg";
  return "resposta.webm";
}

export function useSpeechInput({ onTranscript, transcribe }: UseSpeechInputOptions) {
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const [label, setLabel] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase("error");
      setLabel("Seu navegador não liberou o microfone. Você pode escrever.");
      return;
    }
    setPhase("requesting");
    setLabel("Abrindo o microfone…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stopStream();
        setPhase("error");
        setLabel("Não consegui gravar. Você pode escrever.");
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        recorderRef.current = null;
        stopStream();
        if (cancelledRef.current) return;
        if (blob.size === 0) {
          setPhase("error");
          setLabel("Não ouvi nada. Toque no microfone para tentar de novo.");
          return;
        }
        setPhase("transcribing");
        setLabel("Transcrevendo…");
        try {
          const text = (await transcribe(blob, audioFileName(blob.type))).trim();
          if (!text) throw new Error("empty_transcript");
          if (!cancelledRef.current) onTranscript(text);
          setPhase("idle");
          setLabel(null);
        } catch {
          setPhase("error");
          setLabel("Não consegui transcrever. Você pode tentar de novo ou escrever.");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
      setLabel("Gravando — toque para parar");
    } catch {
      stopStream();
      setPhase("error");
      setLabel("Não consegui abrir o microfone. Você pode escrever.");
    }
  }, [onTranscript, stopStream, transcribe]);

  const toggle = useCallback(async () => {
    if (phase === "recording") {
      recorderRef.current?.stop();
      return;
    }
    if (phase === "idle" || phase === "error") await start();
  }, [phase, start]);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      stopStream();
      chunksRef.current = [];
    };
  }, [stopStream]);

  return {
    busy: phase === "requesting" || phase === "transcribing",
    label,
    phase,
    toggle,
  };
}
