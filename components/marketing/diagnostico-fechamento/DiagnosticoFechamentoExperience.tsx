"use client";

import { ArrowLeft, Check, Download, Play, Volume2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { buildDiagnosis, questions, VIP_GROUP_URL } from "@/lib/marketing/diagnostico-fechamento";

import styles from "./diagnostico-fechamento.module.css";

type Screen = "opening" | "question" | "result" | "video";

const ANSWER_CONFIRM_MS = 280;

function emit(eventName: string, detail: Record<string, string> = {}) {
  const analyticsWindow = window as Window & { fbq?: (...args: unknown[]) => void };
  const payload = { route: "/diagnostico-de-fechamento", ...detail };
  try {
    analyticsWindow.fbq?.("trackCustom", eventName, payload);
    window.dispatchEvent(new CustomEvent("smileflow:marketing", { detail: { eventName, ...payload } }));
  } catch {
    // Measurement never blocks the diagnosis.
  }
}

export function DiagnosticoFechamentoExperience() {
  const [screen, setScreen] = useState<Screen>("opening");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [pdfOpened, setPdfOpened] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const transitionTimer = useRef<number | undefined>(undefined);
  const skipInitialFocus = useRef(true);

  const question = questions[questionIndex];
  const diagnosis = useMemo(() => buildDiagnosis(answers), [answers]);
  const pausedLabel = hasPlayed ? "Toque para continuar" : "Toque para assistir com som";

  const clearTransitionTimer = useCallback(() => {
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = undefined;
  }, []);

  const resetVideoUi = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    setHasPlayed(false);
    setVideoEnded(false);
    setPlayError(null);
  }, []);

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  useLayoutEffect(() => {
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [screen, questionIndex]);

  const goBack = useCallback(() => {
    clearTransitionTimer();
    if (screen === "question") {
      if (questionIndex === 0) setScreen("opening");
      else setQuestionIndex((current) => current - 1);
    } else if (screen === "result") {
      setScreen("question");
      setQuestionIndex(questions.length - 1);
    } else if (screen === "video") {
      resetVideoUi();
      setScreen("result");
    }
  }, [clearTransitionTimer, questionIndex, resetVideoUi, screen]);

  const chooseAnswer = useCallback((fieldId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [fieldId]: optionId }));
    emit("diagnostic_answer", { question: questions[questionIndex].id, answer: optionId });
    clearTransitionTimer();
    const scheduledIndex = questionIndex;
    const token = window.setTimeout(() => {
      if (transitionTimer.current !== token) return;
      transitionTimer.current = undefined;
      if (scheduledIndex < questions.length - 1) setQuestionIndex((current) => current + 1);
      else setScreen("result");
    }, ANSWER_CONFIRM_MS);
    transitionTimer.current = token;
  }, [clearTransitionTimer, questionIndex]);

  const toggleVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoEnded) return;
    if (video.paused) {
      try {
        await video.play();
        setHasPlayed(true);
        setIsPlaying(true);
        setPlayError(null);
        emit("diagnostic_video_play");
      } catch {
        setIsPlaying(false);
        setPlayError("Não foi possível reproduzir o vídeo. Tente de novo.");
      }
      return;
    }
    video.pause();
    setIsPlaying(false);
  }, [videoEnded]);

  return (
    <main className={styles.page}>
      <section className={styles.stage}>
        {screen !== "opening" && (
          <button className={styles.back} onClick={goBack} type="button" aria-label="Voltar">
            <ArrowLeft aria-hidden="true" />
          </button>
        )}
        <span className={styles.brand}>SmileFlow</span>

        {screen === "opening" && (
          <div className={`${styles.panel} ${styles.opening}`}>
            <div className={styles.openingBody}>
              <img
                className={styles.openingPortrait}
                src="/images/diagnostico-fechamento/nathalya.webp"
                alt="Nathálya Mello"
                width={1080}
                height={1080}
              />
              <p className={styles.eyebrow}>Diagnóstico de Fechamento</p>
              <h1 ref={headingRef} tabIndex={-1}>O que acontece com você na hora de falar o preço?</h1>
              <p>Responda três perguntas rápidas. Você vai entender o que faz você recuar e recebe na hora o PDF da Nathálya.</p>
              <p className={styles.support}>Sem cadastro. Gratuito.</p>
            </div>
            <button
              className={styles.primary}
              onClick={() => {
                clearTransitionTimer();
                emit("diagnostic_start");
                setScreen("question");
              }}
              type="button"
            >
              Começar meu diagnóstico
            </button>
          </div>
        )}

        {screen === "question" && question && (
          <div className={`${styles.panel} ${styles.question}`} style={{ "--background": `url('${question.background}')` } as CSSProperties}>
            <div className={styles.questionBody}>
              <p className={styles.counter}>Pergunta {questionIndex + 1} de {questions.length}</p>
              <h2 ref={headingRef} tabIndex={-1}>{question.title}</h2>
              <div className={styles.answers}>
                {question.options.map((option) => {
                  const selected = answers[question.fieldId] === option.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={selected ? styles.selected : ""}
                      key={option.id}
                      onClick={() => chooseAnswer(question.fieldId, option.id)}
                      type="button"
                    >
                      <span>{option.label}</span>
                      {selected ? <Check aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div className={`${styles.panel} ${styles.result}`}>
            <div className={styles.resultBody}>
              <p className={styles.eyebrow}>Seu diagnóstico</p>
              <h2 ref={headingRef} tabIndex={-1}>{diagnosis.title}</h2>
              <p className={styles.reaction}>{diagnosis.reaction}</p>
              <p className={styles.explanation}>{diagnosis.explanation}</p>
            </div>
            <div className={styles.resultActions}>
              <button
                className={styles.primary}
                onClick={() => {
                  clearTransitionTimer();
                  resetVideoUi();
                  emit("diagnostic_result_continue");
                  setScreen("video");
                }}
                type="button"
              >
                Continuar para o vídeo
              </button>
              <a
                className={styles.downloadAction}
                download="diagnostico-de-fechamento-nathalya.pdf"
                href="/downloads/diagnostico-de-fechamento-nathalya.pdf"
                onClick={() => {
                  emit("diagnostic_pdf_download");
                  setPdfOpened(true);
                }}
                rel="noreferrer"
                target="_blank"
              >
                {pdfOpened ? (
                  <>
                    <Check aria-hidden="true" /> PDF liberado
                  </>
                ) : (
                  <>
                    <Download aria-hidden="true" /> Baixar o diagnóstico em PDF
                  </>
                )}
              </a>
            </div>
          </div>
        )}

        {screen === "video" && (
          <div className={`${styles.panel} ${styles.videoPanel}${videoEnded ? ` ${styles.ended}` : ""}`}>
            <h2 className={styles.videoHeading} ref={headingRef} tabIndex={-1}>Vídeo</h2>
            <video
              onEnded={() => {
                setIsPlaying(false);
                setVideoEnded(true);
                emit("diagnostic_video_ended");
              }}
              onPause={() => setIsPlaying(false)}
              onPlay={() => {
                setIsPlaying(true);
                setHasPlayed(true);
                setVideoEnded(false);
                setPlayError(null);
              }}
              playsInline
              poster="/media/diagnostico-fechamento/poster.webp"
              preload="metadata"
              ref={videoRef}
            >
              <source src="/media/diagnostico-fechamento/diagnostico-fechamento-mobile.mp4" type="video/mp4" />
              <track default kind="captions" label="Português" src="/media/diagnostico-fechamento/diagnostico-fechamento.vtt" srcLang="pt-BR" />
            </video>
            {videoEnded ? <div className={styles.videoShade} /> : null}
            {!videoEnded && (
              <button
                aria-label={isPlaying ? "Pausar vídeo" : pausedLabel}
                className={`${styles.videoToggle}${isPlaying ? ` ${styles.playing}` : ""}`}
                onClick={() => {
                  void toggleVideo();
                }}
                type="button"
              >
                {!isPlaying && (
                  <>
                    <span className={styles.playGlyph}>
                      <Play aria-hidden="true" />
                    </span>
                    <span className={styles.playLabel}>
                      {!hasPlayed && <Volume2 aria-hidden="true" />}
                      {pausedLabel}
                    </span>
                  </>
                )}
                {playError ? <span className={styles.playError}>{playError}</span> : null}
              </button>
            )}
            {VIP_GROUP_URL ? (
              <div className={`${styles.videoAction}${videoEnded ? ` ${styles.promoted}` : ""}`}>
                <a
                  className={styles.primary}
                  href={VIP_GROUP_URL}
                  onClick={() => emit("vip_click")}
                  rel="noreferrer"
                  target="_blank"
                >
                  Entrar no Grupo VIP da masterclass
                </a>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.seoContent}>
        <p className={styles.eyebrow}>Diagnóstico de Fechamento</p>
        <h2>O que é o Diagnóstico de Fechamento?</h2>
        <p>É uma avaliação curta para profissionais de saúde e estética que se sentem inseguras ao falar preço, ouvir uma objeção ou pedir uma decisão. As respostas mostram qual reação aparece primeiro e indicam um comportamento simples para treinar.</p>
        <h2>Para quem é?</h2>
        <p>Para dentistas, médicas, profissionais de estética, fisioterapeutas, psicólogas, nutricionistas e outras profissionais que apresentam o próprio tratamento ou serviço.</p>
      </section>
    </main>
  );
}
