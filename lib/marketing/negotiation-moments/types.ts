export type AnswerId = "a" | "b" | "c";

export type NegotiationMomentStep =
  | "video1"
  | "question1"
  | "feedback1"
  | "video2"
  | "insight1"
  | "question2"
  | "feedback2"
  | "insight2"
  | "gift"
  | "video4"
  | "cta";

export interface VideoAsset {
  src?: string;
  poster?: string;
  captions?: string;
}

export interface VideoMoment {
  id: "video1" | "video2" | "video4";
  assetId: string;
  eyebrow: string;
  title: string;
  body?: string;
  transcript: string[];
  actionLabel: string;
  asset: VideoAsset;
}

export interface AnswerOption {
  id: AnswerId;
  label: string;
  feedback: {
    title: string;
    body: string;
  };
}

export interface QuestionMoment {
  id: "question1" | "question2";
  speaker: string;
  quote: string;
  prompt: string;
  options: AnswerOption[];
  feedbackAction: string;
}

export interface InsightMoment {
  id: "insight1" | "insight2";
  eyebrow: string;
  title: string;
  body: string[];
  phrase: string;
  actionLabel: string;
}

export interface GuideMoment {
  title: string;
  subtitle: string;
  intro: string;
  phrases: string[];
  rule: string;
  fileName: string;
}

export interface SupportingContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  actionTitle: string;
  actionParagraphs: string[];
  phrase: string;
  faq: Array<{ question: string; answer: string }>;
}

export interface NegotiationMomentConfig {
  slug: string;
  route: string;
  intent: string;
  experimentVariant: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
  };
  visibleTitle: string;
  video1: VideoMoment;
  question1: QuestionMoment;
  video2: VideoMoment;
  insight1: InsightMoment;
  question2: QuestionMoment;
  insight2: InsightMoment;
  gift: GuideMoment;
  video4: VideoMoment;
  supportingContent: SupportingContent;
  offer: {
    eyebrow: string;
    title: string;
    body: string;
    product: string;
    detail: string;
    actionLabel: string;
    destination: string;
  };
}
