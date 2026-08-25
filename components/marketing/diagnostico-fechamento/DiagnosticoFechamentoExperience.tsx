"use client";

import { ArrowLeft, Download, Pause, Play, Share2, Volume2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { buildDiagnosis, contactFields, questions, VIP_GROUP_URL } from "@/lib/marketing/diagnostico-fechamento";

import styles from "./diagnostico-fechamento.module.css";

type Screen = "opening" | "question" | "contact" | "result" | "video";

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

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

async function submitToTally(responses: Record<string, string>) {
  const response = await fetch("/api/diagnostico-de-fechamento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });
  if (!response.ok) throw new Error("Diagnostic submission failed");
}

export function DiagnosticoFechamentoExperience() {
  const [screen, setScreen] = useState<Screen>("opening");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimer = useRef<number | undefined>(undefined);

  const question = questions[questionIndex];
  const diagnosis = useMemo(() => buildDiagnosis(answers), [answers]);

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  const goBack = useCallback(() => {
    setError("");
    if (screen === "question") {
      if (questionIndex === 0) setScreen("opening");
      else setQuestionIndex((current) => current - 1);
    } else if (screen === "contact") {
      setScreen("question");
      setQuestionIndex(questions.length - 1);
    } else if (screen === "result") setScreen("contact");
    else if (screen === "video") setScreen("result");
  }, [questionIndex, screen]);

  const chooseAnswer = useCallback((fieldId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [fieldId]: optionId }));
    emit("diagnostic_answer", { question: questions[questionIndex].id, answer: optionId });
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (questionIndex < questions.length - 1) setQuestionIndex((current) => current + 1);
      else setScreen("contact");
    }, 150);
  }, [questionIndex]);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const normalizedPhone = normalizePhone(phone);
    if (name.trim().length < 2) {
      setError("Escreva seu nome para continuar.");
      return;
    }
    if (normalizedPhone.length < 12 || normalizedPhone.length > 13) {
      setError("Confira o WhatsApp e inclua o DDD.");
      return;
    }
    setSending(true);
    try {
      await submitToTally({
        ...answers,
        [contactFields.name]: name.trim(),
        [contactFields.phone]: `+${normalizedPhone}`,
      });
      emit("diagnostic_submit");
      setScreen("result");
    } catch {
      setError("Não consegui enviar agora. Tente mais uma vez.");
    } finally {
      setSending(false);
    }
  }, [answers, name, phone]);

  const buildResultFile = useCallback(async () => {
    if (!resultCardRef.current) throw new Error("Result card unavailable");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(resultCardRef.current, {
      width: 360,
      height: 450,
      pixelRatio: 3,
      backgroundColor: "#211d1b",
      skipFonts: true,
    });
    if (!blob) throw new Error("Image unavailable");
    return new File([blob], "meu-diagnostico-de-fechamento.png", { type: "image/png" });
  }, []);

  const saveResult = useCallback(async () => {
    try {
      setSaveStatus("Preparando sua imagem…");
      const file = await buildResultFile();
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        setSaveStatus("Escolha Salvar Imagem no menu do celular.");
        await navigator.share({ files: [file], title: "Meu Diagnóstico de Fechamento" });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        setSaveStatus("Imagem salva na pasta Downloads.");
      }
      emit("diagnostic_save");
    } catch (caught) {
      if ((caught as DOMException).name !== "AbortError") setSaveStatus("Não deu para salvar. Tente de novo.");
    }
  }, [buildResultFile]);

  const shareResult = useCallback(async () => {
    try {
      const file = await buildResultFile();
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Meu Diagnóstico de Fechamento" });
      } else if (navigator.share) {
        await navigator.share({ title: "Diagnóstico de Fechamento", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setSaveStatus("Link copiado.");
      }
      emit("diagnostic_share");
    } catch (caught) {
      if ((caught as DOMException).name !== "AbortError") setSaveStatus("Não deu para compartilhar agora.");
    }
  }, [buildResultFile]);

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
          <div className={`${styles.panel} ${styles.opening}`} style={{ "--background": "url('/images/diagnostico-fechamento/opening.webp')" } as CSSProperties}>
            <div className={styles.openingBody}>
              <p className={styles.eyebrow}>Diagnóstico de Fechamento</p>
              <h1>O que acontece com você na hora de falar o preço?</h1>
              <p>Em cerca de 2 minutos, descubra o que faz você recuar nessa conversa e o primeiro comportamento para treinar.</p>
              <p className={styles.support}>Resultado na hora. Gratuito.</p>
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
              <div className={`${styles.answers} ${question.compact ? styles.compactAnswers : ""}`}>
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

        {screen === "contact" && (
          <div className={`${styles.panel} ${styles.contact}`} style={{ "--background": "url('/images/diagnostico-fechamento/contact.webp')" } as CSSProperties}>
            <form onSubmit={submit}>
              <p className={styles.eyebrow}>Falta pouco</p>
              <h2>Seu diagnóstico está quase pronto.</h2>
              <p>Diga seu nome e informe seu WhatsApp. A Nathálya recebe tudo junto com as suas respostas.</p>
              <label>
                Como você se chama?
                <input autoComplete="name" name="name" onChange={(event) => setName(event.target.value)} required value={name} />
              </label>
              <label>
                Qual é o seu WhatsApp com DDD?
                <input autoComplete="tel" inputMode="tel" name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="(11) 99999-9999" required value={phone} />
              </label>
              <p className={styles.privacy}>Seus dados ficam com a SmileFlow.</p>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.primary} disabled={sending} type="submit">{sending ? "Preparando…" : "Ver meu diagnóstico"}</button>
            </form>
          </div>
        )}

        {screen === "result" && (
          <div className={`${styles.panel} ${styles.result}`}>
            <div className={styles.resultCard} ref={resultCardRef}>
              <p className={styles.resultBrand}>SmileFlow · Nathálya</p>
              <p className={styles.eyebrow}>Seu diagnóstico rápido</p>
              <p className={styles.resultLabel}>Seu principal ponto de atenção é:</p>
              <h2>{diagnosis.title}</h2>
              <p>{diagnosis.reaction}</p>
              <div className={styles.correction}>
                <span>O primeiro passo</span>
                <strong>{diagnosis.correction}</strong>
              </div>
              <p className={styles.rule}>{diagnosis.rule}</p>
              <small>smileflow.com.br</small>
            </div>
            <div className={styles.resultActions}>
              <button onClick={saveResult} type="button"><Download aria-hidden="true" /> Salvar</button>
              <button onClick={shareResult} type="button"><Share2 aria-hidden="true" /> Compartilhar</button>
              <button className={styles.primary} onClick={() => { emit("diagnostic_result_continue"); setScreen("video"); }} type="button">Ver Nathálya explicar</button>
              {saveStatus && <p className={styles.status}>{saveStatus}</p>}
            </div>
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
