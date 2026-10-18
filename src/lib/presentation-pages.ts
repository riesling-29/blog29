import type { SeminarSlide } from './seminars';

export type PresentationPage = {
  sourceIndex: number;
  sourceId: string;
  title: string;
  section: string;
  layout: 'cover' | 'text' | 'comparison' | 'diagram';
  html: string;
  part: number;
  parts: number;
};

type Fits = (node: Node) => boolean;
const gridClasses = ['two', 'two-col', 'vs', 'g3', 'refs', 'recap-details', 'recap-flow', 'system-loop', 'mathline', 'glossary', 'trends-2x2'];

/** Keep all source text. Repeated table headers are excluded from this comparison. */
function sourceText(node: Node) {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll?.('[data-presentation-repeat]').forEach(n => n.remove());
  return (copy.textContent ?? '').replace(/\s+/g, '');
}

function serialize(node: Node) {
  const holder = document.createElement('div');
  holder.append(node.cloneNode(true));
  return holder.innerHTML;
}

/** Split at existing semantic blocks first; split text only if a block cannot fit alone. */
function fragments(node: Node, fits: Fits): Node[] {
  if (fits(node)) return [node.cloneNode(true)];
  if (node.nodeType === Node.TEXT_NODE) {
    const chars = Array.from(node.textContent ?? '');
    const pieces: Node[] = [];
    let start = 0;
    while (start < chars.length) {
      let lo = 1, hi = chars.length - start, best = 0;
      while (lo <= hi) {
        const middle = Math.floor((lo + hi) / 2);
        if (fits(document.createTextNode(chars.slice(start, start + middle).join('')))) { best = middle; lo = middle + 1; }
        else hi = middle - 1;
      }
      if (!best) throw new Error('고정 글자 크기에서 한 글자도 배치할 수 없는 요소가 있습니다.');
      // Prefer a sentence, line or word boundary without discarding its whitespace.
      if (start + best < chars.length) {
        for (let i = best - 1; i >= Math.floor(best * .6); i--) {
          if (/[\s.!?。！？;；]/.test(chars[start + i])) { best = i + 1; break; }
        }
      }
      pieces.push(document.createTextNode(chars.slice(start, start + best).join('')));
      start += best;
    }
    return pieces;
  }
  if (!(node instanceof HTMLElement)) throw new Error('발표 양식에 배치할 수 없는 요소입니다.');
  if (node.tagName === 'TABLE') {
    const tableParts = fragmentTable(node as HTMLTableElement, fits);
    if (tableParts) return tableParts;
  }
  const shell = node.cloneNode(false) as HTMLElement;
  if (gridClasses.some(c => shell.classList.contains(c)) || ['TR', 'TBODY', 'THEAD'].includes(shell.tagName)) shell.dataset.presentationFragment = 'true';
  const children = Array.from(node.childNodes).filter(n => n.nodeType !== Node.COMMENT_NODE);
  const listStart = Number(node.getAttribute('start') ?? 1);
  if (!children.length) throw new Error(`배치 영역보다 큰 ${node.tagName} 요소를 별도 장으로 편집해야 합니다.`);
  function wrap(parts: Node[], childIndex = 0) {
    const result = shell.cloneNode(false) as HTMLElement;
    if (result.tagName === 'OL') {
      const preceding = children.slice(0, childIndex).filter(n => n instanceof HTMLElement && n.tagName === 'LI').length;
      result.setAttribute('start', String(listStart + preceding));
    }
    result.append(...parts.map(p => p.cloneNode(true)));
    return result;
  }
  const output: Node[] = [];
  let current: Node[] = [], firstChild = 0;
  for (const [childIndex, child] of children.entries()) {
    const pieces = fragments(child, piece => fits(wrap([piece], childIndex)));
    for (const piece of pieces) {
      if (current.length && !fits(wrap([...current, piece], firstChild))) {
        output.push(wrap(current, firstChild)); current = []; firstChild = childIndex;
      }
      if (!current.length) firstChild = childIndex;
      current.push(piece);
    }
  }
  if (current.length) output.push(wrap(current, firstChild));
  if (sourceText(node) !== output.map(sourceText).join('')) throw new Error('자료를 나누는 중 본문 보존 검사가 실패했습니다.');
  return output;
}

