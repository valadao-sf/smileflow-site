import {
  SUCCESS_BODY,
  SUCCESS_CTA,
  SUCCESS_HREF,
  SUCCESS_TITLE,
} from "./copy";

export function Success() {
  return (
    <section className="nath-stack">
      <h1 className="sf-page-title">{SUCCESS_TITLE}</h1>
      <p className="nath-lede">{SUCCESS_BODY}</p>
      <a className="sf-btn sf-btn--primary sf-btn--lg nath-btn-block" href={SUCCESS_HREF}>
        <span className="sf-btn__label">{SUCCESS_CTA}</span>
      </a>
    </section>
  );
}
