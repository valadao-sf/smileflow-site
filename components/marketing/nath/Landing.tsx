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
    <section className="stack">
      <p className="brand">Nathálya</p>
      <h1>{LANDING_TITLE}</h1>
      <p className="lede">{LANDING_BODY}</p>
      {showBrowserHint ? (
        <p className="alert" role="note">
          {INSTAGRAM_BROWSER_HINT}
        </p>
      ) : null}
      <hr className="rule" />
      <div className="thread">
        {LANDING_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={option.enabled ? "note note--current" : "note"}
            onClick={option.enabled && !showBrowserHint ? onAsk : undefined}
            disabled={!option.enabled || showBrowserHint}
          >
            <div className="note__kicker">
              <span className="note__index">{option.id.toUpperCase()}</span>
              {option.enabled ? null : <span className="badge">Em breve</span>}
            </div>
            <span className="note__title">{option.title}</span>
            <span className="note__body">{option.body}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
