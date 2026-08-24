"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  AnswerId,
  NegotiationMomentConfig,
  NegotiationMomentStep,
} from "@/lib/marketing/negotiation-moments/types";

import {
  FeedbackStep,
  GiftStep,
  InsightStep,
  OfferStep,
  QuestionStep,
  SupportingContent,
  VideoStep,
} from "./Steps";
import styles from "./negotiation-moment.module.css";

const STEP_BACK: Record<NegotiationMomentStep, NegotiationMomentStep | null> = {
  video1: null,
  question1: "video1",
  feedback1: "question1",
  video2: "feedback1",
  insight1: "video2",
  question2: "insight1",
  feedback2: "question2",
  insight2: "feedback2",
  gift: "insight2",
  video4: "gift",
  cta: "video4",
};

function readAttribution() {
  if (typeof window === "undefined") return {};
  const search = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "creative"]
      .map((key) => [key, search.get(key)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function destinationWithAttribution(destination: string) {
  if (typeof window === "undefined") return destination;
  const target = new URL(destination, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  current.forEach((value, key) => {
    if (key.startsWith("utm_") || key === "creative" || key === "variant") {
      target.searchParams.set(key, value);
    }
  });
  return target.origin === window.location.origin
    ? `${target.pathname}${target.search}${target.hash}`
    : target.toString();
}

export function NegotiationMomentExperience({ config }: { config: NegotiationMomentConfig }) {
  const [step, setStep] = useState<NegotiationMomentStep>("video1");
  const [answers, setAnswers] = useState<Partial<Record<"question1" | "question2", AnswerId>>>({});
  const [mncHref, setMncHref] = useState(config.offer.destination);
  const [giftStatus, setGiftStatus] = useState("");
  const [guideReady, setGuideReady] = useState(false);
  const sentEvents = useRef(new Set<string>());
  const guideRef = useRef<HTMLDivElement>(null);
  const guideFilePromiseRef = useRef<Promise<File> | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const emit = useCallback((eventName: string, extra: Record<string, string> = {}, uniqueKey = eventName) => {
    if (typeof window === "undefined" || sentEvents.current.has(uniqueKey)) return;
    sentEvents.current.add(uniqueKey);
    const payload = {
      route: config.route,
      intent: config.intent,
      experiment_variant: config.experimentVariant,
      ...readAttribution(),
      ...extra,
    };
    const marketingWindow = window as Window & { fbq?: (...args: unknown[]) => void };
    try {
      marketingWindow.fbq?.("trackCustom", eventName, payload);
      window.dispatchEvent(new CustomEvent("smileflow:marketing", { detail: { eventName, ...payload } }));
    } catch {
      // Measurement must never block the experience.
    }
  }, [config]);

  useEffect(() => {
    setMncHref(destinationWithAttribution(config.offer.destination));
    emit("lp_view");
  }, [config.offer.destination, emit]);

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    stageRef.current?.focus({ preventScroll: true });
  }, [step]);

  const chooseAnswer = useCallback((question: "question1" | "question2", answer: AnswerId) => {
    const previous = answers[question];
    setAnswers((current) => ({ ...current, [question]: answer }));
    if (previous !== answer) {
      const eventName = question === "question1" ? "q1_answer" : "q2_answer";
      emit(eventName, { answer }, `${eventName}:${answer}`);
    }
    setStep(question === "question1" ? "feedback1" : "feedback2");
  }, [answers, emit]);

  const buildGuideFile = useCallback(() => {
    if (guideFilePromiseRef.current) return guideFilePromiseRef.current;

    const promise = (async () => {
      if (!guideRef.current) throw new Error("Guide is not mounted");
      const { toBlob } = await import("html-to-image");
      const exportNode = guideRef.current.cloneNode(true) as HTMLDivElement;
      exportNode.dataset.exporting = "true";
      Object.assign(exportNode.style, {
        position: "fixed",
        left: "0",
        top: "0",
        zIndex: "-1",
        pointerEvents: "none",
        width: "540px",
        height: "675px",
        maxWidth: "none",
        aspectRatio: "auto",
      });
      document.body.append(exportNode);
      try {
        const backgroundColor = getComputedStyle(exportNode).backgroundColor;
        const blob = await toBlob(exportNode, {
          width: 540,
          height: 675,
          pixelRatio: 2,
          backgroundColor,
          skipFonts: true,
        });
        if (!blob) throw new Error("Guide image is empty");
        return new File([blob], config.gift.fileName, { type: "image/png" });
      } finally {
        exportNode.remove();
      }
    })();

    guideFilePromiseRef.current = promise;
    promise.catch(() => {
      guideFilePromiseRef.current = null;
    });
    return promise;
  }, [config.gift.fileName]);

  useEffect(() => {
    if (step !== "gift") return;
    let active = true;
    setGuideReady(false);
    setGiftStatus("Preparando a imagem…");
    const frame = window.requestAnimationFrame(() => {
      void buildGuideFile()
        .then(() => {
          if (!active) return;
          setGuideReady(true);
          setGiftStatus("");
        })
        .catch(() => {
          if (!active) return;
          setGuideReady(true);
          setGiftStatus("Não deu para preparar agora. Toque em Salvar para tentar de novo.");
        });
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, [buildGuideFile, step]);

  const saveGuide = useCallback(async () => {
    try {
      setGiftStatus("Preparando a imagem…");
      const file = await buildGuideFile();
      const canShareFile = typeof navigator.canShare === "function"
        && typeof navigator.share === "function"
        && navigator.canShare({ files: [file] });

      if (canShareFile) {
        setGiftStatus("Escolha “Salvar Imagem” no menu do celular.");
        await navigator.share({ files: [file], title: config.gift.title });
        setGiftStatus("Imagem enviada ao menu do celular.");
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.download = file.name;
        link.href = url;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        setGiftStatus("Imagem baixada. Veja a pasta Downloads.");
      }
      emit("guide_save");
    } catch {
      setGiftStatus("Não deu para salvar. Tente compartilhar a imagem.");
    }
  }, [buildGuideFile, config.gift.title, emit]);

  const shareGuide = useCallback(async () => {
    try {
      setGiftStatus("Preparando a imagem…");
      const file = await buildGuideFile();
      const canShareFile = typeof navigator.canShare === "function"
        && typeof navigator.share === "function"
        && navigator.canShare({ files: [file] });
      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: config.gift.title,
          text: `${config.gift.rule}\n\n${window.location.href}`,
        });
        setGiftStatus("Imagem compartilhada.");
      } else if (typeof navigator.share === "function") {
        await navigator.share({
          title: config.gift.title,
          text: config.gift.rule,
          url: window.location.href,
        });
        setGiftStatus("Link compartilhado.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setGiftStatus("Link copiado.");
      }
      emit("guide_share");
    } catch {
      setGiftStatus("O compartilhamento foi cancelado.");
    }
  }, [buildGuideFile, config.gift.rule, config.gift.title, emit]);

  const current = useMemo(() => {
    switch (step) {
      case "video1":
        return <VideoStep video={config.video1} visibleTitle={config.visibleTitle} onPlay={() => emit("video1_play")} onAction={() => { emit("experience_start"); setStep("question1"); }} />;
      case "question1":
        return <QuestionStep question={config.question1} selected={answers.question1} onSelect={(answer) => chooseAnswer("question1", answer)} />;
      case "feedback1":
        return <FeedbackStep question={config.question1} answer={answers.question1 ?? "a"} onAction={() => setStep("video2")} />;
      case "video2":
        return <VideoStep video={config.video2} onPlay={() => emit("video2_play")} onAction={() => setStep("insight1")} />;
      case "insight1":
        return <InsightStep insight={config.insight1} onAction={() => setStep("question2")} />;
      case "question2":
        return <QuestionStep question={config.question2} selected={answers.question2} onSelect={(answer) => chooseAnswer("question2", answer)} />;
      case "feedback2":
        return <FeedbackStep question={config.question2} answer={answers.question2 ?? "a"} onAction={() => setStep("insight2")} />;
      case "insight2":
        return <InsightStep insight={config.insight2} onAction={() => { emit("guide_open"); setStep("gift"); }} />;
      case "gift":
        return <GiftStep gift={config.gift} guideRef={guideRef} ready={guideReady} status={giftStatus} onSave={saveGuide} onShare={shareGuide} onContinue={() => setStep("video4")} />;
      case "video4":
        return <VideoStep video={config.video4} onPlay={() => emit("video4_play")} onAction={() => setStep("cta")} />;
      case "cta":
        return <OfferStep offer={config.offer} href={mncHref} onClick={() => emit("mnc_click", { destination: mncHref })} />;
    }
  }, [answers, chooseAnswer, config, emit, giftStatus, guideReady, mncHref, saveGuide, shareGuide, step]);

  const isVideoStep = step === "video1" || step === "video2" || step === "video4";

  return (
    <main className={styles.experience} data-mode="story">
      <div className={`${styles.stage} ${isVideoStep ? styles.videoStage : ""}`} data-testid="negotiation-stage">
        <header className={styles.topbar}>
          {STEP_BACK[step] ? (
            <button aria-label="Voltar" className={styles.backButton} onClick={() => setStep(STEP_BACK[step] ?? "video1")} type="button">←</button>
          ) : <span className={styles.backSpacer} aria-hidden="true" />}
          <span className={styles.brand}>SmileFlow</span>
        </header>
        <div className={styles.stageContent} key={step} ref={stageRef} tabIndex={-1}>
          {current}
        </div>
      </div>
      <SupportingContent content={config.supportingContent} />
    </main>
  );
}
