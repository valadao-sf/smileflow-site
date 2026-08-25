/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/use-composer-recording.ts
 * commit: 025f0d525b0889ef62b9fd63b1de79b81542557a
 */

import { useCallback, useEffect, useRef } from "react";

import type { ComposerEvent, ComposerPhase } from "./composer-state";
import type {
  MicMediaRecorderLike,
  MicMediaStreamLike,
  UseMicBars,
} from "./use-mic-bars";

export interface UseComposerRecordingOptions {
  phase: ComposerPhase;
  dispatch: (event: ComposerEvent) => void;
  bars: UseMicBars;
  getUserMedia: () => Promise<MicMediaStreamLike>;
  createRecorder: (stream: MicMediaStreamLike) => MicMediaRecorderLike;
  onTranscribe?: (audio: Blob) => Promise<string>;
}

export function useComposerRecording({
  phase,
  dispatch,
  bars,
  getUserMedia,
  createRecorder,
  onTranscribe,
}: UseComposerRecordingOptions) {
  const { start: startBars, stop: stopBars } = bars;
  const streamRef = useRef<MicMediaStreamLike | null>(null);
  const recorderRef = useRef<MicMediaRecorderLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startingRef = useRef(false);
  const cancelledRef = useRef(false);
  const recordingIdRef = useRef(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const isCurrentRecording = useCallback(
    (recordingId: number) =>
      !cancelledRef.current && recordingIdRef.current === recordingId,
    [],
  );

  const startRecording = useCallback(async () => {
    if (startingRef.current) return;
    const recordingId = recordingIdRef.current + 1;
    recordingIdRef.current = recordingId;
    startingRef.current = true;
    try {
      const stream = await getUserMedia();
      if (!isCurrentRecording(recordingId)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const recorder = createRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (isCurrentRecording(recordingId) && event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const shouldTranscribe = isCurrentRecording(recordingId);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        if (recorderRef.current === recorder) recorderRef.current = null;
        startingRef.current = false;
        stopStream();
        stopBars();
        if (!shouldTranscribe) return;

        dispatch({ type: "MIC_STOP" });
        if (!onTranscribe) {
          dispatch({ type: "FAIL", error: "Transcrição de voz não configurada nesta tela." });
          return;
        }
        onTranscribe(blob)
          .then((text) => {
            if (isCurrentRecording(recordingId)) {
              dispatch({ type: "TRANSCRIPT_READY", text });
            }
          })
          .catch(() => {
            if (isCurrentRecording(recordingId)) {
              dispatch({ type: "FAIL", error: "Não consegui transcrever o áudio." });
            }
          });
      };
      recorder.onerror = () => {
        if (recorderRef.current === recorder) recorderRef.current = null;
        startingRef.current = false;
        stopStream();
        stopBars();
        if (!isCurrentRecording(recordingId)) return;
        dispatch({ type: "FAIL", error: "Falha na gravação — toque para tentar de novo." });
      };
      recorderRef.current = recorder;
      recorder.start();
      startingRef.current = false;
      dispatch({ type: "MIC_START" });
      startBars(stream);
    } catch {
      startingRef.current = false;
      stopStream();
      if (!isCurrentRecording(recordingId)) return;
      dispatch({ type: "FAIL", error: "Não foi possível acessar o microfone." });
    }
  }, [
    createRecorder,
    dispatch,
    getUserMedia,
    isCurrentRecording,
    onTranscribe,
    startBars,
    stopBars,
    stopStream,
  ]);

  const handleMicClick = useCallback(() => {
    if (phase === "gravando") stopRecording();
    else if (phase === "idle" || phase === "erro") void startRecording();
  }, [phase, stopRecording, startRecording]);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      recordingIdRef.current += 1;
      startingRef.current = false;
      stopRecording();
      stopStream();
      stopBars();
    };
  }, [stopBars, stopRecording, stopStream]);

  return { handleMicClick, startRecording };
}