/** Repeat column headings so a continued comparison remains understandable. */
function fragmentTable(table: HTMLTableElement, fits: Fits): Node[] | undefined {
  const rows = Array.from(table.tBodies).flatMap(body => Array.from(body.rows));
  if (!rows.length) return;
  function wrap(parts: HTMLTableRowElement[], repeat: boolean) {
    const result = table.cloneNode(false) as HTMLTableElement;
    if (table.caption && !repeat) result.append(table.caption.cloneNode(true));
    if (table.tHead) {
      const head = table.tHead.cloneNode(true) as HTMLElement;
      if (repeat) head.dataset.presentationRepeat = 'true';
      result.append(head);
    }
    const body = document.createElement('tbody');
    body.append(...parts.map(row => row.cloneNode(true))); result.append(body);
    return result;
  }
  const output: Node[] = [];
  let current: HTMLTableRowElement[] = [];
  for (const row of rows) {
    if (!fits(wrap([row], output.length > 0))) return; // Generic semantic fragments handle an unusually tall row.
    if (current.length && !fits(wrap([...current, row], output.length > 0))) {
      output.push(wrap(current, output.length > 0)); current = [];
    }
    current.push(row);
  }
  if (current.length) output.push(wrap(current, output.length > 0));
  if (table.tFoot) return; // Keep uncommon table footers in the generic lossless path.
  if (sourceText(table) !== output.map(sourceText).join('')) throw new Error('비교표의 내용 보존 검사가 실패했습니다.');
  return output;
}

export async function buildPresentationPages(
  slides: SeminarSlide[],
  measure: HTMLElement,
  titleMeasure: HTMLElement,
  cancelled: () => boolean,
): Promise<PresentationPage[]> {
  const pages: PresentationPage[] = [];
  for (const [sourceIndex, slide] of slides.entries()) {
    if (cancelled()) return [];
    titleMeasure.textContent = slide.title;
    if (titleMeasure.scrollHeight > titleMeasure.clientHeight + 1) throw new Error(`제목을 2줄 이내로 편집해야 합니다: ${slide.title}`);
    const root = document.createElement('div');
    root.innerHTML = slide.html;
    // Reading IDs stay canonical; presentation duplicates never compete for those IDs.
    root.querySelectorAll<HTMLElement>('[id]').forEach(el => { el.dataset.originalId = el.id; el.removeAttribute('id'); });
    root.querySelectorAll('[aria-labelledby]').forEach(el => el.removeAttribute('aria-labelledby'));
    root.querySelectorAll('details').forEach(details => {
      const section = document.createElement('section');
      section.className = 'presentation-explanation';
      for (const child of Array.from(details.childNodes)) {
        if (child instanceof HTMLElement && child.tagName === 'SUMMARY') {
          const heading = document.createElement('h3');
          heading.append(...Array.from(child.childNodes).map(node => node.cloneNode(true)));
          section.append(heading);
        } else section.append(child.cloneNode(true));
      }
      details.replaceWith(section);
    });
    const layout = sourceIndex === 0 ? 'cover' : root.querySelector('.agent-system,.recap-flow,.mathline,.layer-stack,.box-outer,.pc-box') ? 'diagram' : root.querySelector('table,.two,.two-col,.vs,.g3') ? 'comparison' : 'text';
    function fits(node: Node) {
      measure.replaceChildren(node.cloneNode(true));
      return measure.scrollHeight <= measure.clientHeight + .5 && measure.scrollWidth <= measure.clientWidth + .5;
    }
    const parts = fragments(root, fits);
    const meaningful = parts.filter(part => (part.textContent ?? '').trim() || (part instanceof Element && part.querySelector('img,svg,hr')));
    if (sourceText(root) !== meaningful.map(sourceText).join('')) throw new Error(`본문 보존 검사가 실패했습니다: ${slide.title}`);
    meaningful.forEach((part, i) => pages.push({ sourceIndex, sourceId: slide.id, title: slide.title, section: slide.section, layout, html: serialize(part), part: i + 1, parts: meaningful.length }));
    if (sourceIndex % 3 === 0) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  measure.replaceChildren();
  return pages;
}
