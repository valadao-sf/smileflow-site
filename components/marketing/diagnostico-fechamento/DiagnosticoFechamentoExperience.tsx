"use client";

import { ArrowLeft, Download, Pause, Play, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { buildDiagnosis, questions, VIP_GROUP_URL } from "@/lib/marketing/diagnostico-fechamento";

import styles from "./diagnostico-fechamento.module.css";

type Screen = "opening" | "question" | "gift" | "result" | "video";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimer = useRef<number | undefined>(undefined);

  const question = questions[questionIndex];
  const diagnosis = useMemo(() => buildDiagnosis(answers), [answers]);

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  const goBack = useCallback(() => {
    if (screen === "question") {
      if (questionIndex === 0) setScreen("opening");
      else setQuestionIndex((current) => current - 1);
    } else if (screen === "gift") {
      setScreen("question");
      setQuestionIndex(questions.length - 1);
    } else if (screen === "result") setScreen("gift");
    else if (screen === "video") setScreen("result");
  }, [questionIndex, screen]);

  const chooseAnswer = useCallback((fieldId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [fieldId]: optionId }));
    emit("diagnostic_answer", { question: questions[questionIndex].id, answer: optionId });
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (questionIndex < questions.length - 1) setQuestionIndex((current) => current + 1);
      else setScreen("gift");
    }, 150);
  }, [questionIndex]);

  const toggleVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setIsPlaying(true);
      emit("diagnostic_video_play");
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-live="polite">
        {screen !== "opening" && (
          <button className={styles.back} onClick={goBack} type="button" aria-label="Voltar">
            <ArrowLeft aria-hidden="true" />
          </button>
        )}
        <span className={styles.brand}>SmileFlow</span>

        {screen === "opening" && (
          <div className={`${styles.panel} ${styles.opening}`}>
            <div className={styles.openingBody}>
              <img className={styles.openingPortrait} src="/images/diagnostico-fechamento/nathalya.webp" alt="Nathálya Mello" />
              <p className={styles.eyebrow}>Diagnóstico de Fechamento</p>
              <h1>O que acontece com você na hora de falar o preço?</h1>
              <p>Responda três perguntas rápidas. Você vai entender o que faz você recuar e recebe na hora o PDF da Nathálya.</p>
              <p className={styles.support}>Sem cadastro. Gratuito.</p>
            </div>
            <button className={styles.primary} onClick={() => { emit("diagnostic_start"); setScreen("question"); }} type="button">
              Começar meu diagnóstico
            </button>
          </div>
        )}

        {screen === "question" && question && (
          <div className={`${styles.panel} ${styles.question}`} style={{ "--background": `url('${question.background}')` } as CSSProperties}>
            <div className={styles.questionBody}>
              <p className={styles.counter}>Pergunta {questionIndex + 1} de {questions.length}</p>
              <h2>{question.title}</h2>
              <div className={styles.answers}>
                {question.options.map((option) => (
                  <button
                    className={answers[question.fieldId] === option.id ? styles.selected : ""}
                    key={option.id}
                    onClick={() => chooseAnswer(question.fieldId, option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === "gift" && (
          <div className={`${styles.panel} ${styles.gift}`}>
            <div className={styles.giftBody}>
              <img className={styles.pdfCover} src="/images/diagnostico-fechamento/pdf-cover.webp" alt="Capa do PDF Diagnóstico de Fechamento" />
              <div className={styles.giftCopy}>
                <p className={styles.eyebrow}>Seu presente está pronto</p>
                <h2>Baixe agora o Diagnóstico de Fechamento da Nathálya.</h2>
                <p>São 17 páginas para reconhecer seu jeito de falar preço, os erros que fazem você recuar e uma mudança simples para testar.</p>
              </div>
            </div>
            <div className={styles.giftActions}>
              <a
                className={styles.primary}
                download="diagnostico-de-fechamento-nathalya.pdf"
                href="/downloads/diagnostico-de-fechamento-nathalya.pdf"
                onClick={() => emit("diagnostic_pdf_download")}
              >
                <Download aria-hidden="true" /> Baixar meu PDF
              </a>
              <button className={styles.secondary} onClick={() => { emit("diagnostic_gift_continue"); setScreen("result"); }} type="button">
                Continuar e entender minhas respostas
              </button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div className={`${styles.panel} ${styles.result}`}>
            <div className={styles.resultCard}>
              <p className={styles.resultBrand}>SmileFlow · Nathálya</p>
              <p className={styles.eyebrow}>O que suas respostas mostram</p>
              <p className={styles.resultIntro}>O PDF mostra os três comportamentos mais comuns. Nas suas respostas, este foi o medo que mais apareceu:</p>
              <h2>{diagnosis.title}</h2>
              <p>{diagnosis.reaction}</p>
              <div className={styles.correction}>
                <span>O primeiro passo</span>
                <strong>{diagnosis.correction}</strong>
              </div>
              <p className={styles.rule}>{diagnosis.rule}</p>
              <small>smileflow.com.br</small>
            </div>
            <button className={styles.primary} onClick={() => { emit("diagnostic_result_continue"); setScreen("video"); }} type="button">
              Ver Nathálya explicar
            </button>
          </div>
        )}

        {screen === "video" && (
          <div className={`${styles.panel} ${styles.videoPanel}`}>
            <video
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              playsInline
              poster="/media/diagnostico-fechamento/poster.webp"
              preload="metadata"
              ref={videoRef}
            >
              <source src="/media/diagnostico-fechamento/diagnostico-fechamento-mobile.mp4" type="video/mp4" />
              <track default kind="captions" label="Português" src="/media/diagnostico-fechamento/diagnostico-fechamento.vtt" srcLang="pt-BR" />
            </video>
            <button className={`${styles.videoToggle} ${isPlaying ? styles.playing : ""}`} onClick={toggleVideo} type="button" aria-label={isPlaying ? "Pausar vídeo" : "Assistir ao vídeo"}>
              {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
            {!isPlaying && <p className={styles.playLabel}><Volume2 aria-hidden="true" /> Toque para assistir com som</p>}
            <div className={styles.videoAction}>
              {VIP_GROUP_URL ? (
                <a className={styles.primary} href={VIP_GROUP_URL} onClick={() => emit("vip_click")} rel="noreferrer">Entrar no Grupo VIP da masterclass</a>
              ) : (
                <button className={styles.primary} disabled type="button">Link do Grupo VIP em breve</button>
              )}
            </div>
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
