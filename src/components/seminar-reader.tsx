"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { SeminarSlide } from "@/lib/seminars";
import "./seminar-reader.css";

function slideFromHash(slides: SeminarSlide[]) {
  const match = slides.findIndex(s => `#${s.id}` === window.location.hash);
  return match >= 0 ? match : 0;
}

export function SeminarReader({ slides, title }: { slides: SeminarSlide[]; title: string }) {
  const [presenting, setPresenting] = useState(false);
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const restoreReader = useRef<number | undefined>(undefined);
  const notesCount = slides.filter(slide => slide.notesHtml).length;

  function move(next: number) {
    const bounded = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(bounded);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${slides[bounded].id}`);
  }
  function begin() {
    const positions = slides.map((s, i) => ({ index: i, top: document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity }));
    const visible = positions.filter(p => p.top <= window.innerHeight * .35).at(-1);
    move(visible?.index ?? slideFromHash(slides));
    setPresenting(true);
  }
  function end() { restoreReader.current = index; setPresenting(false); }

  useEffect(() => {
    if (!presenting) {
      if (restoreReader.current !== undefined) {
        const restoreIndex = restoreReader.current;
        restoreReader.current = undefined;
        const frame = requestAnimationFrame(() => {
          const heading = document.getElementById(slides[restoreIndex].id);
          heading?.scrollIntoView({ block: "start", behavior: "instant" });
          heading?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
      }
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    exitButton.current?.focus();
    function keyboard(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : undefined;
      if (event.key === "Escape") { event.preventDefault(); restoreReader.current = slideFromHash(slides); setPresenting(false); return; }
      if (event.key === "Tab") {
        const elements = Array.from(root.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select,summary,[tabindex="0"]') ?? []).filter(e => e.getClientRects().length);
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (target?.closest('input,textarea,select,[contenteditable="true"]')) return;
      const forward = ["ArrowRight", "PageDown"].includes(event.key) || (event.key === " " && !target?.closest("button,a,summary"));
      const backward = ["ArrowLeft", "PageUp"].includes(event.key);
      if (!forward && !backward && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const current = slideFromHash(slides);
      const next = event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : Math.max(0, Math.min(slides.length - 1, current + (forward ? 1 : -1)));
      setIndex(next);
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${slides[next].id}`);
    }
    window.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", keyboard); };
  }, [presenting, slides]);

  useEffect(() => {
    if (presenting) root.current?.querySelector(".seminar-pages")?.scrollTo({ top: 0, behavior: "instant" });
  }, [index, presenting]);

  function followSection(event: MouseEvent<HTMLDivElement>) {
    if (!presenting || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!anchor) return;
    const next = slides.findIndex(s => `#${s.id}` === anchor.getAttribute("href"));
    if (next >= 0) { event.preventDefault(); move(next); }
  }

  return <div ref={root} className={`seminar-reader${presenting ? " seminar-reader--presenting" : ""}`} role={presenting ? "dialog" : undefined} aria-modal={presenting || undefined} aria-label={presenting ? `${title} 발표 모드` : undefined} onClick={followSection}>
    <div className="seminar-reader-toolbar">
      <div className="seminar-view-switch" role="group" aria-label="세미나 보기 방식">
        <button type="button" ref={exitButton} aria-pressed={!presenting} onClick={presenting ? end : undefined}>읽기</button>
        <button type="button" aria-pressed={presenting} onClick={!presenting ? begin : undefined}>발표 모드</button>
      </div>
      {presenting ? <><span className="seminar-present-title">{title}</span><button type="button" onClick={end} className="seminar-exit">발표 종료 <span>Esc</span></button></> : <span className="seminar-slide-count">{slides.length}개 자료{notesCount > 0 && ` · 발표자 노트 ${notesCount}개`}</span>}
    </div>
    {presenting && <div className="seminar-pager">
      <button type="button" disabled={index === 0} onClick={() => move(index - 1)} aria-label="이전 자료">← 이전</button>
      <label><span className="sr-only">자료 선택</span><select value={index} onChange={event => move(Number(event.target.value))}>{slides.map((s, i) => <option key={s.id} value={i}>{s.number}. {s.title}</option>)}</select></label>
      <span role="status" aria-live="polite">{index + 1} / {slides.length}</span>
      <button type="button" disabled={index === slides.length - 1} onClick={() => move(index + 1)} aria-label="다음 자료">다음 →</button>
    </div>}
    <div className="seminar-pages">{slides.map((slide, i) => <section className="seminar-page" key={slide.id} hidden={presenting && i !== index} data-seminar-slide={slide.id}>
      <header className="seminar-page-heading"><p><span>{String(slide.number).padStart(2, "0")}</span> {slide.section}</p><h2 id={slide.id} tabIndex={-1} data-reading-heading data-heading-title={slide.title}>{slide.title}</h2></header>
      <div className="seminar-slide-content" dangerouslySetInnerHTML={{ __html: slide.html }} />
      {slide.sources.length > 0 && <div className="seminar-sources"><span>근거</span>{slide.sources.map(source => <a key={source.url} href={source.url}>{source.name}</a>)}</div>}
      {slide.notesHtml && <details className="seminar-speaker-notes"><summary>발표자 노트</summary><div dangerouslySetInnerHTML={{ __html: slide.notesHtml }} /></details>}
    </section>)}</div>
    {presenting && <p className="seminar-present-hint">← → 자료 이동 · Esc 읽기로 돌아가기</p>}
  </div>;
}
