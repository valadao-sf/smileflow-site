"use client";

import {
  LANDING_BODY,
  LANDING_OPTIONS,
  LANDING_TITLE,
} from "./copy";

interface LandingProps {
  onAsk: () => void;
}

export function Landing({ onAsk }: LandingProps) {
  return (
    <section className="nath-stack">
      <header className="nath-top">
        <p className="nath-brand">Nathálya</p>
        <span className="nath-alpha">alpha</span>
      </header>
      <h1 className="sf-page-title">{LANDING_TITLE}</h1>
      <p className="nath-lede">{LANDING_BODY}</p>
      <button
        type="button"
        className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block"
        onClick={onAsk}
      >
        <span className="sf-btn__label">{LANDING_OPTIONS[0].title}</span>
      </button>
    </section>
  );
}
