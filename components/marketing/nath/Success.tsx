import {
  SUCCESS_BODY,
  SUCCESS_CTA,
  SUCCESS_HREF,
  SUCCESS_TITLE,
} from "./copy";

export function Success() {
  return (
    <section className="stack">
      <p className="brand">Nathálya</p>
      <h1>{SUCCESS_TITLE}</h1>
      <p className="lede">{SUCCESS_BODY}</p>
      <a className="link-cta" href={SUCCESS_HREF}>
        {SUCCESS_CTA}
      </a>
    </section>
  );
}
