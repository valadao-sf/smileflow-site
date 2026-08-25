"use client";

import { useEffect, useState } from "react";

import {
  INSTAGRAM_BROWSER_HINT,
  LANDING_BODY,
  LANDING_OPTIONS,
  LANDING_TITLE,
} from "./copy";
import { isInstagramWebview } from "./in-app-browser";

interface LandingProps {
  onAsk: () => void;
}

export function Landing({ onAsk }: LandingProps) {
  const [showBrowserHint, setShowBrowserHint] = useState(false);

  useEffect(() => {
    setShowBrowserHint(isInstagramWebview());
  }, []);

  return (
    <section className="nath-stack">
      <header className="nath-top">
        <p className="nath-brand">Nathálya</p>
        <span className="nath-alpha">alpha</span>
      </header>
      <h1 className="sf-page-title">{LANDING_TITLE}</h1>
      <p className="nath-lede">{LANDING_BODY}</p>
      {showBrowserHint ? (
        <div className="sf-notice sf-notice--warning" role="note">
          <div className="sf-notice__body">{INSTAGRAM_BROWSER_HINT}</div>
        </div>
      ) : null}
      <button
        type="button"
        className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block"
        onClick={showBrowserHint ? undefined : onAsk}
        disabled={showBrowserHint}
      >
        <span className="sf-btn__label">{LANDING_OPTIONS[0].title}</span>
      </button>
    </section>
  );
}
