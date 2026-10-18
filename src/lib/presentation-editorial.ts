import type { SeminarSlide } from './seminars';

export type EditorialLayout = 'cover' | 'text' | 'comparison' | 'diagram' | 'reference' | 'annotated';
type Cut = { selector: string; sizes: number[]; columns?: number; rows?: boolean };
type Plan = { layout: EditorialLayout; cut?: Cut; rail?: boolean };
const text = (): Plan => ({layout:'text'});
const compare = (): Plan => ({layout:'comparison'});
const diagram = (): Plan => ({layout:'diagram'});
const cut = (selector: string, sizes: number[], columns = 1, layout: EditorialLayout = 'comparison'): Plan => ({layout,cut:{selector,sizes,columns}});
const annotated = (): Plan => ({layout:'annotated',rail:true});

/** An editorial decision for each source section; no source text lives in this file. */
export const SEMINAR_EDITIONS: Record<string, Plan[]> = {
  'ai-agent-harness-seminar': [
    {layout:'cover'},
    // The process and the Q/K/V explanation are separate complete diagrams.
    {layout:'diagram',cut:{selector:':root',sizes:[3,1]}},
    compare(), text(), text(), diagram(), text(), diagram(), diagram(),
    cut('.two',[1,1]), text(), compare(), compare(), text(),
    cut('.two',[1,1]), text(), compare(), compare(), cut('.two',[1,1]),
    text(), compare(), text(), text(), text(), text(), text(), compare(), text(), text(), text(),
    compare(), text(), diagram(), text(), cut('.refs',[5,5],2,'reference'),
  ],
  'persistent-work-agents-seminar': [
    {layout:'cover'}, compare(), cut('.g3',[1,1,1]),
    cut('.glance',[2,2],2),
    {layout:'comparison',cut:{selector:'table',sizes:[2,2],rows:true}},
    cut('.iso',[2,1],2,'diagram'),
    cut('.product',[1,1]),
    cut('.trends-2x2',[2,2],2),
    {layout:'comparison'},
    cut('.wrap',[1,1],1,'reference'),
  ],
  'saif-2026-seminar': [
    {layout:'cover'}, annotated(), annotated(), annotated(), annotated(),
    annotated(), annotated(), annotated(), annotated(), annotated(),
    annotated(), annotated(), annotated(), annotated(), annotated(),
    annotated(), annotated(), annotated(), annotated(), annotated(),
    annotated(), annotated(), annotated(), annotated(), annotated(),
    annotated(), annotated(), text(), {layout:'reference',rail:true}, {layout:'reference',rail:true},
  ],
};

export function preservedText(root: Element) {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll('[data-presentation-repeat]').forEach(node=>node.remove());
  return (clone.textContent ?? '').replace(/\s+/g,'');
}

function prepare(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll<HTMLElement>('[id]').forEach(el=>{el.dataset.originalId=el.id;el.removeAttribute('id');});
  root.querySelectorAll('[aria-labelledby]').forEach(el=>el.removeAttribute('aria-labelledby'));
  root.querySelectorAll('details').forEach(details=>{
    const section=document.createElement('section');section.className='presentation-explanation';
    for(const child of Array.from(details.childNodes)) {
      if(child instanceof HTMLElement && child.tagName==='SUMMARY') {
        const heading=document.createElement('h3');heading.append(...Array.from(child.childNodes));section.append(heading);
      } else section.append(child.cloneNode(true));
    }
    details.replaceWith(section);
  });
  return root;
}

/** Preserve wrappers and exact source order while cutting only a reviewed semantic boundary. */
function cutRoot(root: HTMLElement, rule: Cut): HTMLElement[] {
  const target = rule.selector === ':root' ? root : root.querySelector<HTMLElement>(rule.selector);
  if(!target) throw new Error(`편집 대상이 없습니다: ${rule.selector}`);
  const rows = rule.rows ? Array.from((target as HTMLTableElement).tBodies).flatMap(body=>Array.from(body.rows)) : null;
  const children = rows ?? Array.from(target.children);
  if(rule.sizes.reduce((a,b)=>a+b,0)!==children.length) throw new Error(`편집 양식과 원문 항목 수가 다릅니다: ${rule.selector}`);
  const originalChildren = Array.from(root.children);
  const top = target === root ? undefined : originalChildren.find(child=>child===target || child.contains(target));
  let offset=0;
  return rule.sizes.map((count,index)=>{
    const copy=root.cloneNode(true) as HTMLElement;
    const partTarget=rule.selector===':root'?copy:copy.querySelector<HTMLElement>(rule.selector)!;
    if(rows) {
      const table=partTarget as HTMLTableElement;
      Array.from(table.tBodies).forEach(body=>body.remove());
      const body=document.createElement('tbody');body.append(...children.slice(offset,offset+count).map(node=>node.cloneNode(true)));table.append(body);
      if(index>0) {
        if(table.tHead)table.tHead.dataset.presentationRepeat='true';
        table.caption?.remove();
      }
    } else {
      partTarget.replaceChildren(...children.slice(offset,offset+count).map(node=>node.cloneNode(true)));
      if(rule.columns) partTarget.dataset.editorialColumns=String(Math.min(count,rule.columns));
    }
    if(top) {
      const topIndex=originalChildren.indexOf(top);
      // Context badges recur with their content; no badge/note ever receives its own page.
      Array.from(copy.children).forEach((child,i)=>{
        if(i<topIndex && index>0) (child as HTMLElement).dataset.presentationRepeat='true';
        if(i>topIndex && index<rule.sizes.length-1) child.remove();
      });
    }
    offset+=count;
    return copy;
  });
}

function addRail(root: HTMLElement) {
  const children=Array.from(root.children);
  const start=children.findIndex(el=>el.matches('.presentation-explanation,.caveat,.source,.body-copy'));
  if(start<1)return;
  const main=document.createElement('div'), aside=document.createElement('aside');
  main.className='editorial-main';aside.className='editorial-aside';
  main.append(...children.slice(0,start));aside.append(...children.slice(start));
  root.replaceChildren(main,aside);root.classList.add('editorial-annotated');
}

export function composeSeminarSection(slide: SeminarSlide, documentId: string, sourceIndex: number) {
  const plan=SEMINAR_EDITIONS[documentId]?.[sourceIndex];
  if(!plan)throw new Error(`세미나 편집 양식이 없습니다: ${documentId}/${slide.id}`);
  const source=prepare(slide.html);
  const parts=plan.cut?cutRoot(source,plan.cut):[source.cloneNode(true) as HTMLElement];
  if(parts.map(preservedText).join('')!==preservedText(source))throw new Error(`편집 중 원문이 달라졌습니다: ${slide.title}`);
  for(const part of parts) {
    part.classList.add('editorial-page');part.dataset.layout=plan.layout;
    if(plan.rail)addRail(part);
  }
  return parts;
}
