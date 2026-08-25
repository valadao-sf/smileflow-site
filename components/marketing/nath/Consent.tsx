"use client";

import { useState } from "react";

import { CONSENT_LABEL } from "./copy";

interface ConsentProps {
  onConfirm: () => void;
}

export function Consent({ onConfirm }: ConsentProps) {
  const [checked, setChecked] = useState(false);

  return (
    <section className="stack">
      <p className="brand">Nathálya</p>
      <label className="consent">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span>{CONSENT_LABEL}</span>
      </label>
      <button type="button" className="cta" disabled={!checked} onClick={onConfirm}>
        Continuar
      </button>
    </section>
  );
}
