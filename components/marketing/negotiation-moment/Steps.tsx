import { useState, type RefObject } from "react";
import { ArrowRight, Download, Share2 } from "lucide-react";

import type {
  AnswerId,
  GuideMoment,
  InsightMoment,
  QuestionMoment,
  SupportingContent as SupportingContentData,
  VideoMoment,
} from "@/lib/marketing/negotiation-moments/types";

import styles from "./negotiation-moment.module.css";

interface VideoStepProps {
  video: VideoMoment;
  visibleTitle?: string;
  onAction: () => void;
  onPlay: () => void;
}

export function VideoStep({ video, visibleTitle, onAction, onPlay }: VideoStepProps) {
  const hasVideo = Boolean(video.asset.src);
  const [muted, setMuted] = useState(true);

  return (
    <section className={styles.videoStep} data-state={video.id}>
      <div className={styles.mediaShell} data-asset-id={video.assetId}>
        {hasVideo ? (
          <video
            aria-label={`Vídeo: ${video.title}`}
            autoPlay
            className={styles.video}
            muted={muted}
            onPlay={onPlay}
            playsInline
            poster={video.asset.poster}
            preload="metadata"
          >
            <source src={video.asset.src} />
            {video.asset.captions ? (
              <track default kind="captions" label="Português" src={video.asset.captions} srcLang="pt-BR" />
            ) : null}
          </video>
        ) : video.asset.poster ? (
          <img alt="" aria-hidden="true" className={styles.poster} src={video.asset.poster} />
        ) : (
          <div className={styles.mediaPlaceholder} role="img" aria-label="Espaço reservado para o vídeo da Nathálya">
            <div className={styles.mediaMark} aria-hidden="true">N</div>
            {process.env.NODE_ENV !== "production" ? (
              <code className={styles.assetId}>{video.assetId}</code>
            ) : null}
          </div>
        )}

        <div className={styles.videoShade} aria-hidden="true" />
        <p className={styles.productionBadge}>{hasVideo ? "Nathálya" : "Vídeo em produção"}</p>
        {hasVideo ? (
          <button
            aria-label={muted ? "Ativar som do vídeo" : "Desativar som do vídeo"}
            aria-pressed={!muted}
            className={styles.soundButton}
            onClick={() => setMuted((current) => !current)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 9v6h4l5 4V5L8 9H4Z" />
              {muted ? <path d="m17 9 4 6m0-6-4 6" /> : <path d="M17 8.5a5 5 0 0 1 0 7" />}
            </svg>
            <span>{muted ? "Ouvir" : "Com som"}</span>
          </button>
        ) : null}

        <div className={styles.videoOverlay}>
          <p className={styles.eyebrow}>{video.eyebrow}</p>
          {visibleTitle ? <h1 className={styles.pageTitle}>{visibleTitle}</h1> : <h2 className={styles.pageTitle}>{video.title}</h2>}
          {video.body ? <p className={styles.videoBody}>{video.body}</p> : null}
          <button className={styles.primaryAction} onClick={onAction} type="button">
            {video.actionLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

interface QuestionStepProps {
  question: QuestionMoment;
  selected?: AnswerId;
  onSelect: (answer: AnswerId) => void;
}

export function QuestionStep({ question, selected, onSelect }: QuestionStepProps) {
  return (
    <fieldset className={`${styles.step} ${styles.questionStep}`} data-state={question.id}>
      <div className={styles.questionBody}>
        <div className={styles.patientQuote}>
          <span>{question.speaker}</span>
          <q>{question.quote}</q>
        </div>
        <legend className={styles.questionTitle}>{question.prompt}</legend>
        <div className={styles.answers}>
          {question.options.map((option) => (
            <button
              aria-pressed={selected === option.id}
              className={styles.answer}
              data-answer={option.id}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

interface FeedbackStepProps {
  question: QuestionMoment;
  answer: AnswerId;
  onAction: () => void;
}

export function FeedbackStep({ question, answer, onAction }: FeedbackStepProps) {
  const feedback = question.options.find((option) => option.id === answer)?.feedback;
  if (!feedback) return null;

  return (
    <section aria-live="polite" className={`${styles.step} ${styles.feedbackStep}`} data-state={`feedback-${question.id}`}>
      <div className={styles.feedbackBody}>
        <div className={styles.patientQuote}>
          <span>{question.speaker}</span>
          <q>{question.quote}</q>
        </div>
        <div className={styles.feedbackCard}>
          <p className={styles.feedbackBy}>Nathálya</p>
          <h2>{feedback.title}</h2>
          <p>{feedback.body}</p>
        </div>
      </div>
      <div className={styles.actionArea}>
        <button className={styles.primaryAction} onClick={onAction} type="button">
          {question.feedbackAction}
        </button>
      </div>
    </section>
  );
}

interface InsightStepProps {
  insight: InsightMoment;
  onAction: () => void;
}

export function InsightStep({ insight, onAction }: InsightStepProps) {
  return (
    <section className={`${styles.step} ${styles.insightStep}`} data-state={insight.id}>
      <div className={styles.insightBody}>
        <p className={styles.eyebrow}>{insight.eyebrow}</p>
        <h2>{insight.title}</h2>
        <div className={styles.insightCopy}>
          {insight.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className={styles.readyPhrase}>
          <span>Você pode perguntar assim</span>
          <q>{insight.phrase}</q>
        </div>
      </div>
      <div className={styles.actionArea}>
        <button className={styles.primaryAction} onClick={onAction} type="button">
          {insight.actionLabel}
        </button>
      </div>
    </section>
  );
}

interface GiftStepProps {
  gift: GuideMoment;
  guideRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
  status: string;
  onSave: () => void;
  onShare: () => void;
  onContinue: () => void;
}

export function GiftStep({ gift, guideRef, ready, status, onSave, onShare, onContinue }: GiftStepProps) {
  return (
    <section className={`${styles.step} ${styles.giftStep}`} data-state="gift">
      <div className={styles.guideIntro}>
        <h1>{gift.title}</h1>
      </div>

      <div className={styles.guidePreviewArea}>
        <div className={styles.guideFrame}>
          <div className={styles.guideCard} ref={guideRef} data-guide-card>
            <header className={styles.guideHeader}>
              <p className={styles.guideBrand}>Nathálya · SmileFlow</p>
              <p className={styles.guideSubtitle}>{gift.subtitle}</p>
              <h2>{gift.title}</h2>
              <p className={styles.guideIntroCopy}>{gift.intro}</p>
            </header>
            <ol className={styles.guidePhrases}>
              {gift.phrases.map((phrase, index) => (
                <li key={phrase}>
                  <span>{index + 1}</span>
                  <q>{phrase}</q>
                </li>
              ))}
            </ol>
            <div className={styles.guideRule}>
              <span>Guarde esta regra</span>
              <strong>{gift.rule}</strong>
            </div>
            <p className={styles.guideUrl}>smileflow.com.br/quando-acham-caro</p>
          </div>
        </div>
      </div>

      <div className={styles.giftActionDock}>
        <p aria-live="polite" className={styles.actionStatus}>{status}</p>
        <div aria-label="Ações do guia" className={styles.giftActions}>
          <button className={styles.guideAction} disabled={!ready} onClick={onSave} type="button">
            <Download aria-hidden="true" size={21} strokeWidth={2} />
            <span>{ready ? "Salvar" : "Preparando"}</span>
          </button>
          <button className={styles.guideAction} disabled={!ready} onClick={onShare} type="button">
            <Share2 aria-hidden="true" size={21} strokeWidth={2} />
            <span>Compartilhar</span>
          </button>
          <button className={`${styles.guideAction} ${styles.guideActionPrimary}`} onClick={onContinue} type="button">
            <ArrowRight aria-hidden="true" size={21} strokeWidth={2.2} />
            <span>Continuar</span>
          </button>
        </div>
      </div>
    </section>
  );
}

interface SupportingContentProps {
  content: SupportingContentData;
}

export function SupportingContent({ content }: SupportingContentProps) {
  return (
    <article className={styles.supportingContent} aria-label="Explicação complementar">
      <section>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h2>{content.title}</h2>
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
      <section className={styles.supportingAction}>
        <h2>{content.actionTitle}</h2>
        <p>{content.actionParagraphs[0]}</p>
        <blockquote>{content.phrase}</blockquote>
        <p>{content.actionParagraphs[1]}</p>
      </section>
      <section className={styles.faq}>
        <h2>Perguntas frequentes</h2>
        {content.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </article>
  );
}

interface OfferStepProps {
  offer: {
    eyebrow: string;
    title: string;
    body: string;
    product: string;
    detail: string;
    actionLabel: string;
  };
  href: string;
  onClick: () => void;
}

export function OfferStep({ offer, href, onClick }: OfferStepProps) {
  return (
    <section className={`${styles.step} ${styles.offerStep}`} data-state="cta">
      <div className={styles.offerBody}>
        <p className={styles.eyebrow}>{offer.eyebrow}</p>
        <h1>{offer.title}</h1>
        <p className={styles.offerLead}>{offer.body}</p>
        <div className={styles.methodCard}>
          <span>{offer.product}</span>
          <strong>{offer.detail}</strong>
        </div>
      </div>
      <div className={styles.actionArea}>
        <a className={styles.primaryAction} href={href} onClick={onClick}>{offer.actionLabel}</a>
      </div>
    </section>
  );
}
