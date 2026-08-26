/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/use-mic-bars.ts
 * commit: 3d77dcb03b9c6e748acdd4a541b76da7b85ca696
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

const BAR_COUNT = 5;

export interface MicMediaStreamLike {
  getTracks(): Array<{ stop(): void }>;
}

export interface MicMediaRecorderLike {
  start(): void;
  stop(): void;
  readonly mimeType?: string;
  readonly state: string;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export function recordedAudioMime(chunks: readonly Blob[], recorderMimeType?: string): string {
  const chunkMimeType = chunks.find((chunk) => chunk.type.startsWith("audio/"))?.type;
  if (chunkMimeType) return chunkMimeType.split(";", 1)[0]?.trim() || "audio/webm";
  if (recorderMimeType?.startsWith("audio/")) {
    return recorderMimeType.split(";", 1)[0]?.trim() || "audio/webm";
  }
  return "audio/webm";
}

export interface MicAudioLevelAnalyser {
  frequencyBinCount: number;
  getByteFrequencyData(data: Uint8Array): void;
  close(): void;
}

export function defaultGetMicStream(): Promise<MicMediaStreamLike> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: false,
  }) as unknown as Promise<MicMediaStreamLike>;
}

export function defaultCreateMicRecorder(stream: MicMediaStreamLike): MicMediaRecorderLike {
  return new MediaRecorder(stream as unknown as MediaStream) as unknown as MicMediaRecorderLike;
}

export function defaultCreateMicAnalyser(stream: MicMediaStreamLike): MicAudioLevelAnalyser | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const source = ctx.createMediaStreamSource(stream as unknown as MediaStream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64;
  source.connect(analyser);
  return {
    frequencyBinCount: analyser.frequencyBinCount,
    getByteFrequencyData: (data) =>
      analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>),
    close: () => void ctx.close(),
  };
}

export function computeMicBarLevels(data: Uint8Array, barCount: number): number[] {
  const bucket = Math.max(1, Math.floor(data.length / barCount));
  const levels: number[] = [];
  for (let i = 0; i < barCount; i += 1) {
    let sum = 0;
    for (let j = i * bucket; j < (i + 1) * bucket && j < data.length; j += 1) {
      sum += data[j];
    }
    levels.push(Math.min(1, sum / bucket / 255));
  }
  return levels;
}

export function computeMicHistoryLevel(data: Uint8Array): number {
  const bandLength = Math.max(1, Math.ceil(data.length * 0.6));
  let squareSum = 0;
  for (let index = 0; index < bandLength; index += 1) {
    const normalized = data[index] / 255;
    squareSum += normalized * normalized;
  }
  return Math.min(1, Math.sqrt(squareSum / bandLength) * 2);
}

export interface UseMicBarsOptions {
  createAnalyser?: (stream: MicMediaStreamLike) => MicAudioLevelAnalyser | null;
  barCount?: number;
  mode?: "spectrum" | "history";
  historySampleMs?: number;
}

export interface UseMicBars {
  levels: number[];
  setBarElement(index: number, element: HTMLElement | null): void;
  start(stream: MicMediaStreamLike): void;
  stop(options?: { reset?: boolean }): void;
}

export function useMicBars(options: UseMicBarsOptions = {}): UseMicBars {
  const {
    createAnalyser = defaultCreateMicAnalyser,
    barCount = BAR_COUNT,
    mode = "spectrum",
    historySampleMs = 52,
  } = options;
  const levels = useMemo<number[]>(() => Array(barCount).fill(0), [barCount]);
  const analyserRef = useRef<MicAudioLevelAnalyser | null>(null);
  const barElementsRef = useRef<Array<HTMLElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>(Array(barCount).fill(0));
  const lastHistorySampleRef = useRef(0);

  const setBarElement = useCallback((index: number, element: HTMLElement | null) => {
    barElementsRef.current[index] = element;
  }, []);

  const setBarTransforms = useCallback(
    (nextLevels: number[]) => {
      const minimum = mode === "history" ? 0.075 : 0.15;
      for (let index = 0; index < nextLevels.length; index += 1) {
        const element = barElementsRef.current[index];
        if (element) {
          element.style.transform = `scaleY(${Math.max(minimum, nextLevels[index])})`;
        }
      }
    },
    [mode],
  );

  const stop = useCallback(
    (stopOptions: { reset?: boolean } = {}) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      analyserRef.current?.close();
      analyserRef.current = null;
      if (stopOptions.reset !== false) {
        historyRef.current = Array(barCount).fill(0);
        setBarTransforms(historyRef.current);
      }
    },
    [barCount, setBarTransforms],
  );

  const start = useCallback(
    (stream: MicMediaStreamLike) => {
      const analyser = createAnalyser(stream);
      analyserRef.current = analyser;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      historyRef.current = Array(barCount).fill(0);
      lastHistorySampleRef.current = 0;
      setBarTransforms(historyRef.current);
      const tick = (timestamp: number) => {
        analyser.getByteFrequencyData(data);
        if (mode === "history") {
          if (
            lastHistorySampleRef.current === 0 ||
            timestamp - lastHistorySampleRef.current >= historySampleMs
          ) {
            const nextLevel = computeMicHistoryLevel(data);
            historyRef.current = [...historyRef.current.slice(1), nextLevel];
            setBarTransforms(historyRef.current);
            lastHistorySampleRef.current = timestamp;
          }
        } else {
          setBarTransforms(computeMicBarLevels(data, barCount));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [barCount, createAnalyser, historySampleMs, mode, setBarTransforms],
  );

  useEffect(() => () => stop(), [stop]);

  return { levels, setBarElement, start, stop };
}
