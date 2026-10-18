"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SeminarSlide } from '@/lib/seminars';
import { SeminarPresentation } from './seminar-presentation';
import './seminar-reader.css';

export function SeminarReader({ slides, title, documentId }: { documentId: string; slides: SeminarSlide[]; title: string }) {
  const [presenting, setPresenting] = useState(false);
  const [startSource, setStartSource] = useState(0);
  const exitButton = useRef<HTMLButtonElement>(null);
  const selectedSource = useRef(0);
  const restoreReader = useRef<number | undefined>(undefined);
  const notesCount = slides.filter(slide => slide.notesHtml).length;

  const selectSource = useCallback((index: number) => {
    selectedSource.current = index;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${slides[index].id}`);
  }, [slides]);
  function begin() {
    const positions = slides.map((slide,i) => ({ index:i, top:document.getElementById(slide.id)?.getBoundingClientRect().top ?? Infinity }));
    const visible = positions.filter(position => position.top <= window.innerHeight * .35).at(-1);
    const fromHash = slides.findIndex(slide => `#${slide.id}` === window.location.hash);
    const start = visible?.index ?? Math.max(0,fromHash);
    selectSource(start);
    setStartSource(start);
    setPresenting(true);
  }
  const end = useCallback(() => { restoreReader.current = selectedSource.current; setPresenting(false); }, []);

  useEffect(() => {
    if (!presenting) {
      if (restoreReader.current === undefined) return;
      const restoreIndex = restoreReader.current;
      restoreReader.current = undefined;
      const frame = requestAnimationFrame(() => {
        const heading = document.getElementById(slides[restoreIndex].id);
        heading?.scrollIntoView({block:'start',behavior:'instant'});
        heading?.focus({preventScroll:true});
      });
      return () => cancelAnimationFrame(frame);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    exitButton.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, [presenting,slides]);

  return <div className={`seminar-reader${presenting ? ' seminar-reader--presenting' : ''}`} role={presenting ? 'dialog' : undefined} aria-modal={presenting || undefined} aria-label={presenting ? `${title} 발표 모드` : undefined}>
    <div className="seminar-reader-toolbar">
      <div className="seminar-view-switch" role="group" aria-label="세미나 보기 방식">
        <button type="button" ref={exitButton} aria-pressed={!presenting} onClick={presenting ? end : undefined}>읽기</button>
        <button type="button" aria-pressed={presenting} onClick={!presenting ? begin : undefined}>발표 모드</button>
      </div>
      {presenting ? <><span className="seminar-present-title">{title}</span><button type="button" onClick={end} className="seminar-exit">발표 종료 <span>Esc</span></button></> : <span className="seminar-slide-count">{slides.length}개 자료{notesCount > 0 && ` · 발표자 노트 ${notesCount}개`}</span>}
    </div>
    <div className="seminar-pages" hidden={presenting}>{slides.map(slide => <section className="seminar-page" key={slide.id} data-seminar-slide={slide.id}>
      <header className="seminar-page-heading"><p><span>{String(slide.number).padStart(2,'0')}</span> {slide.section}</p><h2 id={slide.id} tabIndex={-1} data-reading-heading data-heading-title={slide.title}>{slide.title}</h2></header>
      <div className="seminar-slide-content" dangerouslySetInnerHTML={{__html:slide.html}} />
      {slide.sources.length > 0 && <div className="seminar-sources"><span>근거</span>{slide.sources.map(source => <a key={source.url} href={source.url}>{source.name}</a>)}</div>}
      {slide.notesHtml && <details className="seminar-speaker-notes"><summary>발표자 노트</summary><div dangerouslySetInnerHTML={{__html:slide.notesHtml}} /></details>}
    </section>)}</div>
    {presenting && <SeminarPresentation documentId={documentId} slides={slides} title={title} initialSourceIndex={startSource} onSourceChange={selectSource} onExit={end} />}
  </div>;
}
