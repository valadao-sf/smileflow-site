"use client";

import { useState } from "react";

import { CONSENT_LABEL } from "./copy";

interface ConsentProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function Consent({ onBack, onConfirm }: ConsentProps) {
  const [checked, setChecked] = useState(false);

  return (
    <section className="nath-stack">
      <button type="button" className="sf-btn sf-btn--ghost" onClick={onBack}>
        Voltar
      </button>
      <label className="sf-choice sf-choice--checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span className="sf-choice__control" aria-hidden="true" />
        <span>{CONSENT_LABEL}</span>
      </label>
      <button
        type="button"
        className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block"
        disabled={!checked}
        onClick={onConfirm}
      >
        <span className="sf-btn__label">Continuar</span>
      </button>
    </section>
  );
}
