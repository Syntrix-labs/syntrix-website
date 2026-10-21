import { Fragment } from "react";

// http(s)://… or www.… up to the next space. Only these become links, so a
// message can never produce a javascript:/data: href.
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
// Punctuation that usually ends a sentence rather than the link itself.
const TRAILING = /[.,!?;:'")\]}]+$/;

/** Chat text with web addresses turned into clickable links (open in a new tab). */
export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const trail = part.match(TRAILING)?.[0] || "";
        const url = trail ? part.slice(0, -trail.length) : part;
        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-emerald-300 underline decoration-emerald-300/40 underline-offset-2 transition hover:text-emerald-200"
            >
              {url}
            </a>
            {trail}
          </Fragment>
        );
      })}
    </>
  );
}
