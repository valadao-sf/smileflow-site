"use client";

import { type FormEvent, useRef, useState } from "react";

import { CONSENT_LABEL, CONTACT_LABELS } from "./copy";
import type { ContactInfo } from "./types";

interface ContactProps {
  contact: ContactInfo;
  consentGranted: boolean;
  onChange: (contact: ContactInfo) => void;
  onConsentChange: (next: boolean) => void;
  onSubmit: (contact: ContactInfo) => void;
  onBack: () => void;
}

interface ContactErrors {
  name?: string;
  instagram?: string;
}

function sanitizeInstagram(value: string): string {
  let next = value.replace(/\s/g, "");
  next = next.replace(/^https?:\/\//i, "");
  next = next.replace(/^www\./i, "");
  next = next.replace(/^instagram\.com\//i, "");
  next = next.replace(/^@+/, "");
  return next;
}

function validateContact(contact: ContactInfo): ContactErrors {
  const errors: ContactErrors = {};
  if (contact.name.trim().length === 0) {
    errors.name = "Precisa do seu nome.";
  }
  if (contact.instagram.trim().length === 0) {
    errors.instagram = "Precisa do seu Instagram.";
  }
  return errors;
}

export function Contact({
  contact,
  consentGranted,
  onChange,
  onConsentChange,
  onSubmit,
  onBack,
}: ContactProps) {
  const [errors, setErrors] = useState<ContactErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const next: ContactInfo = {
      name: contact.name.trim(),
      instagram: sanitizeInstagram(contact.instagram),
    };
    const nextErrors = validateContact(next);
    setErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.instagram) {
      instagramRef.current?.focus();
      return;
    }
    onSubmit(next);
  }

  return (
    <section className="nath-stack nath-contact">
      <button type="button" className="sf-btn sf-btn--ghost" onClick={onBack}>
        Voltar
      </button>
      <div className="nath-contact__body">
        <h1 className="sf-page-title">Quem é você?</h1>
        <form className="sf-form" noValidate onSubmit={handleSubmit}>
          <div className="sf-field">
            <label className="sf-field__label" htmlFor="nath-name">
              {CONTACT_LABELS.name}
            </label>
            <input
              ref={nameRef}
              id="nath-name"
              className="sf-input sf-input--lg"
              name="name"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              value={contact.name}
              aria-invalid={Boolean(errors.name) || undefined}
              aria-describedby={errors.name ? "nath-name-error" : undefined}
              onChange={(event) => {
                const name = event.target.value;
                onChange({ ...contact, name });
                if (name.trim().length > 0) {
                  setErrors((current) => {
                    if (!current.name) return current;
                    const next = { ...current };
                    delete next.name;
                    return next;
                  });
                }
              }}
            />
            {errors.name ? (
              <div className="sf-field__error" id="nath-name-error" role="alert">
                {errors.name}
              </div>
            ) : null}
          </div>
          <div className="sf-field">
            <label className="sf-field__label" htmlFor="nath-instagram">
              {CONTACT_LABELS.instagram}
            </label>
            <div className="sf-input-group">
              <span className="sf-input-group__prefix">@</span>
              <input
                ref={instagramRef}
                id="nath-instagram"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                value={contact.instagram}
                aria-invalid={Boolean(errors.instagram) || undefined}
                aria-describedby={errors.instagram ? "nath-instagram-error" : undefined}
                onChange={(event) => {
                  const instagram = sanitizeInstagram(event.target.value);
                  onChange({ ...contact, instagram });
                  if (instagram.length > 0) {
                    setErrors((current) => {
                      if (!current.instagram) return current;
                      const next = { ...current };
                      delete next.instagram;
                      return next;
                    });
                  }
                }}
              />
            </div>
            {errors.instagram ? (
              <div className="sf-field__error" id="nath-instagram-error" role="alert">
                {errors.instagram}
              </div>
            ) : null}
          </div>
          <label className="nath-optout">
            <input
              type="checkbox"
              role="switch"
              checked={consentGranted}
              onChange={(event) => onConsentChange(event.target.checked)}
            />
            <span className="nath-optout__control" aria-hidden="true" />
            <span>{CONSENT_LABEL}</span>
          </label>
          <button className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block" type="submit">
            <span className="sf-btn__label">Continuar</span>
          </button>
        </form>
      </div>
    </section>
  );
}
