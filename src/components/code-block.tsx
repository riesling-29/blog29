"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

function languageLabel(pre: HTMLPreElement | null): string | null {
  if (!pre) return null;
  const fromPre = pre.getAttribute("data-language");
  if (fromPre) return fromPre;
  const code = pre.querySelector("code");
  const fromClass = code?.className.match(/language-(\S+)/)?.[1];
  return fromClass ?? null;
}

export function CodeBlockFigure({
  children,
  ...props
}: ComponentProps<"figure"> & { children?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const syncOverflow = useCallback(() => {
    const pre = wrapRef.current?.querySelector("pre");
    if (!pre) return;
    setOverflows(pre.scrollWidth > pre.clientWidth + 2);
    setLabel(languageLabel(pre));
  }, []);

  useEffect(() => {
    syncOverflow();
    const pre = wrapRef.current?.querySelector("pre");
    if (!pre) return;
    const observer = new ResizeObserver(syncOverflow);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [syncOverflow, children]);

  const onCopy = async () => {
    const code = wrapRef.current?.querySelector("code");
    const text = code?.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <figure {...props} className="code-block-figure">
      <div
        ref={wrapRef}
        className={`code-block-wrap${overflows ? " code-block-wrap--overflow" : ""}`}
      >
        <div className="code-block-toolbar">
          {label && (
            <span className="code-block-lang" aria-hidden="true">
              {label}
            </span>
          )}
          <button
            type="button"
            className="code-block-copy"
            onClick={onCopy}
            aria-label={copied ? "복사됨" : "코드 복사"}
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        {children}
      </div>
    </figure>
  );
}
