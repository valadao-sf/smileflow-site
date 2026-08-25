"use client";

import { type FormEvent, useState } from "react";

import { CONTACT_LABELS } from "./copy";
import type { ContactInfo } from "./types";

interface ContactProps {
  onSubmit: (contact: ContactInfo) => void;
}

export function Contact({ onSubmit }: ContactProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextName = name.trim();
    const nextWhatsapp = whatsapp.trim();
    if (!nextName || !nextWhatsapp) return;
    onSubmit({
      name: nextName,
      whatsapp: nextWhatsapp,
      instagram: instagram.trim(),
    });
  }

  const canContinue = name.trim().length > 0 && whatsapp.trim().length > 0;

  return (
    <section className="stack">
      <p className="brand">Nathálya</p>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{CONTACT_LABELS.name}</span>
          <input
            name="name"
            autoComplete="given-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{CONTACT_LABELS.whatsapp}</span>
          <input
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{CONTACT_LABELS.instagram}</span>
          <input
            name="instagram"
            autoComplete="username"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
        </label>
        <button className="cta" type="submit" disabled={!canContinue}>
          Continuar
        </button>
      </form>
    </section>
  );
}
