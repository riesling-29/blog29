"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { mapConnections, type KnowledgeMapData } from "@/lib/knowledge-map";
import "./knowledge-map.css";

export function KnowledgeMap({ data, selectedId, topicId }: { data: KnowledgeMapData; selectedId?: string; topicId?: string }) {
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const [touchPreview, setTouchPreview] = useState<string>();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [edge, setEdge] = useState<string>();
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLAnchorElement>());
  const expandButton = useRef<HTMLButtonElement>(null);
  const inspectorId = useId();
  const all = data.domains.flatMap(d => d.groups.flatMap(g => g.articles));
  const connections = mapConnections(data, selectedId);
  const activeId = hovered ?? focused ?? touchPreview ?? selectedId;
  const active = all.find(a => a.id === activeId);
  const connection = connections.find(c => c.id === activeId);
  const connectionId = connection?.id;
  const domain = data.domains.find(d => d.id === active?.topicId);

  useEffect(() => {
    if (!expanded) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = root.current;
    // Expanded map is a modal: Escape closes it and Tab stays within the panel.
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setExpanded(false); expandButton.current?.focus(); }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(e => e.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", keyboard); };
  }, [expanded]);

  useEffect(() => {
    if (!grid.current) return;
    function measure() {
      const frame = grid.current?.getBoundingClientRect();
      const source = selectedId ? nodes.current.get(selectedId)?.getBoundingClientRect() : undefined;
      const target = activeId ? nodes.current.get(activeId)?.getBoundingClientRect() : undefined;
      if (!connectionId || !frame || !source || !target || collapsed) { setEdge(undefined); return; }
      const x1 = source.left + source.width / 2 - frame.left;
      const y1 = source.top + source.height / 2 - frame.top;
      const x2 = target.left + target.width / 2 - frame.left;
      const y2 = target.top + target.height / 2 - frame.top;
      const middle = (y1 + y2) / 2;
      setEdge(`M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid.current);
    return () => observer.disconnect();
  }, [selectedId, activeId, connectionId, collapsed, expanded]);

  function dismiss() { setHovered(undefined); setFocused(undefined); setTouchPreview(undefined); }
  const selected = all.find(a => a.id === selectedId);
  return <>
    {expanded && <div className="knowledge-map-backdrop" onClick={() => { setExpanded(false); expandButton.current?.focus(); }} />}
    <section ref={root} className={`knowledge-map${expanded ? " knowledge-map--expanded" : ""}`} aria-label="주변 지도" role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined}>
      <div className="knowledge-map-header"><h2>주변 지도</h2><div>
        <button ref={expandButton} type="button" onClick={() => { setExpanded(!expanded); setCollapsed(false); }} aria-label={expanded ? "지도 확대 닫기" : "지도 확대"} aria-expanded={expanded}>{expanded ? "↙" : "⛶"}</button>
        <button type="button" onClick={() => { setCollapsed(!collapsed); dismiss(); }} aria-label={collapsed ? "지도 펼치기" : "지도 접기"} aria-expanded={!collapsed}>{collapsed ? "＋" : "−"}</button>
      </div></div>
      {!collapsed && <div className="knowledge-map-content">
        <div className="knowledge-map-grid" ref={grid} onMouseLeave={() => setHovered(undefined)}>
          {edge && <svg className="knowledge-map-edge" aria-hidden="true"><path d={edge} /></svg>}
          {data.domains.map(d => <div key={d.id} className={`knowledge-domain${d.id === "operations" ? " knowledge-domain--operations" : ""}`} data-active-topic={d.id === topicId || undefined}>
            <Link href={d.href} className="knowledge-domain-label" title={d.label}>{d.shortLabel}</Link>
            {d.groups.map(g => <div className="knowledge-group" key={g.href}>
              <Link className="knowledge-group-label" href={g.href} title={g.fullLabel}>{g.label}</Link>
              <div className="knowledge-tiles">{g.articles.map(a => {
                const related = connections.find(c => c.id === a.id);
                return <Link key={a.id} href={a.href} scroll={a.id === selectedId ? false : undefined} ref={element => { if (element) nodes.current.set(a.id, element); else nodes.current.delete(a.id); }}
                  className="knowledge-tile" data-current={a.id === selectedId || undefined} data-related={!!related || undefined} data-inspected={a.id === activeId || undefined}
                  aria-current={a.id === selectedId ? "page" : undefined} aria-label={`${a.title} · ${a.format === "seminar" ? "세미나" : "글"}${a.id === selectedId ? " · 현재 자료" : related ? ` · ${related.label}` : ""}`}
                  aria-describedby={a.id === activeId ? inspectorId : undefined}
                  onMouseEnter={() => setHovered(a.id)} onFocus={() => setFocused(a.id)} onBlur={() => setFocused(undefined)}
                  onPointerDown={event => { if (event.pointerType === "touch" && touchPreview !== a.id) event.currentTarget.dataset.readingPreview = "true"; else delete event.currentTarget.dataset.readingPreview; }}
                  onKeyDown={event => { if (event.key === "Enter") delete event.currentTarget.dataset.readingPreview; }}
                  onClick={event => { if (event.detail !== 0 && event.currentTarget.dataset.readingPreview === "true") { event.preventDefault(); setTouchPreview(a.id); } }}>
                  <span>{a.label}</span><small>{a.id === selectedId ? "●" : a.format === "seminar" ? "발표" : related ? "↗" : ""}</small>
                </Link>;
              })}</div>
            </div>)}
          </div>)}
        </div>
        <div className="knowledge-map-legend"><span><i className="knowledge-current-dot" />현재</span><span><i className="knowledge-related-dot" />관련</span><span className="knowledge-map-touch-hint">칸 선택 후 제목을 눌러 읽기</span></div>
        <div className="knowledge-inspector" id={inspectorId}>
          {active ? <><small>{domain?.label} / {active.groupLabel}{connection ? ` · ${connection.label}` : active.id === selectedId ? " · 현재 자료" : ""}</small>
            <Link href={active.href} className="knowledge-inspector-title">{active.title} <span aria-hidden="true">→</span></Link>
            <p>{connection ? `${connection.incoming ? "이 자료에서 현재 글로 연결: " : ""}${connection.reason}` : active.id === selectedId ? "강조된 칸에서 연결된 자료를 살펴보세요." : active.description}</p>
          </> : <p>{selected?.title ?? "칸에 포인터를 올리거나 선택하면 제목과 연결 이유가 표시됩니다."}</p>}
        </div>
      </div>}
    </section>
  </>;
}
