"use client";

import { type FormEvent, useRef, useState } from "react";

import { CONTACT_LABELS } from "./copy";
import type { ContactInfo } from "./types";

interface ContactProps {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
  onSubmit: (contact: ContactInfo) => void;
  onBack: () => void;
}

interface ContactErrors {
  name?: string;
  whatsapp?: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatWhatsappMask(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length <= 6) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
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
  const digits = digitsOnly(contact.whatsapp);
  if (digits.length !== 10 && digits.length !== 11) {
    errors.whatsapp = "Confere o número — precisa de DDD + número.";
  }
  return errors;
}

export function Contact({ contact, onChange, onSubmit, onBack }: ContactProps) {
  const [errors, setErrors] = useState<ContactErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);

  function handleWhatsappChange(value: string): void {
    const formattedPrev = formatWhatsappMask(contact.whatsapp);
    let nextDigits = digitsOnly(value);
    if (value.length < formattedPrev.length && nextDigits.length === contact.whatsapp.length) {
      nextDigits = contact.whatsapp.slice(0, -1);
    }
    onChange({ ...contact, whatsapp: nextDigits });
    if (nextDigits.length === 10 || nextDigits.length === 11) {
      setErrors((current) => {
        if (!current.whatsapp) return current;
        const next = { ...current };
        delete next.whatsapp;
        return next;
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const next: ContactInfo = {
      name: contact.name.trim(),
      whatsapp: digitsOnly(contact.whatsapp),
      instagram: sanitizeInstagram(contact.instagram),
    };
    const nextErrors = validateContact(next);
    setErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.whatsapp) {
      whatsappRef.current?.focus();
      return;
    }
    onSubmit(next);
  }

  return (
    <section className="nath-stack">
      <button type="button" className="sf-btn sf-btn--ghost" onClick={onBack}>
        Voltar
      </button>
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
            autoComplete="given-name"
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
          <label className="sf-field__label" htmlFor="nath-whatsapp">
            {CONTACT_LABELS.whatsapp}
          </label>
          <input
            ref={whatsappRef}
            id="nath-whatsapp"
            className="sf-input sf-input--lg"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            enterKeyHint="next"
            value={formatWhatsappMask(contact.whatsapp)}
            aria-invalid={Boolean(errors.whatsapp) || undefined}
            aria-describedby={errors.whatsapp ? "nath-whatsapp-error" : undefined}
            onChange={(event) => handleWhatsappChange(event.target.value)}
          />
          {errors.whatsapp ? (
            <div className="sf-field__error" id="nath-whatsapp-error" role="alert">
              {errors.whatsapp}
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
              id="nath-instagram"
              name="instagram"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              value={contact.instagram}
              onChange={(event) =>
                onChange({ ...contact, instagram: sanitizeInstagram(event.target.value) })
              }
            />
          </div>
          <div className="sf-field__hint">Opcional</div>
        </div>
        <button className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block" type="submit">
          <span className="sf-btn__label">Continuar</span>
        </button>
      </form>
    </section>
  );
}
