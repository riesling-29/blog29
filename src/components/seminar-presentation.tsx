"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { SeminarSlide } from '@/lib/seminars';
import { buildPresentationPages, type PresentationPage } from '@/lib/presentation-pages';
import { fitPresentation, PRESENTATION_MASTER as master } from '@/lib/presentation-fit';
import './seminar-presentation.css';

const masterStyle = Object.fromEntries(Object.entries(master).map(([name,value]) => [`--master-${name}`, `${value}px`])) as CSSProperties;

type Props = { documentId: string; slides: SeminarSlide[]; title: string; initialSourceIndex: number; onSourceChange: (index: number) => void; onExit: () => void };

export function SeminarPresentation({ documentId, slides, title, initialSourceIndex, onSourceChange, onExit }: Props) {
  const [pages, setPages] = useState<PresentationPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState('');
  const measure = useRef<HTMLDivElement>(null);
  const titleMeasure = useRef<HTMLHeadingElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const startingSource = useRef(initialSourceIndex);
  const current = pages[pageIndex];
  const source = current ? slides[current.sourceIndex] : undefined;

  const select = useCallback((next: number) => {
    if (!pages.length) return;
    const bounded = Math.max(0, Math.min(pages.length - 1, next));
    setPageIndex(bounded);
    onSourceChange(pages[bounded].sourceIndex);
  }, [pages, onSourceChange]);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(async () => {
      if (cancelled || !measure.current || !titleMeasure.current) return;
      try {
        const result = await buildPresentationPages(slides, measure.current, titleMeasure.current, () => cancelled, documentId);
        if (cancelled) return;
        const first = Math.max(0, result.findIndex(page => page.sourceIndex === startingSource.current));
        setPages(result); setPageIndex(first);
        if (result[first]) onSourceChange(result[first].sourceIndex);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '발표자료를 준비하지 못했습니다.');
      }
    });
    return () => { cancelled = true; };
  }, [slides, onSourceChange, documentId]);

  useLayoutEffect(() => {
    const area = viewport.current, canvas = frame.current;
    if (!area || !canvas) return;
    function fit() {
      if (!area || !canvas) return;
      const size = fitPresentation({ width: area.clientWidth, height: area.clientHeight });
      canvas.style.setProperty('--slide-width', `${size.width}px`);
      canvas.style.setProperty('--slide-height', `${size.height}px`);
      canvas.style.setProperty('--slide-scale', String(size.canvasScale));
    }
    const observer = new ResizeObserver(fit); observer.observe(area); fit();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : undefined;
      if (event.key === 'Escape') {
        event.preventDefault();
        const popup = root.current?.querySelector<HTMLDetailsElement>('.presentation-popup[open]');
        if (popup) { popup.open = false; popup.querySelector('summary')?.focus(); }
        else onExit();
        return;
      }
      if (event.key === 'Tab') {
        const dialog = root.current?.closest('.seminar-reader');
        const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select,summary,[tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (target?.closest('input,textarea,select,[contenteditable="true"],.presentation-popup[open]')) return;
      const forward = ['ArrowRight','PageDown'].includes(event.key) || (event.key === ' ' && !target?.closest('button,a,summary'));
      const backward = ['ArrowLeft','PageUp'].includes(event.key);
      if (!forward && !backward && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : pageIndex + (forward ? 1 : -1));
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [pageIndex, pages.length, select, onExit]);

  function followSection(event: MouseEvent<HTMLDivElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    const hash = anchor?.getAttribute('href')?.slice(1);
    if (!hash) return;
    const next = pages.findIndex(page => page.sourceId === hash || page.html.includes(`data-original-id="${hash}"`));
    if (next >= 0) { event.preventDefault(); select(next); }
  }

  return <div ref={root} className="seminar-presentation" style={masterStyle} onClick={followSection}>
    <div className="seminar-pager">
      <button type="button" disabled={!pages.length || pageIndex === 0} onClick={() => select(pageIndex - 1)}>← 이전</button>
      <label><span className="sr-only">발표 페이지 선택</span><select value={pageIndex} disabled={!pages.length} onChange={event => select(Number(event.target.value))}>{pages.map((page,i) => <option key={`${page.sourceId}-${page.part}`} value={i}>{i + 1}. {page.title}{page.parts > 1 ? ` (${page.part}/${page.parts})` : ''}</option>)}</select></label>
      <span role="status" aria-live="polite">{pages.length ? `${pageIndex + 1} / ${pages.length}` : '준비 중'}</span>
      <button type="button" disabled={!pages.length || pageIndex === pages.length - 1} onClick={() => select(pageIndex + 1)}>다음 →</button>
    </div>
    <div ref={viewport} className="presentation-viewport">
      <div ref={frame} className="presentation-frame">
        <section className="presentation-canvas" aria-label={current ? `${current.title}, ${pageIndex + 1}페이지` : '발표자료 준비 중'}>
          {current ? <>
            <header><p className="master-section"><span>{String(current.sourceIndex + 1).padStart(2,'0')} · {current.section}</span>{current.parts > 1 && <span>{current.part} / {current.parts}</span>}</p>
              <h2 className="master-title" id="presentation-heading" tabIndex={-1} data-reading-heading data-presentation-heading data-reading-origin={current.sourceId} data-heading-title={current.title}>{current.title}</h2>
            </header>
            <div className="seminar-slide-content master-body" data-layout={current.layout} dangerouslySetInnerHTML={{__html:current.html}} />
            <footer className="master-footer"><span>{source?.sources[0]?.name ?? title}{source && source.sources.length > 1 ? ` 외 ${source.sources.length - 1}개` : ''}</span><span>{pageIndex + 1} / {pages.length}</span></footer>
          </> : <p className="presentation-loading" role="status">{error || '발표자료 준비 중…'}</p>}
        </section>
      </div>
    </div>
    <div className="presentation-bottom"><p>← → 페이지 이동 · Esc 읽기로 돌아가기</p>
      {source && source.sources.length > 0 && <details className="presentation-popup"><summary>근거 {source.sources.length}개</summary><div>{source.sources.map(item => <p key={item.url}><a href={item.url}>{item.name}</a></p>)}</div></details>}
      {source?.notesHtml && <details className="presentation-popup"><summary>발표자 노트</summary><div dangerouslySetInnerHTML={{__html:source.notesHtml}} /></details>}
    </div>
    <div className="presentation-measure" aria-hidden="true"><h2 ref={titleMeasure} className="master-title" /><div ref={measure} className="seminar-slide-content master-body" /></div>
  </div>;
}
