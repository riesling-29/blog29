import type { SeminarSlide } from './seminars';
import { composeSeminarSection, preservedText, type EditorialLayout } from './presentation-editorial.ts';

export type PresentationPage = {
  sourceIndex: number;
  sourceId: string;
  title: string;
  section: string;
  layout: EditorialLayout;
  html: string;
  part: number;
  parts: number;
};
type Fits = (node: HTMLElement) => boolean;
const accessories = '.title-row,.product-head,.ev,.source,.note,.code-note,.basis,.iso-caption,.recap-scope,.recap-repeat,.code-label,.lead,.definition,.sr-only,[hidden],[aria-hidden="true"],[data-presentation-repeat]';
const diagrams = '.agent-system,.recap-flow,.mathline,.vs,.system-loop,.recap-cache';
const cards = '.card,.lane,.trend,.tl,.pc-box,.section-route,.presentation-explanation,.signal,.caveat';

/** Visible substance, not just a badge, arrow, hidden caption or repeated context. */
export function hasPresentationContent(root: HTMLElement) {
  if(root.dataset.layout==='cover')return !!preservedText(root);
  const copy=root.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(accessories+',h3,h4,h5,h6').forEach(el=>el.remove());
  const value=(copy.textContent ?? '').replace(/\s+/g,'');
  return /[\p{L}\p{N}]/u.test(value) && (value.length>=16 || !!copy.querySelector('table,pre,img,svg'));
}

function wrapLike(parent: HTMLElement, children: Element[], repeat = false) {
  const copy=parent.cloneNode(false) as HTMLElement;
  copy.removeAttribute('data-editorial-columns');
  copy.dataset.editorialFragment='true';
  if(repeat)copy.dataset.presentationRepeat='true';
  copy.append(...children.map(child=>child.cloneNode(true)));
  return copy;
}

/** Only complete semantic units are breakable. Inline text, code and diagrams never split. */
function semanticUnits(node: HTMLElement): HTMLElement[] {
  if(node.matches(diagrams+',pre,p,'+cards) || !node.children.length)return [node.cloneNode(true) as HTMLElement];
  if(node.tagName==='TABLE') {
    const table=node as HTMLTableElement;
    if(table.tFoot)return [node.cloneNode(true) as HTMLElement];
    const rows=Array.from(table.tBodies).flatMap(body=>Array.from(body.rows));
    if(!rows.length)return [node.cloneNode(true) as HTMLElement];
    return rows.map((row,i)=>{
      const part=table.cloneNode(false) as HTMLTableElement;
      if(table.caption && !i)part.append(table.caption.cloneNode(true));
      if(table.tHead) {const head=table.tHead.cloneNode(true) as HTMLElement;if(i)head.dataset.presentationRepeat='true';part.append(head);}
      const body=document.createElement('tbody');body.append(row.cloneNode(true));part.append(body);return part;
    });
  }
  // Mixed inline text (for example the separator between source links) is indivisible.
  if(Array.from(node.childNodes).some(child=>child.nodeType===Node.TEXT_NODE && (child.textContent??'').trim()))return [node.cloneNode(true) as HTMLElement];
  const children=Array.from(node.children) as HTMLElement[];
  // Headings stay with the explanation. A list item and a definition pair stay intact.
  if(node.matches('li,section') && node.querySelector('h3,h4,h5,h6'))return [node.cloneNode(true) as HTMLElement];
  if(node.tagName==='DL' || node.matches('.mini-summary')) {
    const result:HTMLElement[]=[];
    for(let i=0;i<children.length;i+=2)result.push(wrapLike(node,children.slice(i,i+2)));
    return result;
  }
  if(node.matches('ul,ol'))return children.map((child,i)=>{
    const part=wrapLike(node,[child]);if(node.tagName==='OL')part.setAttribute('start',String(Number(node.getAttribute('start')??1)+i));return part;
  });
  // Inline-only wrappers are not editing boundaries.
  if(!children.some(child=>child.matches('div,section,aside,p,ul,ol,dl,table,pre')))return [node.cloneNode(true) as HTMLElement];
  const output:HTMLElement[]=[];
  for(let i=0;i<children.length;i++) {
    const child=children[i];
    if(child.matches('h3,h4,h5,h6,.code-label') && children[i+1]) {
      output.push(wrapLike(node,[child,children[++i]]));continue;
    }
    for(const unit of semanticUnits(child))output.push(wrapLike(node,[unit]));
  }
  return output;
}


function joinAdjacent(parent: HTMLElement) {
  let previous: HTMLElement | undefined;
  for(const node of Array.from(parent.children) as HTMLElement[]) {
    if(previous && previous.dataset.editorialOrigin && previous.dataset.editorialOrigin===node.dataset.editorialOrigin) {
      if(node.tagName==='TABLE') {
        const left=previous as HTMLTableElement,right=node as HTMLTableElement;
        if(left.tBodies[0] && right.tBodies[0])left.tBodies[0].append(...Array.from(right.tBodies[0].children));
      } else previous.append(...Array.from(node.childNodes));
      node.remove();
    } else previous=node;
  }
  for(const child of Array.from(parent.children) as HTMLElement[])joinAdjacent(child);
}

/** Balance complete units across pages; reject orphan-only candidates before measuring. */
export function fitEditorialPage(page: HTMLElement, fits: Fits): HTMLElement[] {
  if(hasPresentationContent(page) && fits(page))return [page];
  // An annotation rail can become a complete explanation page if the main content needs more space.
  const work=page.cloneNode(true) as HTMLElement;
  work.classList.remove('editorial-annotated');
  work.querySelectorAll('.editorial-main,.editorial-aside').forEach(el=>el.replaceWith(...Array.from(el.children)));
  if(hasPresentationContent(work) && fits(work))return [work];
  // Fragments with the same source identity can rejoin (table rows/list items),
  // without duplicating their column headings or nesting one grid per item.
  [work,...Array.from(work.querySelectorAll<HTMLElement>('*'))].forEach((node,i)=>{node.dataset.editorialOrigin=String(i);});
  const units=semanticUnits(work);
  const n=units.length;
  if(!n)throw new Error('빈 발표 페이지는 생성할 수 없습니다.');
  function assemble(start: number, end: number) {
    const output=document.createElement('div');output.className='editorial-page editorial-continuation';output.dataset.layout=page.dataset.layout;
    // Unwrap only the duplicated page shell, retaining every content/diagram wrapper.
    for(const unit of units.slice(start,end))output.append(...Array.from(unit.childNodes).map(child=>child.cloneNode(true)));
    joinAdjacent(output);
    return output;
  }
  const cache=new Map<string,HTMLElement>();
  const cost=Array<number>(n+1).fill(Infinity), next=Array<number>(n+1).fill(-1);cost[n]=0;
  for(let start=n-1;start>=0;start--) {
    for(let end=start+1;end<=n;end++) {
      if(!Number.isFinite(cost[end]))continue;
      const candidate=assemble(start,end);
      if(!hasPresentationContent(candidate)||!fits(candidate))continue;
      // First minimize page count, then penalize thin leftovers. No token-level splitting.
      const length=preservedText(candidate).length;
      const score=10000+1000/Math.max(1,length)+cost[end];
      if(score<cost[start]) {cost[start]=score;next[start]=end;cache.set(`${start}:${end}`,candidate);}
    }
  }
  if(next[0]<0)throw new Error('원문 묶음을 고정 발표 영역에 배치할 수 없습니다. 이 항목은 읽기 화면에서 확인할 수 있습니다.');
  const result:HTMLElement[]=[];
  for(let start=0;start<n;) {const end=next[start];result.push(cache.get(`${start}:${end}`)!);start=end;}
  if(result.map(preservedText).join('')!==preservedText(page))throw new Error('발표 구성의 원문 보존 검사가 실패했습니다.');
  return result;
}

export async function buildPresentationPages(
  slides: SeminarSlide[],
  measure: HTMLElement,
  titleMeasure: HTMLElement,
  cancelled: () => boolean,
  documentId: string,
): Promise<PresentationPage[]> {
  const pages:PresentationPage[]=[];
  for(const [sourceIndex,slide] of slides.entries()) {
    if(cancelled())return [];
    titleMeasure.textContent=slide.title;
    if(titleMeasure.scrollHeight>titleMeasure.clientHeight+1)throw new Error(`제목 배치 확인이 필요합니다: ${slide.title}`);
    function fits(node: HTMLElement) {
      measure.replaceChildren(node.cloneNode(true));
      return measure.scrollHeight<=measure.clientHeight+.5 && measure.scrollWidth<=measure.clientWidth+.5;
    }
    const parts=composeSeminarSection(slide,documentId,sourceIndex).flatMap(page=>fitEditorialPage(page,fits));
    parts.forEach((part,i)=>pages.push({sourceIndex,sourceId:slide.id,title:slide.title,section:slide.section,layout:part.dataset.layout as EditorialLayout,html:part.outerHTML,part:i+1,parts:parts.length}));
    if(sourceIndex%3===0)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  }
  measure.replaceChildren();return pages;
}
